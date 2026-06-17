import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentSession } from '../treatment-sessions/entities/treatment-session.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ReportsService } from './services/reports.service';
import { ReportsController } from './controllers/reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentSession, Treatment, Appointment])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
