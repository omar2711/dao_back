// Vercel inyecta VERCEL=1 en sus builds y en el runtime de las funciones.
// Sirve para ajustar lo que depende del entorno de ejecución, como el tamaño
// del pool de conexiones (ver database.config.ts).
//
// Ojo: es una función (no una constante) para que se evalúe DESPUÉS de que
// ConfigModule.forRoot() haya cargado el .env en process.env.
export function isServerless(): boolean {
  return !!process.env.VERCEL;
}
