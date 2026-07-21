export const REMINDERS_QUEUE = 'reminders';
export const REDIS_CLIENT = 'REDIS_CLIENT';

// Nombres de job dentro de la cola.
export const JOB_SEND = 'send';
export const JOB_SWEEP = 'sweep';

// Cada 25 min se refresca la caché y se reconcilian los recordatorios.
export const SWEEP_EVERY_MS = 25 * 60 * 1000;

// Los datos de cita en Redis expiran a los 7 días (limpieza automática).
export const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

// Horizonte de citas que el sweep carga desde la BDD hacia Redis.
export const HORIZON_DAYS = 7;

export const cacheKey = (appointmentId: string) => `dao:appt:${appointmentId}`;
