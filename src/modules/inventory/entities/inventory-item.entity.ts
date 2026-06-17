import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  category: string;

  @Column({ type: 'text', default: 'unidad' })
  unit: string;

  @Column({ type: 'text', nullable: true })
  sku: string;

  @Column({ name: 'current_stock', type: 'numeric', precision: 12, scale: 2, default: 0 })
  currentStock: number;

  @Column({ name: 'min_stock', type: 'numeric', precision: 12, scale: 2, default: 0 })
  minStock: number;

  @Column({ name: 'unit_cost', type: 'numeric', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
