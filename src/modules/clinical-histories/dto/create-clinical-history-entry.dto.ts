import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// Mismo criterio que CreateClinicalHistoryDto: una cadena vacía se guarda como
// null para que al editar una actualización se pueda limpiar un campo.
function trimOrNull({ value }: { value: any }) {
  if (typeof value === 'string') return value.trim() || null;
  return value;
}

export class CreateClinicalHistoryEntryDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  motivo?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  procedimiento?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  indicaciones?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  observaciones?: string;
}
