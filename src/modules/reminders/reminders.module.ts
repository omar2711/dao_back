import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import IORedis from 'ioredis';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SettingsModule } from '../settings/settings.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { getRedisOptions } from '../../config/redis.config';
import { isRedisEnabled } from '../../config/features';
import { REDIS_CLIENT, REMINDERS_QUEUE } from './reminders.constants';
import { RemindersService } from './services/reminders.service';
import { RemindersProcessor } from './reminders.processor';

// Los recordatorios necesitan Redis (cola + caché) y el worker corriendo en un
// proceso persistente. Cuando no hay Redis el módulo se monta igual
// —AppointmentsModule depende de RemindersService— pero con la cola y el
// cliente Redis en null; RemindersService lo detecta y se vuelve un no-op.
// El envío manual de WhatsApp sigue funcionando: no pasa por la cola.
const queueEnabled = isRedisEnabled();

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
      useFactory: (config: ConfigService) => {
        if (!queueEnabled) return null;
        const client = new IORedis(getRedisOptions(config));
        // Sin listener, ioredis escupe un stack completo por cada reintento.
        // Aquí basta una línea: la reconexión la sigue manejando ioredis.
        const logger = new Logger('RedisClient');
        let lastCode: string | null = null;
        client.on('error', (e: NodeJS.ErrnoException) => {
          if (e.code === lastCode) return; // no repetir el mismo fallo en bucle
          lastCode = e.code ?? null;
          logger.warn(`Redis no disponible (${e.code ?? e.message}); reintentando...`);
        });
        client.on('ready', () => {
          lastCode = null;
          logger.log('Redis conectado.');
        });
        return client;
      },
    },
  ],
  exports: [RemindersService],
})
export class RemindersModule {}
