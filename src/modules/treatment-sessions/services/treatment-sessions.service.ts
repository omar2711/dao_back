import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TreatmentSession } from '../entities/treatment-session.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { CreateTreatmentSessionDto } from '../dto/create-treatment-session.dto';
import { UpdateTreatmentSessionDto } from '../dto/update-treatment-session.dto';
import { computeTreatmentStatus } from '../../treatments/utils/treatment-status.util';

export interface DoctorCollectionSummary {
  doctorId: string;
  doctorName: string;
  totalCollected: number;
  sessionCount: number;
}

@Injectable()
export class TreatmentSessionsService {
  constructor(
    @InjectRepository(TreatmentSession)
    private repo: Repository<TreatmentSession>,
    private dataSource: DataSource,
  ) {}

  create(dto: CreateTreatmentSessionDto): Promise<TreatmentSession> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = sessionRepo.create({
        ...dto,
        paymentDoctorId: dto.paymentDoctorId ?? dto.doctorId,
      });
      const saved = await sessionRepo.save(record);
      await this.recalculateTreatment(manager, dto.treatmentId);
      return saved;
    });
  }

  findAll(treatmentId?: string): Promise<TreatmentSession[]> {
    const query = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.doctor', 'doctor')
      .leftJoinAndSelect('s.paymentDoctor', 'paymentDoctor')
      .leftJoinAndSelect('s.appointment', 'appointment')
      .orderBy('s.session_date', 'DESC')
      .addOrderBy('s.created_at', 'DESC');

    if (treatmentId) query.andWhere('s.treatment_id = :treatmentId', { treatmentId });

    return query.getMany();
  }

  async findOne(id: string): Promise<TreatmentSession> {
    const record = await this.repo.findOne({
      where: { id },
      relations: { treatment: true, doctor: true, paymentDoctor: true, appointment: true },
    });
    if (!record) throw new NotFoundException('Sesión de tratamiento no encontrada');
    return record;
  }

  async update(id: string, dto: UpdateTreatmentSessionDto): Promise<TreatmentSession> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = await sessionRepo.findOne({ where: { id } });
      if (!record) throw new NotFoundException('Sesión de tratamiento no encontrada');

      Object.assign(record, dto);
      if (dto.doctorId && !dto.paymentDoctorId && !record.paymentDoctorId) {
        record.paymentDoctorId = dto.doctorId;
      }

      const saved = await sessionRepo.save(record);
      await this.recalculateTreatment(manager, record.treatmentId);
      return saved;
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = await sessionRepo.findOne({ where: { id } });
      if (!record) throw new NotFoundException('Sesión de tratamiento no encontrada');

      const treatmentId = record.treatmentId;
      await sessionRepo.remove(record);
      await this.recalculateTreatment(manager, treatmentId);
      return { message: 'Sesión de tratamiento eliminada' };
    });
  }

  async summaryByDoctor(from?: string, to?: string): Promise<DoctorCollectionSummary[]> {
    const query = this.repo
      .createQueryBuilder('s')
      .leftJoin('s.paymentDoctor', 'pd')
      .select('s.payment_doctor_id', 'doctorId')
      .addSelect("pd.first_name || ' ' || pd.last_name", 'doctorName')
      .addSelect('COALESCE(SUM(s.amount_paid), 0)', 'totalCollected')
      .addSelect('COUNT(*)', 'sessionCount')
      .where('s.amount_paid > 0')
      .groupBy('s.payment_doctor_id')
      .addGroupBy('pd.first_name')
      .addGroupBy('pd.last_name')
      .orderBy('"totalCollected"', 'DESC');

    if (from) query.andWhere('s.session_date >= :from', { from });
    if (to) query.andWhere('s.session_date <= :to', { to });

    const rows = await query.getRawMany<{
      doctorId: string;
      doctorName: string;
      totalCollected: string;
      sessionCount: string;
    }>();

    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      totalCollected: Number(r.totalCollected),
      sessionCount: Number(r.sessionCount),
    }));
  }

  private async recalculateTreatment(manager: EntityManager, treatmentId: string): Promise<void> {
    const row = await manager
      .createQueryBuilder(TreatmentSession, 's')
      .select('COALESCE(SUM(s.amount_paid), 0)', 'sum')
      .addSelect('COUNT(*)', 'count')
      .where('s.treatment_id = :treatmentId', { treatmentId })
      .getRawOne<{ sum: string; count: string }>();

    const paid = Number(row?.sum ?? 0);
    const sessionsDone = Number(row?.count ?? 0);
    const treatment = await manager.findOneByOrFail(Treatment, { id: treatmentId });
    const status = computeTreatmentStatus(treatment.cost, paid, sessionsDone, treatment.totalSessions, treatment.status);

    await manager.update(Treatment, treatmentId, { paid, sessionsDone, status });
  }
}
