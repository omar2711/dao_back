import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TreatmentCategory } from '../entities/treatment-catalog-item.entity';

export class CreateTreatmentCatalogItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TreatmentCategory)
  category: TreatmentCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
