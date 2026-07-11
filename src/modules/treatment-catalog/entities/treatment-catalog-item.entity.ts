import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TreatmentCategory {
  ADULTO = 'ADULTO',
  NINO = 'NINO',
  ORTODONCIA = 'ORTODONCIA',
}

// Catálogo fijo de tratamientos con precio editable por el administrador.
@Entity('treatment_catalog_items')
export class TreatmentCatalogItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: TreatmentCategory.ADULTO })
  category: TreatmentCategory;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
