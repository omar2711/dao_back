import { TreatmentStatus } from '../entities/treatment.entity';

export function computeTreatmentStatus(
  cost: number,
  paid: number,
  progress: number,
  currentStatus: TreatmentStatus,
): TreatmentStatus {
  const isComplete = progress >= 100 && Number(cost) > 0 && Number(paid) >= Number(cost);

  if (isComplete) return TreatmentStatus.COMPLETADO;
  if (currentStatus === TreatmentStatus.COMPLETADO) return TreatmentStatus.EN_PROGRESO;
  return currentStatus;
}
