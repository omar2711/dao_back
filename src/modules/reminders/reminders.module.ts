import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SettingsModule } from '../settings/settings.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { getRedisOptions } from '../../config/redis.config';
import { REDIS_CLIENT, REMINDERS_QUEUE } from './reminders.constants';
import { RemindersService } from './services/reminders.service';
import { RemindersProcessor } from './reminders.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    BullModule.registerQueue({ name: REMINDERS_QUEUE }),
    SettingsModule,
    WhatsappModule,
  ],
  providers: [
    RemindersService,
    RemindersProcessor,
    {
      // Cliente Redis dedicado para la caché de citas (independiente de BullMQ).
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new IORedis(getRedisOptions(config)),
    },
  ],
  exports: [RemindersService],
})
export class RemindersModule {}
