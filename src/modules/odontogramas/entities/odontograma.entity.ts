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
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { ClinicalHistory } from '../../clinical-histories/entities/clinical-history.entity';

export enum OdontogramaTipo {
  INICIAL = 'INICIAL',
  EVOLUCION = 'EVOLUCION',
}

// Shape of each tooth entry in teeth_data JSONB
// { "11": [{ code: "AM", color: "blue", surfaces: ["O","M"], type: "RESTAURACION_DEFINITIVA" }] }

@Entity('odontogramas')
// Máximo un odontograma por historia clínica (cuando está vinculado a una).
@Index('uq_odontograma_ch', ['clinicalHistoryId'], {
  unique: true,
  where: '"clinical_history_id" IS NOT NULL',
})
export class Odontograma {
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

  @Column({ type: 'varchar', default: OdontogramaTipo.INICIAL })
  tipo: OdontogramaTipo;

  @Column({ type: 'date' })
  fecha: string;

  // JSONB: Record<toothNumber, ToothFinding[]>
  @Column({ name: 'teeth_data', type: 'jsonb', default: {} })
  teethData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  especificaciones: string;

  // Se muestra como "Diagnóstico" en la UI
  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ name: 'plan_tratamiento', type: 'text', nullable: true })
  planTratamiento: string;

  // JSONB: Record<toothNumber, { tooth?: string, surfaces?: Record<string, string>, roots?: string[] }>
  @Column({ name: 'tooth_observations', type: 'jsonb', nullable: true, default: {} })
  toothObservations: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
