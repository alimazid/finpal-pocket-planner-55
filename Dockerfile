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
ARG VITE_SUPABASE_URL  
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

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

WORKDIR /app

# Copy workspace package files
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production dependencies only
RUN npm ci --production

# Copy built backend and Prisma files
COPY --from=backend-builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=backend-builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client in production (ensure it matches production dependencies)
WORKDIR /app/apps/backend
RUN npx prisma generate

EXPOSE 3001

# Create startup script to handle errors better
RUN echo '#!/bin/sh\n\
echo "Starting backend server..."\n\
echo "DATABASE_URL is set: $(if [ -z "$DATABASE_URL" ]; then echo "NO"; else echo "YES"; fi)"\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy || echo "WARNING: Migrations failed, but continuing..."\n\
echo "Starting Node.js server..."\n\
node dist/server.js' > /start.sh && chmod +x /start.sh

# Run startup script
CMD ["/start.sh"]

# Default target for Railway (backend)
FROM backend-prod