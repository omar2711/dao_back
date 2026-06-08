import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOdontogramaDto } from './create-odontograma.dto';

export class UpdateOdontogramaDto extends PartialType(
  OmitType(CreateOdontogramaDto, ['patientId', 'doctorId'] as const),
) {}
