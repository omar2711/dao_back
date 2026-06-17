import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { Doctor } from '../../doctors/entities/doctor.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { TreatmentSession } from '../../treatment-sessions/entities/treatment-session.entity';

export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUST';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ name: 'item_id' })
  itemId: string;

  @Column({ type: 'varchar', length: 10 })
  type: InventoryMovementType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  quantity: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @ManyToOne(() => Doctor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: string;

  @ManyToOne(() => Treatment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'treatment_id' })
  treatment: Treatment;

  @Column({ name: 'treatment_id', nullable: true })
  treatmentId: string;

  @ManyToOne(() => TreatmentSession, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'treatment_session_id' })
  treatmentSession: TreatmentSession;

  @Column({ name: 'treatment_session_id', nullable: true })
  treatmentSessionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
