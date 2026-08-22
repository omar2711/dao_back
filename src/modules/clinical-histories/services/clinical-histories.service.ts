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

  // Un paciente tiene una única historia clínica. Si ya existe, se actualiza en
  // vez de crear otra: la evolución posterior se registra como actualizaciones
  // (ClinicalHistoryEntriesService), no abriendo fichas nuevas.
  async create(dto: CreateClinicalHistoryDto): Promise<ClinicalHistory> {
    const existing = await this.repo.findOne({
      where: { patientId: dto.patientId },
    });
    if (existing) {
      const { patientId: _ignored, ...rest } = dto;
      Object.assign(existing, rest);
      return this.repo.save(existing);
    }
    const hcNumber = dto.hcNumber ?? (await this.nextHcNumber());
    const record = this.repo.create({ ...dto, hcNumber });
    return this.repo.save(record);
  }

  // La historia clínica única del paciente, o null si todavía no tiene.
  findByPatient(patientId: string): Promise<ClinicalHistory | null> {
    return this.repo.findOne({
      where: { patientId },
      relations: { doctor: true },
    });
  }

  // Autonumera el HC N° de forma correlativa en toda la clínica cuando se deja
  // en blanco. Solo cuenta hc_number puramente numéricos para no romperse con
  // datos históricos que pudieran tener otro formato.
  private async nextHcNumber(): Promise<string> {
    const { max } = await this.repo
      .createQueryBuilder('ch')
      .select('MAX(CAST(ch.hc_number AS INTEGER))', 'max')
      .where("ch.hc_number ~ '^[0-9]+$'")
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
