import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClinicalHistory } from './clinical-history.entity';

@Entity('clinical_history_files')
export class ClinicalHistoryFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClinicalHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinical_history_id' })
  clinicalHistory: ClinicalHistory;

  @Column({ name: 'clinical_history_id' })
  clinicalHistoryId: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column()
  url: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
