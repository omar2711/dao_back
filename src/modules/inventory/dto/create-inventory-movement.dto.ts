import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { InventoryMovementType } from '../entities/inventory-movement.entity';

export class CreateInventoryMovementDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsEnum(['IN', 'OUT', 'ADJUST'] as const, {
    message: 'type debe ser IN, OUT o ADJUST',
  })
  type: InventoryMovementType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsOptional()
  @IsUUID()
  treatmentSessionId?: string;
}
