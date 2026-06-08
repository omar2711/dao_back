import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Odontograma } from '../entities/odontograma.entity';
import { CreateOdontogramaDto } from '../dto/create-odontograma.dto';
import { UpdateOdontogramaDto } from '../dto/update-odontograma.dto';

@Injectable()
export class OdontogramasService {
  constructor(
    @InjectRepository(Odontograma)
    private repo: Repository<Odontograma>,
  ) {}

  create(dto: CreateOdontogramaDto): Promise<Odontograma> {
    const record = this.repo.create(dto);
    return this.repo.save(record);
  }

  findAll(patientId?: string, clinicalHistoryId?: string): Promise<Odontograma[]> {
    const query = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.doctor', 'doctor')
      .orderBy('o.fecha', 'DESC')
      .addOrderBy('o.tipo', 'ASC');

    if (patientId) query.andWhere('o.patient_id = :patientId', { patientId });
    if (clinicalHistoryId)
      query.andWhere('o.clinical_history_id = :clinicalHistoryId', { clinicalHistoryId });

    return query.getMany();
  }

  async findOne(id: string): Promise<Odontograma> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { patient: true, doctor: true, clinicalHistory: true },
    });
    if (!record) throw new NotFoundException('Odontograma no encontrado');
    return record;
  }

  async update(id: string, dto: UpdateOdontogramaDto): Promise<Odontograma> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Odontograma eliminado' };
  }
}
