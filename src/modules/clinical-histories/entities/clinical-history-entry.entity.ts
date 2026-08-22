import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';

// Hoja de evolución (NTS 150-MINSA-2019): cada consulta posterior a la
// apertura de la historia clínica se registra aquí como una actualización
// fechada, en lugar de crear una historia clínica nueva.
@Entity('clinical_history_entries')
@Index('idx_clinical_history_entries_history', ['clinicalHistoryId', 'fecha'])
export class ClinicalHistoryEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicalHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinical_history_id' })
  clinicalHistory: ClinicalHistory;

  @Column({ name: 'clinical_history_id' })
  clinicalHistoryId: string;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fecha: string;

  // Motivo o molestia que trae al paciente en esta visita.
  @Column({ type: 'text', nullable: true })
  motivo: string;

  // Procedimiento efectivamente realizado.
  @Column({ type: 'text', nullable: true })
  procedimiento: string;

  // Indicaciones y receta entregadas al paciente.
  @Column({ type: 'text', nullable: true })
  indicaciones: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
