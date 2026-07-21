import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { Between, In, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { SettingsService } from '../../settings/services/settings.service';
import { WhatsappService } from '../../whatsapp/services/whatsapp.service';
import {
  CACHE_TTL_SECONDS,
  HORIZON_DAYS,
  JOB_SEND,
  JOB_SWEEP,
  REDIS_CLIENT,
  REMINDERS_QUEUE,
  SWEEP_EVERY_MS,
  cacheKey,
} from '../reminders.constants';

// Snapshot mínimo que el worker necesita para enviar el mensaje (evita ir a la
// BDD en cada envío). Se guarda en Redis con TTL de 7 días.
interface CachedAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  phones: string[]; // paciente + apoderados (si es menor)
  appointmentDate: string; // ISO
}

@Injectable()
export class RemindersService implements OnModuleInit {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectQueue(REMINDERS_QUEUE) private readonly queue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly settings: SettingsService,
    private readonly whatsapp: WhatsappService,
  ) {}

  async onModuleInit() {
    // Job repetible cada 25 min que refresca la caché y reconcilia recordatorios.
    try {
      await this.queue.add(
        JOB_SWEEP,
        {},
        {
          repeat: { every: SWEEP_EVERY_MS },
          jobId: 'reminders-sweep',
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch (e) {
      this.logger.error(`No se pudo registrar el sweep de recordatorios: ${e}`);
    }
  }

  // ─── Programación de un recordatorio ────────────────────────────────────────
  // Llamado desde AppointmentsService (create/update) y desde el sweep.
  async scheduleReminder(appointmentId: string): Promise<void> {
    const appt = await this.appointments.findOne({
      where: { id: appointmentId },
      relations: { patient: true, doctor: true },
    });
    if (!appt) return;

    // Solo citas futuras, vigentes y sin recordatorio enviado.
    const active =
      appt.status === AppointmentStatus.SCHEDULED || appt.status === AppointmentStatus.CONFIRMED;
    if (!active || appt.reminderSentAt) {
      await this.cancelReminder(appointmentId);
      return;
    }

    const settings = await this.settings.get();
    const leadMs = (settings.whatsappReminderLeadMinutes ?? 60) * 60 * 1000;
    const fireAt = new Date(appt.appointmentDate).getTime() - leadMs;
    const delay = fireAt - Date.now();
    if (delay <= 0) {
      // La ventana ya pasó (cita muy próxima o creada tarde): no programar.
      return;
    }

    // Guardamos snapshot en caché y (re)programamos el job delayed.
    await this.cacheAppointment(appt);
    await this.removeJob(appointmentId);
    await this.queue.add(
      JOB_SEND,
      { appointmentId },
      {
        jobId: appointmentId,
        delay,
        removeOnComplete: { age: CACHE_TTL_SECONDS },
        removeOnFail: { age: CACHE_TTL_SECONDS },
      },
    );
  }

  async cancelReminder(appointmentId: string): Promise<void> {
    await this.removeJob(appointmentId);
    await this.redis.del(cacheKey(appointmentId));
  }

  private async removeJob(appointmentId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(appointmentId);
      if (job) await job.remove();
    } catch {
      /* el job puede no existir o estar activo; se ignora */
    }
  }

  private async cacheAppointment(appt: Appointment): Promise<void> {
    const snapshot = this.toSnapshot(appt);
    await this.redis.set(cacheKey(appt.id), JSON.stringify(snapshot), 'EX', CACHE_TTL_SECONDS);
  }

  private toSnapshot(appt: Appointment): CachedAppointment {
    const patient = appt.patient;
    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`.trim()
      : (appt.guestName ?? 'Paciente');
    const doctorName = appt.doctor
      ? `${appt.doctor.firstName} ${appt.doctor.lastName}`.trim()
      : '';

    const phones: string[] = [];
    if (patient?.phone) phones.push(patient.phone);
    // Si el paciente es menor de edad, avisar también a los apoderados.
    if (patient && this.isMinor(patient.birthDate)) {
      if (patient.telefonoMadre) phones.push(patient.telefonoMadre);
      if (patient.telefonoPadre) phones.push(patient.telefonoPadre);
    }

    return {
      id: appt.id,
      patientName,
      doctorName,
      phones: [...new Set(phones)],
      appointmentDate: new Date(appt.appointmentDate).toISOString(),
    };
  }

  private isMinor(birthDate: Date | string | null | undefined): boolean {
    if (!birthDate) return false;
    const b = new Date(birthDate);
    if (Number.isNaN(b.getTime())) return false;
    const ageMs = Date.now() - b.getTime();
    const age = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    return age < 18;
  }

  // ─── Envío (ejecutado por el worker cuando dispara el job delayed) ───────────
  async sendReminder(appointmentId: string): Promise<void> {
    const settings = await this.settings.get();
    if (!settings.whatsappEnabled || !settings.notifyAppointmentReminders) return;
    if (!this.whatsapp.isConnected()) {
      this.logger.warn(`WhatsApp desconectado; no se envió recordatorio ${appointmentId}.`);
      return;
    }

    // Re-validar en la BDD (fuente de verdad de status/reminderSentAt).
    const appt = await this.appointments.findOne({
      where: { id: appointmentId },
      relations: { patient: true, doctor: true },
    });
    if (!appt) return;
    const active =
      appt.status === AppointmentStatus.SCHEDULED || appt.status === AppointmentStatus.CONFIRMED;
    if (!active || appt.reminderSentAt) return;

    // Snapshot desde caché; si expiró, se reconstruye desde la BDD.
    let snapshot: CachedAppointment | null = null;
    const raw = await this.redis.get(cacheKey(appointmentId));
    if (raw) {
      try {
        snapshot = JSON.parse(raw) as CachedAppointment;
      } catch {
        snapshot = null;
      }
    }
    if (!snapshot) snapshot = this.toSnapshot(appt);

    if (snapshot.phones.length === 0) {
      this.logger.warn(`Cita ${appointmentId} sin teléfono; no se envía recordatorio.`);
      return;
    }

    const message = this.renderTemplate(settings.whatsappReminderTemplate, snapshot, settings.clinicName);

    let anySent = false;
    for (const phone of snapshot.phones) {
      try {
        await this.whatsapp.sendText(phone, message);
        anySent = true;
      } catch (e) {
        this.logger.error(`Error enviando recordatorio a ${phone}: ${e}`);
      }
    }

    if (anySent) {
      appt.reminderSentAt = new Date();
      await this.appointments.save(appt);
      await this.redis.del(cacheKey(appointmentId));
    }
  }

  private renderTemplate(template: string, appt: CachedAppointment, clinicName: string): string {
    const date = new Date(appt.appointmentDate);
    const fecha = date.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Lima',
    });
    const hora = date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Lima',
    });
    return (template || '')
      .replace(/{paciente}/g, appt.patientName)
      .replace(/{fecha}/g, fecha)
      .replace(/{hora}/g, hora)
      .replace(/{doctor}/g, appt.doctorName)
      .replace(/{clinica}/g, clinicName ?? '');
  }

  // ─── Sweep: refresca Redis desde la BDD y reconcilia jobs (cada 25 min) ──────
  async runSweep(): Promise<void> {
    const now = new Date();
    const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);

    const upcoming = await this.appointments.find({
      where: {
        appointmentDate: Between(now, horizon),
        status: In([AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]),
      },
      relations: { patient: true, doctor: true },
    });

    for (const appt of upcoming) {
      if (appt.reminderSentAt) continue;
      await this.scheduleReminder(appt.id);
    }
    this.logger.log(`Sweep de recordatorios: ${upcoming.length} cita(s) próximas reconciliadas.`);
  }
}
