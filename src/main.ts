import '@nestjs/core';
import { createApp } from './app-factory';

// Único arranque, tanto en local como en Vercel.
//
// Vercel detecta el proyecto como backend de NestJS y busca un entrypoint
// dentro del directorio de salida (dist/main.js, ver vercel.json), así que no
// hace falta ningún handler aparte: levanta este mismo servidor y le inyecta
// PORT. Por eso PORT manda sobre APP_PORT.
//
// No reintroducir el patrón api/index.js + "rewrites": esta versión de Vercel
// lo ignora y falla con "No entrypoint found in output directory".
async function bootstrap() {
  const app = await createApp();

  const port = process.env.PORT ?? process.env.APP_PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
