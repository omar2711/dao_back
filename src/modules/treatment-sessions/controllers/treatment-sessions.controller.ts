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
import { TreatmentSessionsService } from '../services/treatment-sessions.service';
import { CreateTreatmentSessionDto } from '../dto/create-treatment-session.dto';
import { UpdateTreatmentSessionDto } from '../dto/update-treatment-session.dto';

@Controller('treatment-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentSessionsController {
  constructor(private readonly service: TreatmentSessionsService) {}

  @Post()
  create(@Body() dto: CreateTreatmentSessionDto) {
    return this.service.create(dto);
  }

  @Get('summary/by-doctor')
  summaryByDoctor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.summaryByDoctor(from, to);
  }

  @Get()
  findAll(@Query('treatmentId') treatmentId?: string) {
    return this.service.findAll(treatmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentSessionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
