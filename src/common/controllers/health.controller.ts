import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Endpoint público de salud, sin guardas: se consulta desde fuera para saber si
// el despliegue está vivo, y un 401 lo haría inútil.
//
// GET /api/health es una comprobación de VIDA: dice que el proceso responde,
// deliberadamente sin tocar la base de datos, para que un corte pasajero de
// Postgres no marque como caído un backend que está perfectamente vivo.
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  check() {
    return {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  // GET /api/health/db sí consulta la base, y es la forma de distinguir "el
  // backend está caído" de "el backend vive pero no alcanza Postgres" sin tener
  // que leer los logs de la plataforma. Nunca devuelve la URL de conexión ni las
  // credenciales: solo si hay URL configurada, y el motivo del fallo.
  @Get('db')
  async checkDb() {
    const configured = !!process.env.DATABASE_URL;
    const started = Date.now();

    try {
      await this.dataSource.query('select 1');
      return {
        status: 'ok',
        database: 'conectada',
        urlConfigurada: configured,
        ms: Date.now() - started,
      };
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      return {
        status: 'error',
        database: 'sin conexión',
        urlConfigurada: configured,
        ms: Date.now() - started,
        // El código (ENOTFOUND, ECONNREFUSED, 28P01...) suele bastar para saber
        // si falta la variable, si la contraseña es otra o si no hay red.
        codigo: err.code ?? null,
        detalle: err.message,
      };
    }
  }
}
