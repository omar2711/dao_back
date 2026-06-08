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
import { OdontogramasService } from '../services/odontogramas.service';
import { CreateOdontogramaDto } from '../dto/create-odontograma.dto';
import { UpdateOdontogramaDto } from '../dto/update-odontograma.dto';

@Controller('odontogramas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OdontogramasController {
  constructor(private readonly service: OdontogramasService) {}

  @Post()
  create(@Body() dto: CreateOdontogramaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('clinicalHistoryId') clinicalHistoryId?: string,
  ) {
    return this.service.findAll(patientId, clinicalHistoryId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOdontogramaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
