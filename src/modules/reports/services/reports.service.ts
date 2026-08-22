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

// Aporte de un doctor a un tipo de tratamiento. Lleva los mismos importes que
// la fila del tipo para que la UI pueda mostrar exactamente la misma
// información cuando se filtra por un doctor concreto.
export interface RevenueByTreatmentDoctorRow {
  doctorId: string;
  doctorName: string;
  total: number;
  paid: number;
  pending: number;
  count: number;
  completedCount: number;
}

export interface RevenueByTreatmentRow {
  type: string;
  total: number; // costo total de los tratamientos de este tipo
  paid: number; // cobrado
  pending: number; // por cobrar
  count: number; // cantidad de tratamientos
  completedCount: number; // de los cuales, terminados
  byDoctor: RevenueByTreatmentDoctorRow[]; // desglose por doctor tratante
}

export interface TreatmentsByDoctorRow {
  doctorId: string;
  doctorName: string;
  treatmentsTotal: number;
  treatmentsCompleted: number;
  patientsAttended: number;
  paidCompleted: number; // cobrado de tratamientos terminados
  laboratoryCost: number; // gasto de laboratorio de sus tratamientos
}

export interface LaboratoryRow {
  treatmentId: string;
  type: string;
  patientName: string;
  doctorName: string;
  startDate: string;
  createdAt: string;
  laboratoryNotes: string | null;
  laboratoryCost: number;
}

export interface MonthlyTrendRow {
  period: string;
  revenue: number;
  sessionCount: number;
  patients: number;
}

// ─── Desglose completo por doctor tratante ────────────────────────────────────
// Jerarquía doctor → paciente → tratamientos, con subtotales en cada nivel y un
// resumen por tipo de tratamiento. Alimenta tanto "Desempeño del personal" como
// "Gasto en laboratorio", que solo difieren en el filtro de laboratorio.

export interface DoctorDetailTotals {
  treatments: number;
  patients: number;
  cost: number;
  paid: number;
  pending: number;
  laboratoryCost: number;
  laboratoryCount: number; // tratamientos que requieren laboratorio
}

export interface DoctorDetailTreatment {
  treatmentId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  cost: number;
  paid: number;
  pending: number;
  laboratoryCost: number;
  requiresLaboratory: boolean;
  laboratoryNotes: string | null;
  sessionsDone: number;
  totalSessions: number;
}

export interface DoctorDetailPatient {
  patientId: string;
  patientName: string;
  treatments: DoctorDetailTreatment[];
  totals: DoctorDetailTotals;
}

export interface DoctorDetailTypeRow {
  type: string;
  count: number;
  cost: number;
  paid: number;
  pending: number;
  laboratoryCost: number;
}

export interface DoctorDetailRow {
  doctorId: string;
  doctorName: string;
  patients: DoctorDetailPatient[];
  byType: DoctorDetailTypeRow[];
  totals: DoctorDetailTotals;
}

const emptyTotals = (): DoctorDetailTotals => ({
  treatments: 0,
  patients: 0,
  cost: 0,
  paid: 0,
  pending: 0,
  laboratoryCost: 0,
  laboratoryCount: 0,
});

