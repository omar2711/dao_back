import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from '../entities/treatment.entity';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';

@Injectable()
export class TreatmentsService {
  constructor(
    @InjectRepository(Treatment)
    private repo: Repository<Treatment>,
  ) {}

  create(dto: CreateTreatmentDto): Promise<Treatment> {
    const record = this.repo.create(dto);
    return this.repo.save(record);
  }

  findAll(patientId?: string, status?: string): Promise<Treatment[]> {
    const query = this.repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.doctor', 'doctor')
      .orderBy('t.startDate', 'DESC');

    if (patientId) query.andWhere('t.patient_id = :patientId', { patientId });
    if (status) query.andWhere('t.status = :status', { status });

    return query.getMany();
  }

  async findOne(id: string): Promise<Treatment> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { patient: true, doctor: true, clinicalHistory: true },
    });
    if (!record) throw new NotFoundException('Tratamiento no encontrado');
    return record;
  }

  async update(id: string, dto: UpdateTreatmentDto): Promise<Treatment> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Tratamiento eliminado' };
  }
}
