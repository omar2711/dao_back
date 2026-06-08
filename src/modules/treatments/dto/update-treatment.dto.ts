import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTreatmentDto } from './create-treatment.dto';

export class UpdateTreatmentDto extends PartialType(
  OmitType(CreateTreatmentDto, ['patientId', 'doctorId'] as const),
) {}
