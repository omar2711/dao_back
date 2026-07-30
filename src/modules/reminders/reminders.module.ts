import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SettingsModule } from '../settings/settings.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { getRedisOptions } from '../../config/redis.config';
import { isWhatsappEnabled } from '../../config/features';
import { REDIS_CLIENT, REMINDERS_QUEUE } from './reminders.constants';
import { RemindersService } from './services/reminders.service';
import { RemindersProcessor } from './reminders.processor';

// Los recordatorios necesitan Redis (cola + caché) y el worker corriendo en un
// proceso persistente. Cuando no hay Redis (serverless) el módulo se monta
// igual —AppointmentsModule depende de RemindersService— pero con la cola y el
// cliente Redis en null; RemindersService lo detecta y se vuelve un no-op.
const queueEnabled = isWhatsappEnabled();

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    ...(queueEnabled ? [BullModule.registerQueue({ name: REMINDERS_QUEUE })] : []),
    SettingsModule,
    WhatsappModule,
  ],
  providers: [
    RemindersService,
    ...(queueEnabled
      ? [RemindersProcessor]
      : // Sin registerQueue el token de la cola no existe y @InjectQueue fallaría.
        [{ provide: getQueueToken(REMINDERS_QUEUE), useValue: null }]),
    {
      // Cliente Redis dedicado para la caché de citas (independiente de BullMQ).
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        queueEnabled ? new IORedis(getRedisOptions(config)) : null,
    },
  ],
  exports: [RemindersService],
})
export class RemindersModule {}
