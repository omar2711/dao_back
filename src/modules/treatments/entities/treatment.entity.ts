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
import { ClinicalHistory } from '../../clinical-histories/entities/clinical-history.entity';

export enum TreatmentStatus {
  PROGRAMADO = 'PROGRAMADO',
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADO = 'COMPLETADO',
  PAUSADO = 'PAUSADO',
}

@Entity('treatments')
export class Treatment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id' })
  doctorId: string;

  @ManyToOne(() => ClinicalHistory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinical_history_id' })
  clinicalHistory: ClinicalHistory;

  @Column({ name: 'clinical_history_id', nullable: true })
  clinicalHistoryId: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'varchar', default: TreatmentStatus.PROGRAMADO })
  status: TreatmentStatus;

  @Column({ name: 'teeth_affected', type: 'text', array: true, default: '{}' })
  teethAffected: string[];

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  cost: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  paid: number;

  @Column({ type: 'smallint', default: 0 })
  progress: number;

  @Column({ name: 'total_sessions', type: 'int', default: 1 })
  totalSessions: number;

  @Column({ name: 'sessions_done', type: 'int', default: 0 })
  sessionsDone: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
