import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InventoryService } from '../services/inventory.service';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { CreateInventoryMovementDto } from '../dto/create-inventory-movement.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  // ─── Items ───
  @Post('items')
  createItem(@Body() dto: CreateInventoryItemDto) {
    return this.service.createItem(dto);
  }

  @Get('items')
  findAllItems(@Query('lowStock') lowStock?: string) {
    return this.service.findAllItems(lowStock === 'true');
  }

  @Get('items/:id')
  findOneItem(@Param('id') id: string) {
    return this.service.findOneItem(id);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles('ADMIN')
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id);
  }

  // ─── Movements ───
  @Post('movements')
  createMovement(@Body() dto: CreateInventoryMovementDto) {
    return this.service.createMovement(dto);
  }

  @Get('movements')
  listMovements(
    @Query('itemId') itemId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('treatmentId') treatmentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listMovements({ itemId, doctorId, treatmentId, from, to });
  }

  // ─── Consumption reports ───
  @Get('consumption/by-doctor')
  consumptionByDoctor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.consumptionByDoctor(from, to);
  }

  @Get('consumption/by-treatment')
  consumptionByTreatment(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.consumptionByTreatment(from, to);
  }
}
