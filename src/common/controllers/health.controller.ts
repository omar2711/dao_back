import { Controller, Get } from '@nestjs/common';

// Endpoint público de salud. Lo usan el HEALTHCHECK de la imagen Docker y el
// `depends_on: condition: service_healthy` del compose, así que no lleva guardas:
// un 401 haría que el contenedor se considerase enfermo para siempre.
//
// Es una comprobación de VIDA, no de disponibilidad: dice que el proceso
// responde, deliberadamente sin tocar la base de datos. Si consultara Postgres,
// un corte breve de la base haría que Docker matara y reiniciara el backend en
// bucle —convirtiendo un problema pasajero en una caída— y además reiniciaría la
// sesión de WhatsApp cada vez.
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
