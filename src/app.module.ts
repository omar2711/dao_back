import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicalHistoriesModule } from './modules/clinical-histories/clinical-histories.module';
import { OdontogramasModule } from './modules/odontogramas/odontogramas.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    ClinicalHistoriesModule,
    OdontogramasModule,
    TreatmentsModule,
  ],
})
export class AppModule {}
