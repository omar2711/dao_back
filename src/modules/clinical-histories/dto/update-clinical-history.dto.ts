import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateClinicalHistoryDto } from './create-clinical-history.dto';

// patientId es inmutable (una historia no cambia de paciente); doctorId sí es
// editable porque el formulario permite corregir el doctor luego de creada.
export class UpdateClinicalHistoryDto extends PartialType(
  OmitType(CreateClinicalHistoryDto, ['patientId'] as const),
) {}
