import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './config/database.js';

// Load environment variables
dotenv.config();

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
    
    const { execSync } = await import('child_process');
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
    
    if (isProduction) {
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
        console.log('❌ Migration deploy failed, trying db push without reset...');
        try {
          // Fallback: db push without destructive flags
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
          console.log('❌ All database setup attempts failed');
          console.log('Database might already be set up or there might be a connection issue');
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
        console.log('❌ Database push failed, trying migrate deploy...');
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
          console.log('❌ All database setup attempts failed');
          console.log('Database might already be set up or there might be a connection issue');
        }
      }
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