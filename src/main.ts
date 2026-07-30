import { createApp } from './app-factory';

async function bootstrap() {
  const app = await createApp();

  // Vercel inyecta PORT y espera que el server escuche ahí; en local/VPS manda APP_PORT.
  const port = process.env.PORT ?? process.env.APP_PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
