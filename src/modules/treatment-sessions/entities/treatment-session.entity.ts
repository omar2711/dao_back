import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('treatment_sessions')
export class TreatmentSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Treatment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treatment_id' })
  treatment: Treatment;

  @Column({ name: 'treatment_id' })
  treatmentId: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'payment_doctor_id' })
  paymentDoctor: Doctor;

  @Column({ name: 'payment_doctor_id', nullable: true })
  paymentDoctorId: string;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ name: 'session_date', type: 'date' })
  sessionDate: string;

  @Column({ name: 'procedure_done', type: 'text' })
  procedureDone: string;

  @Column({ name: 'teeth_treated', type: 'text', array: true, default: '{}' })
  teethTreated: string[];

  @Column({ name: 'amount_charged', type: 'numeric', precision: 10, scale: 2, default: 0 })
  amountCharged: number;

  @Column({ name: 'amount_paid', type: 'numeric', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
