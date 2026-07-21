import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './database/database.module';
import { getRedisOptions } from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ClinicalHistoriesModule } from './modules/clinical-histories/clinical-histories.module';
import { OdontogramasModule } from './modules/odontogramas/odontogramas.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { TreatmentCatalogModule } from './modules/treatment-catalog/treatment-catalog.module';
import { TreatmentSessionsModule } from './modules/treatment-sessions/treatment-sessions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { BudgetsModule } from './modules/budgets/budgets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ connection: getRedisOptions(config) }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    ClinicalHistoriesModule,
    OdontogramasModule,
    TreatmentsModule,
    TreatmentCatalogModule,
    TreatmentSessionsModule,
    ReportsModule,
    InventoryModule,
    NotificationsModule,
    SettingsModule,
    WhatsappModule,
    RemindersModule,
    BudgetsModule,
  ],
})
export class AppModule {}
