import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { FilterAppointmentDto } from '../dto/filter-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(@InjectRepository(Appointment) private repo: Repository<Appointment>) {}

  create(dto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = this.repo.create(dto);
    return this.repo.save(appointment);
  }

  findAll(filter: FilterAppointmentDto): Promise<Appointment[]> {
    const where: any = {};

    if (filter.doctorId) where.doctorId = filter.doctorId;
    if (filter.patientId) where.patientId = filter.patientId;
    if (filter.status) where.status = filter.status;

    if (filter.date) {
      const start = new Date(filter.date + 'T00:00:00.000Z');
      const end = new Date(filter.date + 'T23:59:59.999Z');
      where.appointmentDate = Between(start, end);
    } else if (filter.from || filter.to) {
      const start = new Date((filter.from ?? filter.to) + 'T00:00:00.000Z');
      const end = new Date((filter.to ?? filter.from) + 'T23:59:59.999Z');
      where.appointmentDate = Between(start, end);
    }

    return this.repo.find({
      where,
      relations: { patient: true, doctor: true },
      order: { appointmentDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.repo.findOne({
      where: { id },
      relations: { patient: true, doctor: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, dto);
    return this.repo.save(appointment);
  }

  async remove(id: string): Promise<{ message: string }> {
    const appointment = await this.findOne(id);
    await this.repo.remove(appointment);
    return { message: 'Appointment deleted' };
  }
}
