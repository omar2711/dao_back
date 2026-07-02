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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
