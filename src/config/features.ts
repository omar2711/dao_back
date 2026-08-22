// Flags de entorno para la funcionalidad que exige un proceso persistente:
// el socket único de WhatsApp (Baileys) con filesystem de escritura, y
// Redis/BullMQ para las colas de recordatorios. En serverless (Vercel) nada de
// eso existe, así que se apaga solo.
//
// Ojo: son funciones (no constantes) para que se evalúen DESPUÉS de que
// ConfigModule.forRoot() haya cargado el .env en process.env.

export function isServerless(): boolean {
  return !!process.env.VERCEL;
}

// WhatsApp solo necesita disco + proceso vivo: en local funciona sin Redis.
// Se puede forzar con ENABLE_WHATSAPP=true|false.
export function isWhatsappEnabled(): boolean {
  const flag = process.env.ENABLE_WHATSAPP;
  if (flag !== undefined && flag !== '') return flag === 'true';
  return !isServerless();
}

// Las colas se activan solo si hay un Redis al que apuntar. Sin REDIS_URL no se
// asume localhost: ioredis reintentaría contra un puerto muerto y llenaría el
// log. En el VPS basta con definir REDIS_URL para encenderlas.
// Se puede forzar con ENABLE_REDIS=true|false.
export function isRedisEnabled(): boolean {
  const flag = process.env.ENABLE_REDIS;
  if (flag !== undefined && flag !== '') return flag === 'true';
  if (isServerless()) return false;
  return !!process.env.REDIS_URL;
}
