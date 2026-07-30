// Flags de entorno para la funcionalidad que exige un proceso persistente:
// Redis/BullMQ (colas), el socket único de WhatsApp y un filesystem con
// escritura. En serverless (Vercel) nada de eso existe, así que se apaga solo.
//
// Se puede forzar con ENABLE_WHATSAPP=true|false.
// Ojo: son funciones (no constantes) para que se evalúen DESPUÉS de que
// ConfigModule.forRoot() haya cargado el .env en process.env.

export function isServerless(): boolean {
  return !!process.env.VERCEL;
}

export function isWhatsappEnabled(): boolean {
  const flag = process.env.ENABLE_WHATSAPP;
  if (flag !== undefined && flag !== '') return flag === 'true';
  return !isServerless();
}
