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
import { PatientsService } from '../services/patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { UpdatePatientDto } from '../dto/update-patient.dto';
import { stripPatientForDoctor } from '../../../common/utils/strip-patient.util';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get()
  async findAll(@Query('search') search: string, @Request() req) {
    const patients = await this.patientsService.findAll(search);
    if (req.user?.role === 'DOCTOR') {
      return patients.map(stripPatientForDoctor);
    }
    return patients;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const patient = await this.patientsService.findOne(id);
    if (req.user?.role === 'DOCTOR') {
      return stripPatientForDoctor(patient);
    }
    return patient;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.patientsService.remove(id);
  }
}
