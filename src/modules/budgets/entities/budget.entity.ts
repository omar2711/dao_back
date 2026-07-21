import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Odontograma } from '../../odontogramas/entities/odontograma.entity';
import { ClinicalHistory } from '../../clinical-histories/entities/clinical-history.entity';
import { BudgetItem } from './budget-item.entity';

export enum BudgetStatus {
  BORRADOR = 'BORRADOR',
  ENVIADO = 'ENVIADO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

// Presupuesto/cotización armado desde el odontograma (tratamientos por diente
// tomados del catálogo con precios). Al aprobarse genera los Tratamientos reales.
@Entity('budgets')
export class Budget {
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

  @ManyToOne(() => Odontograma, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'odontograma_id' })
  odontograma: Odontograma | null;

  @Column({ name: 'odontograma_id', nullable: true })
  odontogramaId: string | null;

  @ManyToOne(() => ClinicalHistory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clinical_history_id' })
  clinicalHistory: ClinicalHistory | null;

  @Column({ name: 'clinical_history_id', nullable: true })
  clinicalHistoryId: string | null;

  @Column({ type: 'varchar', default: BudgetStatus.BORRADOR })
  status: BudgetStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Momento en que se aprobó (y se generaron los tratamientos).
  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @OneToMany(() => BudgetItem, (item) => item.budget, { cascade: true, eager: true })
  items: BudgetItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
