import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from '../entities/treatment.entity';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { computeTreatmentStatus } from '../utils/treatment-status.util';

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
    if (dto.cost !== undefined && Number(dto.cost) < Number(record.paid)) {
      throw new BadRequestException(
        `El costo (S/. ${Number(dto.cost).toFixed(2)}) no puede ser menor a lo ya pagado (S/. ${Number(record.paid).toFixed(2)}).`,
      );
    }
    Object.assign(record, dto);
    if (!dto.status) {
      record.status = computeTreatmentStatus(record.cost, record.paid, record.sessionsDone, record.totalSessions, record.status);
    }
    return this.repo.save(record);
  }

  async remove(id: string): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repo.remove(record);
    return { message: 'Tratamiento eliminado' };
  }

  // Desempeño por doctor a partir de la tabla de tratamientos (no de sesiones):
  // cuenta tratamientos terminados/activos y suma lo cobrado/pendiente SOLO de
  // los tratamientos COMPLETADO, atribuido al doctor tratante (t.doctor_id).
  async summaryByDoctor(): Promise<DoctorTreatmentSummary[]> {
    const rows = await this.repo
      .createQueryBuilder('t')
      .leftJoin('t.doctor', 'd')
      .select('t.doctor_id', 'doctorId')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect("COUNT(*) FILTER (WHERE t.status = 'COMPLETADO')", 'completed')
      .addSelect("COUNT(*) FILTER (WHERE t.status <> 'COMPLETADO')", 'active')
      .addSelect(
        "COALESCE(SUM(t.paid) FILTER (WHERE t.status = 'COMPLETADO'), 0)",
        'paidCompleted',
      )
      .addSelect(
        "COALESCE(SUM(t.cost - t.paid) FILTER (WHERE t.status = 'COMPLETADO'), 0)",
        'pendingCompleted',
      )
      .groupBy('t.doctor_id')
      .addGroupBy('d.first_name')
      .addGroupBy('d.last_name')
      .orderBy('"paidCompleted"', 'DESC')
      .getRawMany<{
        doctorId: string;
        doctorName: string;
        completed: string;
        active: string;
        paidCompleted: string;
        pendingCompleted: string;
      }>();

    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      treatmentsCompleted: Number(r.completed),
      treatmentsActive: Number(r.active),
      paidCompleted: Number(r.paidCompleted),
      pendingCompleted: Number(r.pendingCompleted),
    }));
  }
}

export interface DoctorTreatmentSummary {
  doctorId: string;
  doctorName: string;
  treatmentsCompleted: number;
  treatmentsActive: number;
  paidCompleted: number;
  pendingCompleted: number;
}
