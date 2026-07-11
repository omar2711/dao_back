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

  @IsEnum(OdontogramaTipo)
  tipo: OdontogramaTipo;

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
