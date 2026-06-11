import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateTreatmentSessionDto {
  @IsUUID()
  @IsNotEmpty()
  treatmentId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsUUID()
  paymentDoctorId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsDateString()
  sessionDate: string;

  @IsString()
  @IsNotEmpty()
  procedureDone: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  teethTreated?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountCharged?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
