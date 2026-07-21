import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { TreatmentCatalogItem } from '../../treatment-catalog/entities/treatment-catalog-item.entity';

// Una línea del presupuesto: un tratamiento (del catálogo) para un diente.
@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Budget, (b) => b.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'budget_id' })
  budgetId: string;

  // Diente FDI (ej. "16"). Null = tratamiento general (no ligado a un diente).
  @Column({ name: 'tooth_number', type: 'varchar', nullable: true })
  toothNumber: string | null;

  // Referencia al catálogo (SET NULL si se borra el item del catálogo).
  @ManyToOne(() => TreatmentCatalogItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'treatment_catalog_item_id' })
  catalogItem: TreatmentCatalogItem | null;

  @Column({ name: 'treatment_catalog_item_id', nullable: true })
  treatmentCatalogItemId: string | null;

  // Snapshots (el nombre/precio se conservan aunque cambie el catálogo).
  @Column({ name: 'treatment_name', type: 'text' })
  treatmentName: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
