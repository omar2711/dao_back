import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { OdontogramaTipo } from '../entities/odontograma.entity';

export class CreateOdontogramaDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsUUID()
  clinicalHistoryId?: string;

  // Obsoleto: la UI ya no lo envía. Se conserva opcional por compatibilidad
  // con clientes antiguos; la columna queda siempre en INICIAL.
  @IsOptional()
  @IsEnum(OdontogramaTipo)
  tipo?: OdontogramaTipo;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsObject()
  teethData?: Record<string, any>;

  @IsOptional()
  @IsString()
  especificaciones?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  planTratamiento?: string;

  @IsOptional()
  @IsObject()
  toothObservations?: Record<string, any>;
}
