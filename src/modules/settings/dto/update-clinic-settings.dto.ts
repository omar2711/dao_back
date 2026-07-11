import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateClinicSettingsDto {
  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  notifyAppointmentsConfirmed?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyAppointmentReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyNewPatients?: boolean;

  @IsOptional()
  @IsString()
  sessionDuration?: string;
}
