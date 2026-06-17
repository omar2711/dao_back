import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreatmentSession } from '../../treatment-sessions/entities/treatment-session.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

export interface ReportOverview {
  totalPatients: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  totalRevenue: number;
  sessionCount: number;
}

export interface RevenueByDoctorRow {
  doctorId: string;
  doctorName: string;
  totalCollected: number;
  sessionCount: number;
}

export interface RevenueByTreatmentRow {
  type: string;
  revenue: number;
  count: number;
}

export interface TreatmentsByDoctorRow {
  doctorId: string;
  doctorName: string;
  treatmentsTotal: number;
  treatmentsCompleted: number;
  patientsAttended: number;
}

export interface MonthlyTrendRow {
  period: string;
  revenue: number;
  sessionCount: number;
  patients: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(TreatmentSession)
    private sessions: Repository<TreatmentSession>,
    @InjectRepository(Treatment)
    private treatments: Repository<Treatment>,
    @InjectRepository(Appointment)
    private appointments: Repository<Appointment>,
  ) {}

  private applyDateRange(query: any, column: string, from?: string, to?: string) {
    if (from) query.andWhere(`${column} >= :from`, { from });
    if (to) query.andWhere(`${column} <= :to`, { to });
    return query;
  }

  async overview(from?: string, to?: string): Promise<ReportOverview> {
    const revQ = this.sessions
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.amount_paid), 0)', 'revenue')
      .addSelect('COUNT(*)', 'sessionCount')
      .addSelect('COUNT(DISTINCT t.patient_id)', 'patients')
      .leftJoin('s.treatment', 't');
    this.applyDateRange(revQ, 's.session_date', from, to);
    const rev = await revQ.getRawOne<{
      revenue: string;
      sessionCount: string;
      patients: string;
    }>();

    const apptQ = this.appointments
      .createQueryBuilder('a')
      .select(
        "COUNT(*) FILTER (WHERE a.status = 'COMPLETED')",
        'completed',
      )
      .addSelect(
        "COUNT(*) FILTER (WHERE a.status = 'CANCELLED')",
        'cancelled',
      );
    this.applyDateRange(apptQ, 'a.appointment_date', from, to);
    const appt = await apptQ.getRawOne<{ completed: string; cancelled: string }>();

    return {
      totalPatients: Number(rev?.patients ?? 0),
      appointmentsCompleted: Number(appt?.completed ?? 0),
      appointmentsCancelled: Number(appt?.cancelled ?? 0),
      totalRevenue: Number(rev?.revenue ?? 0),
      sessionCount: Number(rev?.sessionCount ?? 0),
    };
  }

  async revenueByDoctor(from?: string, to?: string): Promise<RevenueByDoctorRow[]> {
    const query = this.sessions
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
    this.applyDateRange(query, 's.session_date', from, to);

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

  async revenueByTreatmentType(
    from?: string,
    to?: string,
  ): Promise<RevenueByTreatmentRow[]> {
    const query = this.sessions
      .createQueryBuilder('s')
      .leftJoin('s.treatment', 't')
      .select('t.type', 'type')
      .addSelect('COALESCE(SUM(s.amount_paid), 0)', 'revenue')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.type')
      .orderBy('"revenue"', 'DESC');
    this.applyDateRange(query, 's.session_date', from, to);

    const rows = await query.getRawMany<{
      type: string;
      revenue: string;
      count: string;
    }>();
    return rows.map((r) => ({
      type: r.type ?? 'Sin tipo',
      revenue: Number(r.revenue),
      count: Number(r.count),
    }));
  }

  async treatmentsByDoctor(
    from?: string,
    to?: string,
  ): Promise<TreatmentsByDoctorRow[]> {
    const query = this.treatments
      .createQueryBuilder('t')
      .leftJoin('t.doctor', 'd')
      .select('t.doctor_id', 'doctorId')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect('COUNT(*)', 'treatmentsTotal')
      .addSelect(
        "COUNT(*) FILTER (WHERE t.status = 'COMPLETADO')",
        'treatmentsCompleted',
      )
      .addSelect('COUNT(DISTINCT t.patient_id)', 'patientsAttended')
      .groupBy('t.doctor_id')
      .addGroupBy('d.first_name')
      .addGroupBy('d.last_name')
      .orderBy('"treatmentsTotal"', 'DESC');
    this.applyDateRange(query, 't.start_date', from, to);

    const rows = await query.getRawMany<{
      doctorId: string;
      doctorName: string;
      treatmentsTotal: string;
      treatmentsCompleted: string;
      patientsAttended: string;
    }>();
    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      treatmentsTotal: Number(r.treatmentsTotal),
      treatmentsCompleted: Number(r.treatmentsCompleted),
      patientsAttended: Number(r.patientsAttended),
    }));
  }

  async monthlyTrend(months = 6): Promise<MonthlyTrendRow[]> {
    const rows = await this.sessions
      .createQueryBuilder('s')
      .leftJoin('s.treatment', 't')
      .select("to_char(date_trunc('month', s.session_date), 'YYYY-MM')", 'period')
      .addSelect('COALESCE(SUM(s.amount_paid), 0)', 'revenue')
      .addSelect('COUNT(*)', 'sessionCount')
      .addSelect('COUNT(DISTINCT t.patient_id)', 'patients')
      .where("s.session_date >= (date_trunc('month', CURRENT_DATE) - (:months || ' months')::interval)", { months: months - 1 })
      .groupBy("date_trunc('month', s.session_date)")
      .orderBy("date_trunc('month', s.session_date)", 'ASC')
      .getRawMany<{
        period: string;
        revenue: string;
        sessionCount: string;
        patients: string;
      }>();

    return rows.map((r) => ({
      period: r.period,
      revenue: Number(r.revenue),
      sessionCount: Number(r.sessionCount),
      patients: Number(r.patients),
    }));
  }
}
