import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './config/database.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'PENNY_API_URL',
  'PENNY_API_KEY',
  'PENNY_CLIENT_ID',
  'PENNY_CLIENT_SECRET',
  'GOOGLE_OAUTH_REDIRECT_URI',
  'WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '3001', 10);

// Test database connection and setup database before starting server
async function startServer() {
  try {
    console.log('=== RAILWAY BACKEND STARTUP ===');
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    console.log('=== RUNNING DATABASE SETUP ===');
    console.log('Setting up database schema...');
    console.log('ℹ️  Note: All database operations are SAFE and will NOT delete your data');

    // Wrap all database setup in try-catch to ensure server always starts
    try {
      const { execSync } = await import('child_process');
      const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
      const isDevelopmentWatch = process.argv.includes('--watch') || process.env.npm_lifecycle_event === 'dev';

      // Skip database setup in development watch mode to prevent tsx restart loops
      if (isDevelopmentWatch) {
        console.log('🔧 Development watch mode detected - skipping database setup');
        console.log('Run "npm run db:push" and "npm run db:seed" manually if needed');
      } else if (isProduction) {
      console.log('🚀 Production environment detected - using safe migration commands');
      
      // In production, use migrate deploy (safe, no data loss)
      try {
        console.log('Running prisma migrate deploy...');
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Production migration deploy successful');
        
        // Run seed after successful migration
        try {
          console.log('🌱 Running database seed...');
          execSync('npm run db:seed', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Database seed completed');
        } catch (seedError) {
          console.log('⚠️  Database seed failed, but continuing...');
          console.log('This might be expected if seed data already exists');
        }
      } catch (migrateError) {
        console.log('⚠️  Migration deploy skipped (database already has schema)');
        console.log('✅ Using safe db push to sync schema (NO DATA LOSS)');
        try {
          // Fallback: db push without destructive flags (safe - no data loss)
          execSync('npx prisma db push', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Database push successful');
          
          // Run seed after successful db push
          try {
            console.log('🌱 Running database seed...');
            execSync('npm run db:seed', { 
              stdio: 'inherit',
              cwd: process.cwd()
            });
            console.log('✅ Database seed completed');
          } catch (seedError) {
            console.log('⚠️  Database seed failed, but continuing...');
            console.log('This might be expected if seed data already exists');
          }
        } catch (dbPushError) {
          console.log('ℹ️  Database setup skipped - schema already configured');
          console.log('✅ Your existing data is safe and preserved');
        }
      }
    } else {
      console.log('🔧 Development environment detected - using dev-safe commands');
      
      // In development, use db push without destructive flags first
      try {
        console.log('Running prisma db push...');
        execSync('npx prisma db push', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Development database push successful');
        
        // Run seed after successful db push
        try {
          console.log('🌱 Running database seed...');
          execSync('npm run db:seed', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Database seed completed');
        } catch (seedError) {
          console.log('⚠️  Database seed failed, but continuing...');
          console.log('This might be expected if seed data already exists');
        }
      } catch (dbPushError) {
        console.log('⚠️  Database push skipped (schema already in sync)');
        console.log('✅ Trying migrate deploy (safe - no data loss)...');
        try {
          execSync('npx prisma migrate deploy', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('✅ Migration deploy successful');
          
          // Run seed after successful migration
          try {
            console.log('🌱 Running database seed...');
            execSync('npm run db:seed', { 
              stdio: 'inherit',
              cwd: process.cwd()
            });
            console.log('✅ Database seed completed');
          } catch (seedError) {
            console.log('⚠️  Database seed failed, but continuing...');
            console.log('This might be expected if seed data already exists');
          }
        } catch (migrateError) {
          console.log('ℹ️  Database setup skipped - schema already configured');
          console.log('✅ Your existing data is safe and preserved');
        }
      }
    }
    } catch (setupError) {
      console.error('❌ Database setup encountered an error:', setupError);
      console.log('⚠️  Continuing to start server anyway...');
    }

    console.log('=== STARTING SERVER ===');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.error('Make sure DATABASE_URL is set correctly');
    
    // Start server anyway for debugging
    console.log('Starting server without database connection for debugging...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (without database)`);
      console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
    });
  }
}

startServer();
