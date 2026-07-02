import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentSession } from './entities/treatment-session.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { InventoryModule } from '../inventory/inventory.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TreatmentSessionsService } from './services/treatment-sessions.service';
import { TreatmentSessionsController } from './controllers/treatment-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TreatmentSession, Treatment]), InventoryModule, NotificationsModule],
  controllers: [TreatmentSessionsController],
  providers: [TreatmentSessionsService],
  exports: [TreatmentSessionsService],
})
export class TreatmentSessionsModule {}
