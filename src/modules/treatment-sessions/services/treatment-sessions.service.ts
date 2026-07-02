import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { TreatmentSession } from '../entities/treatment-session.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { CreateTreatmentSessionDto, SessionSupplyDto } from '../dto/create-treatment-session.dto';
import { UpdateTreatmentSessionDto } from '../dto/update-treatment-session.dto';
import { computeTreatmentStatus } from '../../treatments/utils/treatment-status.util';

const round2 = (n: number) => Math.round(n * 100) / 100;

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
    private inventoryService: InventoryService,
    private notificationsService: NotificationsService,
  ) {}

  create(dto: CreateTreatmentSessionDto): Promise<TreatmentSession> {
    const { supplies, ...sessionDto } = dto;
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = sessionRepo.create({
        ...sessionDto,
        paymentDoctorId: dto.paymentDoctorId ?? dto.doctorId,
      });
      const saved = await sessionRepo.save(record);

      // Se descuentan en la misma transacción: si un insumo falla (ej. stock
      // insuficiente), la sesión tampoco queda guardada.
      await this.applySupplies(manager, supplies, {
        doctorId: dto.doctorId,
        treatmentId: dto.treatmentId,
        treatmentSessionId: saved.id,
      });

      await this.recalculateTreatment(manager, dto.treatmentId);
      return saved;
    });
  }

  private async applySupplies(
    manager: EntityManager,
    supplies: SessionSupplyDto[] | undefined,
    ctx: { doctorId: string; treatmentId: string; treatmentSessionId: string },
  ): Promise<void> {
    for (const supply of supplies ?? []) {
      await this.inventoryService.createMovement(
        {
          itemId: supply.itemId,
          type: 'OUT',
          quantity: supply.quantity,
          doctorId: ctx.doctorId,
          treatmentId: ctx.treatmentId,
          treatmentSessionId: ctx.treatmentSessionId,
          reason: 'Consumo en sesión de tratamiento',
        },
        manager,
      );
    }
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
    const { supplies, ...sessionDto } = dto;
    return this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = await sessionRepo.findOne({ where: { id } });
      if (!record) throw new NotFoundException('Sesión de tratamiento no encontrada');

      Object.assign(record, sessionDto);
      if (dto.doctorId && !dto.paymentDoctorId && !record.paymentDoctorId) {
        record.paymentDoctorId = dto.doctorId;
      }

      const saved = await sessionRepo.save(record);

      await this.applySupplies(manager, supplies, {
        doctorId: record.doctorId,
        treatmentId: record.treatmentId,
        treatmentSessionId: record.id,
      });

      await this.recalculateTreatment(manager, record.treatmentId);
      return saved;
    });
  }

  async remove(id: string, restoreStock = false, actorEmail?: string): Promise<{ message: string }> {
    const result = await this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(TreatmentSession);
      const record = await sessionRepo.findOne({
        where: { id },
        relations: { treatment: { patient: true }, doctor: true },
      });
      if (!record) throw new NotFoundException('Sesión de tratamiento no encontrada');

      const treatmentId = record.treatmentId;
      if (restoreStock) {
        await this.inventoryService.reverseSessionMovements(manager, id);
      }
      await sessionRepo.remove(record);
      await this.recalculateTreatment(manager, treatmentId);
      return { record };
    });

    // Se notifica al rol ADMIN una vez que la eliminación quedó confirmada
    // (fuera de la transacción: si algo falla arriba, no debe notificarse).
    const { record } = result;
    const patientName = record.treatment?.patient
      ? `${record.treatment.patient.firstName} ${record.treatment.patient.lastName}`
      : 'paciente desconocido';
    const doctorName = record.doctor ? `${record.doctor.firstName} ${record.doctor.lastName}` : 'doctor desconocido';
    await this.notificationsService.create(
      `${actorEmail ?? 'Un usuario'} eliminó una sesión (${record.sessionDate}) del Dr. ${doctorName} — paciente ${patientName}.` +
        (restoreStock ? ' Se revirtió el stock de insumos consumido.' : ''),
    );

    return { message: 'Sesión de tratamiento eliminada' };
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
    const previousPaid = Number(treatment.paid);

    // Solo se bloquea si esta operación EMPEORA el sobre-pago (paid subió y
    // sigue por encima del costo). Si paid bajó o quedó igual — como al
    // eliminar una sesión, o al editar una para reducir su monto — siempre se
    // permite, aunque el total siga por encima del costo por datos previos a
    // esta validación: de lo contrario un tratamiento ya sobre-pagado jamás
    // podría corregirse.
    if (round2(paid) > round2(Number(treatment.cost)) && round2(paid) > round2(previousPaid)) {
      throw new BadRequestException(
        `El pago total (S/. ${round2(paid).toFixed(2)}) supera el costo del tratamiento (S/. ${Number(treatment.cost).toFixed(2)}).`,
      );
    }

    const status = computeTreatmentStatus(treatment.cost, paid, sessionsDone, treatment.totalSessions, treatment.status);

    await manager.update(Treatment, treatmentId, { paid, sessionsDone, status });
  }
}
