import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTreatmentSessionDto } from './create-treatment-session.dto';

export class UpdateTreatmentSessionDto extends PartialType(
  OmitType(CreateTreatmentSessionDto, ['treatmentId'] as const),
) {}
