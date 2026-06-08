import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private repo: Repository<Patient>) {}

  create(dto: CreatePatientDto): Promise<Patient> {
    const patient = this.repo.create(dto);
    return this.repo.save(patient);
  }

  findAll(search?: string): Promise<Patient[]> {
    if (!search) return this.repo.find({ order: { createdAt: 'DESC' } });

    return this.repo
      .createQueryBuilder('patient')
      .where(
        "LOWER(patient.first_name || ' ' || patient.last_name) LIKE LOWER(:s)",
        { s: `%${search}%` },
      )
      .orWhere('LOWER(patient.email) LIKE LOWER(:s)', { s: `%${search}%` })
      .orWhere('patient.phone LIKE :s', { s: `%${search}%` })
      .orderBy('patient.created_at', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.repo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, dto);
    return this.repo.save(patient);
  }

  async remove(id: string): Promise<{ message: string }> {
    const patient = await this.findOne(id);
    await this.repo.remove(patient);
    return { message: 'Patient deleted' };
  }
}
