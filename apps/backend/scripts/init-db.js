#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * This script is used for first-time database setup in production environments.
 * It should only be run when the database is completely empty.
 * 
 * Usage:
 *   node scripts/init-db.js
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseEmpty() {
  try {
    // Check if any tables exist
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'budgets', 'transactions')
    `;
    
    return Array.isArray(result) && result.length === 0;
  } catch (error) {
    console.log('Could not check database state:', error.message);
    return false;
  }
}

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...');
  
  try {
    // Check if database is empty
    const isEmpty = await checkDatabaseEmpty();
    
    if (!isEmpty) {
      console.log('⚠️  Database appears to have existing tables. Skipping initialization.');
      console.log('If you need to reset the database, please do so manually.');
      return;
    }
    
    console.log('📊 Database is empty. Running initial migration...');
    
    // Run migrations to create all tables
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Database initialization completed successfully!');
    
    // Verify setup
    const tablesResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('📋 Created tables:');
    tablesResult.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeDatabase();