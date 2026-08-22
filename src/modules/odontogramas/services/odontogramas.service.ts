import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  // Un paciente tiene un único odontograma. Si ya existe, se actualiza en vez
  // de crear otro, de modo que cualquier llamador termina trabajando sobre el
  // mismo registro sin tener que consultarlo antes.
  async create(dto: CreateOdontogramaDto): Promise<Odontograma> {
    const existing = await this.repo.findOne({
      where: { patientId: dto.patientId },
    });
    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }
    const record = this.repo.create(dto);
    return this.repo.save(record);
  }

  // El odontograma único del paciente, o null si todavía no tiene.
  findByPatient(patientId: string): Promise<Odontograma | null> {
    return this.repo.findOne({
      where: { patientId },
      relations: { doctor: true },
    });
  }

  findAll(patientId?: string, clinicalHistoryId?: string): Promise<Odontograma[]> {
    const query = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.doctor', 'doctor')
      .orderBy('o.fecha', 'DESC');

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
    // Si se reasigna la historia clínica, verificar que no esté ya ocupada por otro.
    if (dto.clinicalHistoryId && dto.clinicalHistoryId !== record.clinicalHistoryId) {
      const existing = await this.repo.findOne({
        where: { clinicalHistoryId: dto.clinicalHistoryId },
      });
      if (existing && existing.id !== id)
        throw new ConflictException(
          'Esta historia clínica ya tiene un odontograma. Edite el existente.',
        );
    }
    Object.assign(record, dto);
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Odontograma eliminado' };
  }
}
