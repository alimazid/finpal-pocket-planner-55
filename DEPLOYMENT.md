# FinPal Monorepo Deployment Guide

This guide covers deploying the FinPal Pocket Planner monorepo to Railway using NPM workspaces and Docker.

## Architecture Overview

The project is now structured as a monorepo with:
- **apps/frontend**: React frontend with Vite
- **apps/backend**: Express.js backend with Prisma ORM
- **packages/shared**: Shared utilities and types (future use)

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database
- NPM workspaces support (npm 7+)

### Setup
```bash
# Install all dependencies
npm install

# Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your database URL

# Generate Prisma client
npm run db:generate

# Run database migrations (optional for development)
npm run db:push

# Start both services
npm run dev
```

### Available Scripts
- `npm run dev` - Start both frontend and backend in watch mode
- `npm run build` - Build both services for production
- `npm run build:frontend` - Build frontend only
- `npm run build:backend` - Build backend only
- `npm run start:backend` - Start backend in production mode
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:studio` - Open Prisma Studio

## Railway Deployment

### Option 1: Two Separate Services (Recommended)

Create two Railway services from the same GitHub repository:

#### Backend Service
1. **Create Service**: Deploy from GitHub, select your repository
2. **Service Name**: `finpal-backend`
3. **Build Configuration**:
   - Builder: Dockerfile
   - Build Command: `docker build --target backend-prod -t backend .`
   - Start Command: `node dist/server.js`

4. **Environment Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secure-jwt-secret-32-chars-min
   NODE_ENV=production
   PORT=3001
   FRONTEND_URL=https://${{finpal-frontend.RAILWAY_PUBLIC_DOMAIN}}
   ```

5. **Add PostgreSQL Database**: Click "Add Service" → "PostgreSQL"

#### Frontend Service  
1. **Create Service**: Deploy from same GitHub repository
2. **Service Name**: `finpal-frontend`
3. **Build Configuration**:
   - Builder: Dockerfile
   - Build Command: `docker build --target frontend-prod -t frontend .`
   - Start Command: `caddy run --config /etc/caddy/Caddyfile`

4. **Environment Variables**:
   ```
   VITE_API_URL=https://${{finpal-backend.RAILWAY_PUBLIC_DOMAIN}}
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Option 2: Single Service (Alternative)

If you prefer a single service:
1. Deploy from GitHub repository
2. Use the root `railway.json` configuration
3. The default Dockerfile target will run the backend
4. Set up reverse proxy to serve frontend files

## Docker Configuration

The project includes a multi-stage Dockerfile with:
- **base**: Installs all workspace dependencies
- **frontend-builder**: Builds React frontend
- **backend-builder**: Builds Express backend and generates Prisma client
- **frontend-prod**: Caddy server serving static files
- **backend-prod**: Node.js server (default target)

### Build Targets
```bash
# Backend service
docker build --target backend-prod -t finpal-backend .

# Frontend service  
docker build --target frontend-prod -t finpal-frontend .
```

## Environment Variables Reference

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001        # Backend API URL
VITE_SUPABASE_URL=your-supabase-url       # Supabase project URL
VITE_SUPABASE_ANON_KEY=your-supabase-key  # Supabase anonymous key
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:5432/db  # PostgreSQL connection
JWT_SECRET=your-jwt-secret-here                   # JWT signing secret
NODE_ENV=development                              # Environment
PORT=3001                                         # Server port
FRONTEND_URL=http://localhost:8080                # Frontend URL for CORS
```

## Database Management

### Migrations
```bash
# Run migrations in production
npm run db:migrate -w apps/backend

# Push schema changes (development)
npm run db:push -w apps/backend

# Reset database (development only)
npx prisma migrate reset --workspace apps/backend
```

### Prisma Studio
```bash
# Open database GUI
npm run db:studio -w apps/backend
```

## Troubleshooting

### Build Issues
- Ensure all TypeScript errors are resolved
- Verify Prisma client is generated: `npm run db:generate`
- Check that all environment variables are set correctly

### Deployment Issues
- Verify Railway environment variables match your configuration
- Check Railway build logs for specific errors
- Ensure database is properly connected and migrated

### Local Development Issues
- Make sure PostgreSQL is running
- Verify database connection in `.env` file
- Check that frontend can reach backend API

## Production Considerations

### Security
- Use strong JWT secrets (32+ characters)
- Enable CORS only for your frontend domain
- Set up proper database user permissions
- Consider rate limiting configuration

### Performance
- Frontend build includes code splitting warnings - consider implementing
- Database indexes are configured for common queries
- Consider implementing Redis for session storage at scale

### Monitoring
- Railway provides built-in metrics and logs
- Consider adding application-level logging
- Monitor database performance and query patterns

## Future Enhancements

The monorepo structure supports:
- Shared TypeScript types between frontend and backend
- Capacitor integration for mobile apps
- Microservices expansion
- Shared utility packages
- CI/CD pipeline integration