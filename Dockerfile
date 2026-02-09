# Base stage for all workspace dependencies
FROM node:20-alpine AS base

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including workspace deps)
RUN npm ci

# Frontend builder
FROM base AS frontend-builder

# Copy frontend source
COPY apps/frontend/ ./apps/frontend/
COPY packages/ ./packages/

# Build frontend
WORKDIR /app/apps/frontend

# Build args for environment variables
ARG VITE_API_URL

ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Backend builder
FROM base AS backend-builder

# Copy backend source
COPY apps/backend/ ./apps/backend/
COPY packages/ ./packages/

# Generate Prisma client first (from backend directory but client goes to root node_modules)
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Frontend production image
FROM caddy:2-alpine AS frontend-prod

# Copy built frontend files
COPY --from=frontend-builder /app/apps/frontend/dist /srv

# Copy Caddy configuration
COPY apps/frontend/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

# Backend production image
FROM node:20-alpine AS backend-prod

# Install OpenSSL and other dependencies required by Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy workspace package files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --production

# Copy built backend, Prisma files, and deploy scripts
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=backend-builder /app/apps/backend/scripts ./apps/backend/scripts
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client in production (ensure it matches production dependencies)
WORKDIR /app/apps/backend
RUN npx prisma generate

EXPOSE 3001

# Create startup script
RUN echo '#!/bin/sh\n\
set -e\n\
echo "=== RAILWAY BACKEND STARTUP ==="\n\
echo "=== RUNNING DATABASE MIGRATIONS ==="\n\
npx prisma migrate deploy && echo "✅ Migrations applied" || {\n\
  echo "⚠️  migrate deploy failed, trying db push..."\n\
  npx prisma db push --skip-generate && echo "✅ Schema pushed" || {\n\
    echo "⚠️  DB setup had issues, continuing anyway..."\n\
  }\n\
}\n\
echo "=== RUNNING DEPLOY MIGRATIONS ==="\n\
node scripts/deploy-migrate.js || echo "⚠️  Deploy migration had issues, continuing..."\n\
echo "=== STARTING SERVER ==="\n\
node dist/server.js' > /start.sh && chmod +x /start.sh

# Run startup script
CMD ["/start.sh"]
