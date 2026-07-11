import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  // Filiación extra (Historia Clínica Odontológica – MINSA 2019)
  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsString()
  procedencia?: string;

  @IsOptional()
  @IsString()
  ocupacion?: string;

  @IsOptional()
  @IsString()
  distrito?: string;

  @IsOptional()
  @IsString()
  gradoInstruccion?: string;

  @IsOptional()
  @IsString()
  nombreMadre?: string;

  @IsOptional()
  @IsString()
  ocupacionMadre?: string;

  @IsOptional()
  @IsString()
  telefonoMadre?: string;

  @IsOptional()
  @IsString()
  nombrePadre?: string;

  @IsOptional()
  @IsString()
  ocupacionPadre?: string;

  @IsOptional()
  @IsString()
  telefonoPadre?: string;

  @IsOptional()
  @IsString()
  alergias?: string;

  @IsOptional()
  @IsString()
  enfermedades?: string;

  @IsOptional()
  @IsString()
  emergenciaContacto?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
