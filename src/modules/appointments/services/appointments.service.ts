import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { FilterAppointmentDto } from '../dto/filter-appointment.dto';
import { RemindersService } from '../../reminders/services/reminders.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment) private repo: Repository<Appointment>,
    private readonly reminders: RemindersService,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.repo.create(dto);
    const saved = await this.repo.save(appointment);
    // Programa el recordatorio de WhatsApp (Redis + BullMQ).
    await this.reminders.scheduleReminder(saved.id).catch(() => undefined);
    return saved;
  }

  findAll(filter: FilterAppointmentDto): Promise<Appointment[]> {
    const where: any = {};

    if (filter.doctorId) where.doctorId = filter.doctorId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.status) where.status = filter.status;

    if (filter.date) {
      const start = new Date(filter.date + 'T00:00:00.000Z');
      const end = new Date(filter.date + 'T23:59:59.999Z');
      where.appointmentDate = Between(start, end);
    } else if (filter.from || filter.to) {
      const start = new Date((filter.from ?? filter.to) + 'T00:00:00.000Z');
      const end = new Date((filter.to ?? filter.from) + 'T23:59:59.999Z');
      where.appointmentDate = Between(start, end);
    }

    return this.repo.find({
      where,
      relations: { patient: true, doctor: true },
      order: { appointmentDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.repo.findOne({
      where: { id },
      relations: { patient: true, doctor: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    // Si se reprograma (cambia fecha/hora), se limpia el recordatorio ya enviado
    // para que se vuelva a programar con la nueva fecha.
    const dateChanged =
      dto.appointmentDate !== undefined &&
      new Date(dto.appointmentDate).getTime() !== new Date(appointment.appointmentDate).getTime();
    if (dateChanged) appointment.reminderSentAt = null;

    Object.assign(appointment, dto);
    const saved = await this.repo.save(appointment);
    // Reprograma (o cancela si ya no aplica) el recordatorio.
    await this.reminders.scheduleReminder(saved.id).catch(() => undefined);
    return saved;
  }

  async remove(id: string): Promise<{ message: string }> {
    const appointment = await this.findOne(id);
    await this.repo.remove(appointment);
    await this.reminders.cancelReminder(id).catch(() => undefined);
    return { message: 'Appointment deleted' };
  }
}
