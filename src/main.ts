import { createApp } from './app-factory';

// Arranque como proceso normal (local y VPS con pm2).
// El despliegue en Vercel NO pasa por acá: usa src/serverless.ts vía api/index.js.
async function bootstrap() {
  const app = await createApp();

  const port = process.env.APP_PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}
bootstrap();
