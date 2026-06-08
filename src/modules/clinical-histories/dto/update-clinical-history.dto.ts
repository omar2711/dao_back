import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateClinicalHistoryDto } from './create-clinical-history.dto';

export class UpdateClinicalHistoryDto extends PartialType(
  OmitType(CreateClinicalHistoryDto, ['patientId', 'doctorId'] as const),
) {}
