import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppointmentStatus } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsUUID()
  doctorId: string;

  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
