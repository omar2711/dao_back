import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from './app-factory';

// Handler para las Serverless Functions de Vercel.
// Nest se instancia una sola vez por contenedor (en el cold start) y se reusa
// en las invocaciones siguientes; por eso se cachea la promesa, no el objeto:
// dos requests simultáneos en un cold start deben esperar el mismo bootstrap.
let bootstrapped: Promise<any> | null = null;

async function getExpressInstance(): Promise<any> {
  const app = await createApp();
  // En serverless no se hace listen(): el servidor HTTP lo provee Vercel.
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!bootstrapped) {
    bootstrapped = getExpressInstance().catch((e) => {
      // Si el bootstrap falla, no dejar la promesa rota en caché: que el
      // próximo request reintente en lugar de fallar para siempre.
      bootstrapped = null;
      throw e;
    });
  }

  const server = await bootstrapped;
  return server(req, res);
}
