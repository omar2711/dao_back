import { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'ioredis';

// Desglosa REDIS_URL (redis:// o rediss://) en opciones de ioredis, usadas tanto
// por BullMQ como por el cliente de caché. Default a localhost para desarrollo.
export function getRedisOptions(config: ConfigService): RedisOptions {
  const url = config.get<string>('REDIS_URL') || 'redis://localhost:6379';
  const u = new URL(url);
  const db = u.pathname && u.pathname.length > 1 ? Number(u.pathname.slice(1)) : 0;
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username || undefined,
    password: u.password || undefined,
    db: Number.isNaN(db) ? 0 : db,
    ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
    // BullMQ exige maxRetriesPerRequest: null en su conexión.
    maxRetriesPerRequest: null,
  };
}
