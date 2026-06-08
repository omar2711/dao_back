import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClinicalHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsString()
  hcNumber?: string;

  @IsDateString()
  fecha: string;

  @IsOptional()
  @IsString()
  hora?: string;

  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  enfermedadActual?: string;

  @IsOptional()
  @IsString()
  tiempoEnfermedad?: string;

  @IsOptional()
  @IsString()
  signosSintomas?: string;

  @IsOptional()
  @IsString()
  relatoCronologico?: string;

  @IsOptional()
  @IsString()
  funcionesBiologicas?: string;

  @IsOptional()
  @IsString()
  antecedentesFamiliares?: string;

  @IsOptional()
  @IsString()
  antecedentesPersonales?: string;

  @IsOptional()
  @IsString()
  viajesUltimoAnio?: string;

  @IsOptional()
  @IsString()
  signosVitalesPa?: string;

  @IsOptional()
  @IsString()
  signosVitalesPulso?: string;

  @IsOptional()
  @IsString()
  signosVitalesTemp?: string;

  @IsOptional()
  @IsString()
  signosVitalesFc?: string;

  @IsOptional()
  @IsString()
  signosVitalesFr?: string;

  @IsOptional()
  @IsString()
  examenClinicoGeneral?: string;

  @IsOptional()
  @IsString()
  examenClinicoOdontostomatologico?: string;

  @IsOptional()
  @IsString()
  diagnosticoPresuntivo?: string;

  @IsOptional()
  @IsString()
  diagnosticoDefinitivo?: string;

  @IsOptional()
  @IsString()
  planTratamiento?: string;

  @IsOptional()
  @IsString()
  pronostico?: string;

  @IsOptional()
  @IsString()
  tratamientoRecomendaciones?: string;

  @IsOptional()
  @IsString()
  controlEvolucion?: string;

  @IsOptional()
  @IsString()
  altaPaciente?: string;
}
