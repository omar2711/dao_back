import { Logger } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { isServerless } from './features';

const logger = new Logger('Database');

// En un .env el valor suele ir entrecomillado y dotenv quita las comillas al
// leerlo. Al copiar ese mismo valor al panel de variables de Vercel es fácil
// arrastrarlas, y entonces pasan a formar parte de la cadena: la URL deja de
// ser válida y el fallo aparece como un error de conexión, sin decir por qué.
// También se recorta el espacio en blanco, que se cuela al pegar.
export function cleanDatabaseUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^(['"])([\s\S]*)\1$/, '$2').trim();
  return cleaned || undefined;
}

// Neon exige TLS, pero un PostgreSQL local normalmente no lo tiene configurado
// y forzarlo aborta la conexión al arrancar. Se decide por la URL en vez de por
// una bandera aparte, para que no haya dos sitios que puedan contradecirse.
export function needsSsl(url?: string): boolean {
  if (!url) return false;
  // sslmode explícito en la URL manda sobre cualquier heurística.
  if (/[?&]sslmode=(disable|allow)\b/i.test(url)) return false;
  if (/[?&]sslmode=(require|verify-ca|verify-full|prefer)\b/i.test(url)) return true;
  // Sin sslmode: local sin TLS, remoto con TLS.
  return !/@(localhost|127\.0\.0\.1|\[::1\])(:|\/)/i.test(url);
}

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const url = cleanDatabaseUrl(config.get<string>('DATABASE_URL'));
  const serverless = isServerless();

  // Sin URL, TypeORM intenta conectar a localhost y falla con un ECONNREFUSED
  // que no dice nada. Este mensaje sale en los logs de Vercel y señala la causa.
  if (!url) {
    logger.error(
      'Falta DATABASE_URL. En Vercel se define en Settings -> Environment ' +
        'Variables, y hay que volver a desplegar para que el cambio surta efecto.',
    );
  }

  return {
    type: 'postgres',
    url,
    // rejectUnauthorized: false porque Neon presenta un certificado que no está
    // en el almacén por defecto de Node.
    ssl: needsSsl(url) ? { rejectUnauthorized: false } : false,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: config.get<string>('NODE_ENV') === 'development',
    logging: config.get<string>('NODE_ENV') === 'development',
    // Un Neon dormido tarda varios segundos en despertar (medido: ~7 s en la
    // primera conexión, ~0,5 s después). Los reintentos por defecto son 10 cada
    // 3 s: más de 30 segundos antes de rendirse, cuando una función de Vercel se
    // corta mucho antes. Se reintenta poco y se espera más por intento, que es
    // lo que de verdad hace falta aquí.
    retryAttempts: serverless ? 2 : 10,
    retryDelay: 1000,
    extra: {
      // En serverless cada contenedor abre su propio pool: con el default (10)
      // se agotan las conexiones de Neon cuando hay varios en paralelo.
      max: serverless ? 2 : 10,
      // Margen para el arranque en frío de Neon.
      connectionTimeoutMillis: 15000,
    },
  };
};
