import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId: string | null;

  @Column({ name: 'guest_name', type: 'text', nullable: true })
  guestName: string | null;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @Column({ name: 'appointment_date', type: 'timestamptz' })
  appointmentDate: Date;

  @Column({ name: 'duration_minutes', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Patient, (p) => p.appointments, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient | null;

  @ManyToOne(() => Doctor, (d) => d.appointments, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;
}
