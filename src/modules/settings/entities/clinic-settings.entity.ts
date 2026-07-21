import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// Fila única (singleton) con la configuración general de la clínica.
@Entity('clinic_settings')
export class ClinicSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_name', default: 'DAO Dent' })
  clinicName: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'notify_appointments_confirmed', default: true })
  notifyAppointmentsConfirmed: boolean;

  @Column({ name: 'notify_appointment_reminders', default: true })
  notifyAppointmentReminders: boolean;

  @Column({ name: 'notify_new_patients', default: true })
  notifyNewPatients: boolean;

  // Duración de la sesión (formato de expiración JWT, ej. '8h', '7d', '30d').
  @Column({ name: 'session_duration', default: '7d' })
  sessionDuration: string;

  // ─── WhatsApp (Baileys) — recordatorios de citas ──────────────────────────
  // Activa/desactiva el envío de recordatorios por WhatsApp.
  @Column({ name: 'whatsapp_enabled', default: false })
  whatsappEnabled: boolean;

  // Minutos de anticipación con que se envía el recordatorio (30 o 60).
  @Column({ name: 'whatsapp_reminder_lead_minutes', type: 'int', default: 60 })
  whatsappReminderLeadMinutes: number;

  // Plantilla del mensaje. Variables: {paciente} {fecha} {hora} {doctor} {clinica}.
  @Column({
    name: 'whatsapp_reminder_template',
    type: 'text',
    default:
      'Hola {paciente}, le recordamos su cita el {fecha} a las {hora} con el Dr(a). {doctor}. {clinica}',
  })
  whatsappReminderTemplate: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
