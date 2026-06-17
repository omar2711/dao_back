import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export const PAYMENT_METHODS = ['EFECTIVO', 'YAPE', 'OTRO'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
  @IsEnum(PAYMENT_METHODS, {
    message: `paymentMethod debe ser uno de: ${PAYMENT_METHODS.join(', ')}`,
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
