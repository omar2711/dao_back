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

  create(dto: CreateClinicalHistoryDto): Promise<ClinicalHistory> {
    const record = this.repo.create(dto);
    return this.repo.save(record);
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
