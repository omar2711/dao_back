import { PartialType } from '@nestjs/mapped-types';
import { CreateClinicalHistoryEntryDto } from './create-clinical-history-entry.dto';

export class UpdateClinicalHistoryEntryDto extends PartialType(
  CreateClinicalHistoryEntryDto,
) {}
