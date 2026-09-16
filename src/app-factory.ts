import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const corsLogger = new Logger('CORS');

// Orígenes de desarrollo. En producción NO se aplican salvo que CORS_ORIGINS
// venga vacío (ver resolveCorsOrigins): dejar localhost permitido en un servidor
// público significa que cualquier app corriendo en la máquina de un usuario
// puede llamar a la API con sus credenciales.
const DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

// El frontend vive en Vercel, que reparte un dominio distinto a cada deploy de
// preview además del de producción. Listarlos a mano es imposible, así que el
// comodín va siempre permitido: sin esto, cada preview quedaba bloqueada por
// CORS y el login fallaba sin decir por qué.
//
// Para restringirlo a un dominio concreto, basta con definir CORS_ORIGINS: si
// está, manda ella y este comodín no se añade.
const VERCEL_CORS_ORIGINS = ['https://*.vercel.app'];

// Quita la barra final: el navegador manda el Origin sin ella y no haría match.
const normalize = (o: string) => o.trim().replace(/\/+$/, '');

function envCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '').split(',').map(normalize).filter(Boolean);
}

export function resolveCorsOrigins(): string[] {
  const fromEnv = envCorsOrigins();
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    return [...new Set([...DEV_CORS_ORIGINS, ...VERCEL_CORS_ORIGINS, ...fromEnv])];
  }

  // En producción sin CORS_ORIGINS se permiten los dominios de Vercel, que es
  // donde corre el frontend. NO se cae a los de desarrollo: dejar localhost
  // abierto en un servidor público permitiría a cualquier app local del usuario
  // llamar a la API con sus credenciales.
  if (fromEnv.length === 0) {
    corsLogger.warn(
      'CORS_ORIGINS está vacío. Permitiendo solo *.vercel.app. Defina ' +
        'CORS_ORIGINS=https://su-dominio para restringirlo a su dominio.',
    );
    return [...VERCEL_CORS_ORIGINS];
  }
  return [...new Set(fromEnv)];
}

// Un patrón puede llevar `*` como comodín de un tramo, p. ej.
// `https://*.vercel.app` para cubrir las previews sin listarlas una a una.
// El comodín no cruza `/`, así que `https://evil.com/x.vercel.app` no cuela.
// Exportada para poder probarla.
export function matchesOrigin(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) return origin === pattern;
  const rx = new RegExp(
    '^' + pattern.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$',
  );
  return rx.test(origin);
}

// Callback en vez de un array plano por dos motivos: soportar comodines y —sobre
// todo— poder registrar el rechazo. Un CORS bloqueado solo se ve en la consola
// del navegador; sin este log no queda rastro en el servidor de qué origen llamó.
function corsOriginChecker(allowed: string[]) {
  const rejected = new Set<string>();
  return (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
    // Sin cabecera Origin: peticiones del mismo origen, curl, health checks.
    // No son peticiones de navegador entre sitios, así que CORS no aplica.
    if (!origin) return cb(null, true);

    if (allowed.some((p) => matchesOrigin(normalize(origin), p))) return cb(null, true);

    // Solo la primera vez por origen: si no, un bucle de reintentos inunda el log.
    if (!rejected.has(origin)) {
      rejected.add(origin);
      corsLogger.warn(
        `Origen bloqueado: "${origin}". Añádalo a CORS_ORIGINS si es legítimo. ` +
          `Permitidos: ${allowed.join(', ')}`,
      );
    }
    cb(null, false);
  };
}

// Construcción de la aplicación, separada de main.ts para poder instanciarla
// en los tests sin levantar el servidor HTTP.
export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // El límite por defecto de Express (100 kB) se queda corto para el PDF del
  // presupuesto, que viaja en base64 dentro del JSON al enviarlo por WhatsApp.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.setGlobalPrefix('api');

  const allowedOrigins = resolveCorsOrigins();
  corsLogger.log(`Orígenes permitidos: ${allowedOrigins.join(', ')}`);

  app.enableCors({
    origin: corsOriginChecker(allowedOrigins),
    // La API no expone ningún @Put ni @Head; si se añade alguno, hay que
    // incluirlo aquí o el preflight lo rechazará.
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    // Cachea el preflight 24 h: sin esto el navegador manda un OPTIONS extra
    // antes de casi cada petición con cabecera Authorization.
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  return app;
}