// Acumula un tratamiento en un bloque de totales. `patients` se cuenta aparte
// (a nivel doctor son pacientes distintos, a nivel paciente siempre es 1).
const addToTotals = (t: DoctorDetailTotals, r: DoctorDetailTreatment) => {
  t.treatments += 1;
  t.cost += r.cost;
  t.paid += r.paid;
  t.pending += r.pending;
  t.laboratoryCost += r.laboratoryCost;
  if (r.requiresLaboratory) t.laboratoryCount += 1;
};

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

  // Recaudación por tipo de tratamiento, con el desglose de qué doctor tratante
  // aportó cada parte. Incluye TODOS los estados: el dinero ya cobrado de un
  // tratamiento en curso también entró en caja. `completedCount` conserva la
  // cantidad de terminados para no perder ese dato.
  async revenueByTreatmentType(
    from?: string,
    to?: string,
  ): Promise<RevenueByTreatmentRow[]> {
    const query = this.treatments
      .createQueryBuilder('t')
      .leftJoin('t.doctor', 'd')
      .select('t.type', 'type')
      .addSelect('t.doctor_id', 'doctorId')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect('COALESCE(SUM(t.cost), 0)', 'total')
      .addSelect('COALESCE(SUM(t.paid), 0)', 'paid')
      .addSelect('COALESCE(SUM(t.cost - t.paid), 0)', 'pending')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        "COUNT(*) FILTER (WHERE t.status = 'COMPLETADO')",
        'completedCount',
      )
      .groupBy('t.type')
      .addGroupBy('t.doctor_id')
      .addGroupBy('d.first_name')
      .addGroupBy('d.last_name');
    this.applyDateRange(query, 't.start_date', from, to);

    const rows = await query.getRawMany<{
      type: string;
      doctorId: string;
      doctorName: string;
      total: string;
      paid: string;
      pending: string;
      count: string;
      completedCount: string;
    }>();

    // Consolidar las filas (tipo × doctor) en un registro por tipo.
    const byType = new Map<string, RevenueByTreatmentRow>();
    for (const r of rows) {
      const type = r.type ?? 'Sin tipo';
      let entry = byType.get(type);
      if (!entry) {
        entry = {
          type,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
          completedCount: 0,
          byDoctor: [],
        };
        byType.set(type, entry);
      }
      entry.total += Number(r.total);
      entry.paid += Number(r.paid);
      entry.pending += Number(r.pending);
      entry.count += Number(r.count);
      entry.completedCount += Number(r.completedCount);
      entry.byDoctor.push({
        doctorId: r.doctorId,
        doctorName: r.doctorName ?? 'Sin doctor',
        total: Number(r.total),
        paid: Number(r.paid),
        pending: Number(r.pending),
        count: Number(r.count),
        completedCount: Number(r.completedCount),
      });
    }

    // Desempate por nombre/tipo: con importes en 0 el orden quedaría indefinido
    // y la lista bailaría entre recargas.
    const result = [...byType.values()];
    for (const entry of result) {
      entry.byDoctor.sort(
        (a, b) => b.paid - a.paid || a.doctorName.localeCompare(b.doctorName, 'es'),
      );
    }
    result.sort((a, b) => b.paid - a.paid || a.type.localeCompare(b.type, 'es'));
    return result;
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
      .addSelect(
        "COALESCE(SUM(t.paid) FILTER (WHERE t.status = 'COMPLETADO'), 0)",
        'paidCompleted',
      )
      .addSelect('COALESCE(SUM(t.laboratory_cost), 0)', 'laboratoryCost')
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
      paidCompleted: string;
      laboratoryCost: string;
    }>();
    return rows.map((r) => ({
      doctorId: r.doctorId,
      doctorName: r.doctorName,
      treatmentsTotal: Number(r.treatmentsTotal),
      treatmentsCompleted: Number(r.treatmentsCompleted),
      patientsAttended: Number(r.patientsAttended),
      paidCompleted: Number(r.paidCompleted),
      laboratoryCost: Number(r.laboratoryCost),
    }));
  }

  // Detalle de tratamientos que requieren laboratorio, con el monto gastado.
  async laboratory(from?: string, to?: string): Promise<LaboratoryRow[]> {
    const query = this.treatments
      .createQueryBuilder('t')
      .leftJoin('t.doctor', 'd')
      .leftJoin('t.patient', 'p')
      .select('t.id', 'treatmentId')
      .addSelect('t.type', 'type')
      .addSelect("p.first_name || ' ' || p.last_name", 'patientName')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect('t.start_date', 'startDate')
      .addSelect('t.created_at', 'createdAt')
      .addSelect('t.laboratory_notes', 'laboratoryNotes')
      .addSelect('t.laboratory_cost', 'laboratoryCost')
      .where('t.requires_laboratory = true')
      .orderBy('t.start_date', 'DESC');
    this.applyDateRange(query, 't.start_date', from, to);

    const rows = await query.getRawMany<{
      treatmentId: string;
      type: string;
      patientName: string;
      doctorName: string;
      startDate: string | Date;
      createdAt: string | Date;
      laboratoryNotes: string | null;
      laboratoryCost: string;
    }>();
    return rows.map((r) => ({
      treatmentId: r.treatmentId,
      type: r.type ?? 'Sin tipo',
      patientName: r.patientName,
      doctorName: r.doctorName,
      startDate: String(r.startDate),
      createdAt: new Date(r.createdAt).toISOString(),
      laboratoryNotes: r.laboratoryNotes,
      laboratoryCost: Number(r.laboratoryCost),
    }));
  }

  // ─── Desglose por doctor tratante ─────────────────────────────────────────

  // Desempeño completo de cada doctor: sus pacientes, los tratamientos de cada
  // uno y los subtotales, más un resumen por tipo de tratamiento.
  doctorDetail(from?: string, to?: string): Promise<DoctorDetailRow[]> {
    return this.buildDoctorTree(from, to, false);
  }

  // El mismo árbol restringido a los tratamientos que requieren laboratorio:
  // doctor → paciente → tratamientos, todo ordenado y con subtotales.
  laboratoryByDoctor(from?: string, to?: string): Promise<DoctorDetailRow[]> {
    return this.buildDoctorTree(from, to, true);
  }

  // Una sola consulta plana sobre `treatments`, agrupada en tres niveles en TS.
  // La atribución es al doctor TRATANTE (t.doctor_id) y el eje de fecha es
  // t.start_date, igual que el resto de reportes basados en tratamientos.
  //
  // Nota: laboratory_cost se reporta siempre en su propia columna y nunca se
  // suma a cost/paid — se cobra aparte (ver Treatment.laboratoryCost).
  private async buildDoctorTree(
    from?: string,
    to?: string,
    labOnly = false,
  ): Promise<DoctorDetailRow[]> {
    const query = this.treatments
      .createQueryBuilder('t')
      .leftJoin('t.doctor', 'd')
      .leftJoin('t.patient', 'p')
      .select('t.id', 'treatmentId')
      .addSelect('t.type', 'type')
      .addSelect('t.status', 'status')
      .addSelect('t.start_date', 'startDate')
      .addSelect('t.end_date', 'endDate')
      .addSelect('t.cost', 'cost')
      .addSelect('t.paid', 'paid')
      .addSelect('t.laboratory_cost', 'laboratoryCost')
      .addSelect('t.requires_laboratory', 'requiresLaboratory')
      .addSelect('t.laboratory_notes', 'laboratoryNotes')
      .addSelect('t.sessions_done', 'sessionsDone')
      .addSelect('t.total_sessions', 'totalSessions')
      .addSelect('t.doctor_id', 'doctorId')
      .addSelect("d.first_name || ' ' || d.last_name", 'doctorName')
      .addSelect('t.patient_id', 'patientId')
      .addSelect("p.first_name || ' ' || p.last_name", 'patientName')
      .orderBy('t.start_date', 'DESC');
    if (labOnly) query.andWhere('t.requires_laboratory = true');
    this.applyDateRange(query, 't.start_date', from, to);

    const rows = await query.getRawMany<{
      treatmentId: string;
      type: string | null;
      status: string;
      startDate: string | Date;
      endDate: string | Date | null;
      cost: string;
      paid: string;
      laboratoryCost: string;
      requiresLaboratory: boolean;
      laboratoryNotes: string | null;
      sessionsDone: number | null;
      totalSessions: number | null;
      doctorId: string;
      doctorName: string | null;
      patientId: string;
      patientName: string | null;
    }>();

    const doctors = new Map<
      string,
      DoctorDetailRow & { patientIndex: Map<string, DoctorDetailPatient> }
    >();
    // Acumulador de tipos por doctor: doctorId → type → fila.
    const typeIndex = new Map<string, Map<string, DoctorDetailTypeRow>>();

    for (const r of rows) {
      const cost = Number(r.cost) || 0;
      const paid = Number(r.paid) || 0;
      const treatment: DoctorDetailTreatment = {
        treatmentId: r.treatmentId,
        type: r.type ?? 'Sin tipo',
        status: r.status,
        startDate: String(r.startDate),
        endDate: r.endDate ? String(r.endDate) : null,
        cost,
        paid,
        pending: cost - paid,
        laboratoryCost: Number(r.laboratoryCost) || 0,
        requiresLaboratory: Boolean(r.requiresLaboratory),
        laboratoryNotes: r.laboratoryNotes,
        sessionsDone: Number(r.sessionsDone) || 0,
        totalSessions: Number(r.totalSessions) || 0,
      };

      const doctorId = r.doctorId ?? 'sin-doctor';
      let doctor = doctors.get(doctorId);
      if (!doctor) {
        doctor = {
          doctorId,
          doctorName: r.doctorName ?? 'Sin doctor',
          patients: [],
          byType: [],
          totals: emptyTotals(),
          patientIndex: new Map(),
        };
        doctors.set(doctorId, doctor);
        typeIndex.set(doctorId, new Map());
      }

      const patientId = r.patientId ?? 'sin-paciente';
      let patient = doctor.patientIndex.get(patientId);
      if (!patient) {
        patient = {
          patientId,
          patientName: r.patientName ?? 'Sin paciente',
          treatments: [],
          totals: { ...emptyTotals(), patients: 1 },
        };
        doctor.patientIndex.set(patientId, patient);
        doctor.patients.push(patient);
        doctor.totals.patients += 1;
      }

      patient.treatments.push(treatment);
      addToTotals(patient.totals, treatment);
      addToTotals(doctor.totals, treatment);

      const types = typeIndex.get(doctorId)!;
      let typeRow = types.get(treatment.type);
      if (!typeRow) {
        typeRow = {
          type: treatment.type,
          count: 0,
          cost: 0,
          paid: 0,
          pending: 0,
          laboratoryCost: 0,
        };
        types.set(treatment.type, typeRow);
      }
      typeRow.count += 1;
      typeRow.cost += treatment.cost;
      typeRow.paid += treatment.paid;
      typeRow.pending += treatment.pending;
      typeRow.laboratoryCost += treatment.laboratoryCost;
    }

    // Orden final: doctores por el importe que da sentido a la vista (lo
    // recaudado, o el gasto de laboratorio en la vista de laboratorio),
    // pacientes por nombre, tratamientos por fecha descendente (ya vienen así
    // de la consulta).
    // Desempate por nombre: en la vista de laboratorio los importes pueden ser
    // todos 0, y sin desempate el orden quedaría indefinido entre recargas.
    const doctorWeight = (t: DoctorDetailTotals) =>
      labOnly ? t.laboratoryCost : t.paid;

    return [...doctors.values()]
      .map(({ patientIndex: _ignored, ...doctor }) => ({
        ...doctor,
        patients: doctor.patients.sort((a, b) =>
          a.patientName.localeCompare(b.patientName, 'es'),
        ),
        byType: [...(typeIndex.get(doctor.doctorId)?.values() ?? [])].sort(
          (a, b) =>
            (labOnly ? b.laboratoryCost - a.laboratoryCost : b.paid - a.paid) ||
            a.type.localeCompare(b.type, 'es'),
        ),
      }))
      .sort(
        (a, b) =>
          doctorWeight(b.totals) - doctorWeight(a.totals) ||
          a.doctorName.localeCompare(b.doctorName, 'es'),
      );
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
