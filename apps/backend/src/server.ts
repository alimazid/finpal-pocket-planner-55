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
    
    // Import and run database push
    const { execSync } = await import('child_process');
    try {
      execSync('npx prisma db push --accept-data-loss --force-reset', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database schema setup successful');
    } catch (dbPushError) {
      console.log('❌ Database push failed, trying migrate deploy...');
      try {
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Migration deploy successful');
      } catch (migrateError) {
        console.log('❌ Migration deploy also failed, continuing anyway...');
        console.log('Database might already be set up or there might be a connection issue');
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