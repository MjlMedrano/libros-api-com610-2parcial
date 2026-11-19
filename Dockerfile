# Etapa 1: dependencias de producción
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: imagen final (sin herramientas de build ni pruebas)
FROM node:20-alpine
WORKDIR /app
ARG APP_COMMIT=dev
ENV NODE_ENV=production \
    PORT=3000 \
    APP_COMMIT=$APP_COMMIT
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
# La configuración de RDS (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) llega por variables de entorno.
CMD ["node", "src/server.js"]
