# ---------- build ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# bcrypt compila un binario nativo; sin toolchain el `npm ci` falla a la mitad.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./

# bookworm-slim y no Alpine: bcrypt da guerra con musl.
#
# Instalar, compilar y desinstalar tiene que ocurrir en UNA SOLA capa. Las capas
# de Docker son acumulativas: si el `apt-get purge` va en un RUN posterior, los
# ~300 MB del toolchain siguen dentro de la imagen, solo que ocultos.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
# sql/ viaja en la imagen para poder aplicar el esquema desde el contenedor.
COPY --from=builder /app/sql  ./sql

# Solo estas dos carpetas necesitan escritura del usuario de la app; se crean
# aquí para que existan con el dueño correcto aunque el volumen del host venga
# vacío.
#
# Deliberadamente NO se hace `chown -R node:node /app`: eso reescribiría cada
# fichero de node_modules en una capa nueva y duplicaría el tamaño de la imagen
# (1,26 GB frente a los ~700 MB de ahora). Que node_modules y dist sigan siendo
# de root es además lo correcto: la aplicación solo necesita leerlos, y así no
# puede reescribir su propio código.
RUN mkdir -p uploads whatsapp-auth && chown node:node uploads whatsapp-auth

# Nunca root dentro del contenedor: si alguien se escapa del proceso, que no
# herede privilegios.
USER node

EXPOSE 3001

# GET /api/health responde sin autenticación y sin tocar la base: dice si el
# proceso está vivo, no si la base responde. Ver health.controller.ts.
#
# Con el fetch global de Node en vez de curl, para no arrastrar curl y sus
# dependencias solo por el healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
