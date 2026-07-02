import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// Convierte cadenas vacías a null (no a undefined) para que, al editar,
// un campo dejado en blanco realmente limpie el valor en la base de datos:
// TypeORM ignora las propiedades `undefined` en un UPDATE, pero sí aplica `null`.
function trimOrUndefined({ value }: { value: any }) {
  if (typeof value === 'string') return value.trim() || null;
  return value;
}

export class CreateClinicalHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  hcNumber?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  hora?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  enfermedadActual?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  tiempoEnfermedad?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosSintomas?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  relatoCronologico?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  funcionesBiologicas?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  antecedentesFamiliares?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  antecedentesPersonales?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  viajesUltimoAnio?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosVitalesPa?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosVitalesPulso?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosVitalesTemp?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosVitalesFc?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  signosVitalesFr?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  examenClinicoGeneral?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  examenClinicoOdontostomatologico?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  diagnosticoPresuntivo?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  diagnosticoDefinitivo?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  planTratamiento?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  pronostico?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  tratamientoRecomendaciones?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  controlEvolucion?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  altaPaciente?: string;
}
