import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalHistory } from '../entities/clinical-history.entity';
import { CreateClinicalHistoryDto } from '../dto/create-clinical-history.dto';
import { UpdateClinicalHistoryDto } from '../dto/update-clinical-history.dto';

@Injectable()
export class ClinicalHistoriesService {
  constructor(
    @InjectRepository(ClinicalHistory)
    private repo: Repository<ClinicalHistory>,
  ) {}

  async create(dto: CreateClinicalHistoryDto): Promise<ClinicalHistory> {
    const hcNumber = dto.hcNumber ?? (await this.nextHcNumber(dto.patientId));
    const record = this.repo.create({ ...dto, hcNumber });
    return this.repo.save(record);
  }

  // Autonumera el HC N° por paciente (1, 2, 3...) cuando se deja en blanco.
  // Solo cuenta hc_number puramente numéricos para no romperse con datos
  // históricos que pudieran tener otro formato.
  private async nextHcNumber(patientId: string): Promise<string> {
    const { max } = await this.repo
      .createQueryBuilder('ch')
      .select('MAX(CAST(ch.hc_number AS INTEGER))', 'max')
      .where('ch.patient_id = :patientId', { patientId })
      .andWhere("ch.hc_number ~ '^[0-9]+$'")
      .getRawOne<{ max: string | null }>();
    return String((max ? parseInt(max, 10) : 0) + 1);
  }

  findAll(patientId?: string): Promise<ClinicalHistory[]> {
    const query = this.repo
      .createQueryBuilder('ch')
      .leftJoinAndSelect('ch.doctor', 'doctor')
      .orderBy('ch.fecha', 'DESC')
      .addOrderBy('ch.created_at', 'DESC');

    if (patientId) query.where('ch.patient_id = :patientId', { patientId });

    return query.getMany();
  }

  async findOne(id: string): Promise<ClinicalHistory> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { patient: true, doctor: true },
    });
    if (!record) throw new NotFoundException('Historia clínica no encontrada');
    return record;
  }

  async update(id: string, dto: UpdateClinicalHistoryDto): Promise<ClinicalHistory> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Historia clínica eliminada' };
  }
}
