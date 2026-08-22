import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { isServerless } from './features';

// Neon exige TLS, pero un PostgreSQL instalado en el propio VPS normalmente no
// lo tiene configurado y forzarlo aborta la conexión al arrancar. Se decide por
// la URL en vez de por una bandera aparte, para que no haya dos sitios que
// puedan contradecirse.
export function needsSsl(url?: string): boolean {
  if (!url) return false;
  // sslmode explícito en la URL manda sobre cualquier heurística.
  if (/[?&]sslmode=(disable|allow)\b/i.test(url)) return false;
  if (/[?&]sslmode=(require|verify-ca|verify-full|prefer)\b/i.test(url)) return true;
  // Sin sslmode: local sin TLS, remoto con TLS.
  return !/@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/i.test(url);
}

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),
  // rejectUnauthorized: false porque Neon presenta un certificado que no está en
  // el almacén por defecto de Node.
  ssl: needsSsl(config.get<string>('DATABASE_URL'))
    ? { rejectUnauthorized: false }
    : false,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: config.get<string>('NODE_ENV') === 'development',
  logging: config.get<string>('NODE_ENV') === 'development',
  // En serverless cada contenedor abre su propio pool: con el default (10) se
  // agotan las conexiones de Neon cuando hay varios en paralelo.
  extra: isServerless() ? { max: 2 } : undefined,
});
