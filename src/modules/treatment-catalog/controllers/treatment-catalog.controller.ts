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
import { TreatmentCatalogService } from '../services/treatment-catalog.service';
import { CreateTreatmentCatalogItemDto } from '../dto/create-treatment-catalog-item.dto';
import { UpdateTreatmentCatalogItemDto } from '../dto/update-treatment-catalog-item.dto';

@Controller('treatment-catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentCatalogController {
  constructor(private readonly service: TreatmentCatalogService) {}

  @Get()
  findAll(@Query('onlyActive') onlyActive?: string) {
    return this.service.findAll(onlyActive === 'true');
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateTreatmentCatalogItemDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentCatalogItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
