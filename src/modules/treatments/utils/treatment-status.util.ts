import { TreatmentStatus } from '../entities/treatment.entity';

export function computeTreatmentStatus(
  cost: number,
  paid: number,
  sessionsDone: number,
  totalSessions: number,
  currentStatus: TreatmentStatus,
): TreatmentStatus {
  const isComplete =
    Number(sessionsDone) >= Number(totalSessions) &&
    Number(cost) > 0 &&
    Number(paid) >= Number(cost);

  if (isComplete) return TreatmentStatus.COMPLETADO;
  if (currentStatus === TreatmentStatus.COMPLETADO) return TreatmentStatus.EN_PROGRESO;
  return currentStatus;
}
