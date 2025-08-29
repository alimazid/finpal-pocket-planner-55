import dotenv from 'dotenv';
import app from './app.js';
import { prisma } from './config/database.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

// Test database connection before starting server
async function startServer() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
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