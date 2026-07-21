import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { BudgetStatus } from '../entities/budget.entity';

export class BudgetItemDto {
  @IsOptional()
  @IsString()
  toothNumber?: string | null;

  @IsOptional()
  @IsUUID()
  treatmentCatalogItemId?: string | null;

  @IsString()
  @IsNotEmpty()
  treatmentName: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class CreateBudgetDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  doctorId: string;

  @IsOptional()
  @IsUUID()
  odontogramaId?: string | null;

  @IsOptional()
  @IsUUID()
  clinicalHistoryId?: string | null;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemDto)
  items: BudgetItemDto[];
}
