import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('overview')
  overview(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.overview(from, to);
  }

  @Get('revenue-by-doctor')
  revenueByDoctor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.revenueByDoctor(from, to);
  }

  @Get('revenue-by-treatment')
  revenueByTreatment(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.revenueByTreatmentType(from, to);
  }

  @Get('treatments-by-doctor')
  treatmentsByDoctor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.treatmentsByDoctor(from, to);
  }

  // Desglose completo del desempeño de cada doctor tratante:
  // doctor → paciente → tratamientos, con totales y resumen por tipo.
  @Get('doctor-detail')
  doctorDetail(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.doctorDetail(from, to);
  }

  // El mismo árbol restringido a tratamientos con laboratorio.
  @Get('laboratory-by-doctor')
  laboratoryByDoctor(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.laboratoryByDoctor(from, to);
  }

  @Get('laboratory')
  laboratory(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.laboratory(from, to);
  }

  @Get('monthly-trend')
  monthlyTrend(@Query('months') months?: string) {
    return this.service.monthlyTrend(months ? Number(months) : 6);
  }
}
