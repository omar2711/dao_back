import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { TreatmentsService } from '../services/treatments.service';
import { CreateTreatmentDto } from '../dto/create-treatment.dto';
import { UpdateTreatmentDto } from '../dto/update-treatment.dto';
import { stripPatientForDoctor } from '../../../common/utils/strip-patient.util';

@Controller('treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentsController {
  constructor(private readonly service: TreatmentsService) {}

  @Post()
  create(@Body() dto: CreateTreatmentDto) {
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query('patientId') patientId: string | undefined, @Query('status') status: string | undefined, @Request() req) {
    const treatments = await this.service.findAll(patientId, status);
    if (req.user?.role === 'DOCTOR') {
      return treatments.map((t) => ({
        ...t,
        patient: t.patient ? stripPatientForDoctor(t.patient) : t.patient,
      }));
    }
    return treatments;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const treatment = await this.service.findOne(id);
    if (req.user?.role === 'DOCTOR') {
      return {
        ...treatment,
        patient: treatment.patient ? stripPatientForDoctor(treatment.patient) : treatment.patient,
      };
    }
    return treatment;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
