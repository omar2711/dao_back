import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @IsIn([30, 60])
  whatsappReminderLeadMinutes?: number;

  @IsOptional()
  @IsString()
  whatsappReminderTemplate?: string;
}
