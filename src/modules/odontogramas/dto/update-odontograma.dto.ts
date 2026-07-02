import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateOdontogramaDto } from './create-odontograma.dto';

// patientId es inmutable (un odontograma no cambia de paciente); doctorId sí
// es editable porque el formulario permite corregir el doctor luego de creado.
export class UpdateOdontogramaDto extends PartialType(
  OmitType(CreateOdontogramaDto, ['patientId'] as const),
) {}
