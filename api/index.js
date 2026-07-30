// Entrypoint de las Serverless Functions de Vercel.
// El build (`npm run build` → nest build) genera dist/ con el TypeScript ya
// compilado, incluyendo los metadatos de los decoradores que Nest necesita.
// Acá solo se reexporta el handler; toda la lógica vive en src/serverless.ts.
module.exports = require('../dist/serverless').default;
