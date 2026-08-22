import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalHistoryEntry } from '../entities/clinical-history-entry.entity';
import { CreateClinicalHistoryEntryDto } from '../dto/create-clinical-history-entry.dto';
import { UpdateClinicalHistoryEntryDto } from '../dto/update-clinical-history-entry.dto';

// Hoja de evolución: actualizaciones fechadas sobre la historia clínica única
// del paciente.
@Injectable()
export class ClinicalHistoryEntriesService {
  constructor(
    @InjectRepository(ClinicalHistoryEntry)
    private repo: Repository<ClinicalHistoryEntry>,
  ) {}

  create(
    clinicalHistoryId: string,
    dto: CreateClinicalHistoryEntryDto,
  ): Promise<ClinicalHistoryEntry> {
    const record = this.repo.create({
      ...dto,
      clinicalHistoryId,
      fecha: dto.fecha ?? new Date().toISOString().slice(0, 10),
    });
    return this.repo.save(record);
  }

  // Más recientes primero; created_at desempata varias del mismo día.
  findByHistory(clinicalHistoryId: string): Promise<ClinicalHistoryEntry[]> {
    return this.repo.find({
      where: { clinicalHistoryId },
      relations: { doctor: true },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ClinicalHistoryEntry> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { doctor: true },
    });
    if (!record) throw new NotFoundException('Actualización no encontrada');
    return record;
  }

  async update(
    id: string,
    dto: UpdateClinicalHistoryEntryDto,
  ): Promise<ClinicalHistoryEntry> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Actualización eliminada' };
  }
}
