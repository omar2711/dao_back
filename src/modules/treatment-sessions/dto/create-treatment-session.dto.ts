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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export const PAYMENT_METHODS = ['EFECTIVO', 'YAPE', 'OTRO'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export class SessionSupplyDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

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

  // Insumos consumidos en esta sesión — se descuentan del inventario en la
  // misma transacción que la sesión: si alguno falla, no se guarda nada.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionSupplyDto)
  supplies?: SessionSupplyDto[];
}
