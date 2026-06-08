import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/doctor.entity';
import { CreateDoctorDto } from '../dto/create-doctor.dto';
import { UpdateDoctorDto } from '../dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(@InjectRepository(Doctor) private repo: Repository<Doctor>) {}

  create(dto: CreateDoctorDto): Promise<Doctor> {
    const doctor = this.repo.create(dto);
    return this.repo.save(doctor);
  }

  findAll(): Promise<Doctor[]> {
    return this.repo.find({ relations: { user: true } });
  }

  async findOne(id: string): Promise<Doctor> {
    const doctor = await this.repo.findOne({ where: { id }, relations: { user: true } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto): Promise<Doctor> {
    const doctor = await this.findOne(id);
    Object.assign(doctor, dto);
    return this.repo.save(doctor);
  }

  async remove(id: string): Promise<{ message: string }> {
    const doctor = await this.findOne(id);
    await this.repo.remove(doctor);
    return { message: 'Doctor deleted' };
  }
}
