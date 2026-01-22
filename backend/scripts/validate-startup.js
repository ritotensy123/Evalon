#!/usr/bin/env node

/**
 * Startup validation script
 * Run this script to validate the system before starting the server
 * Usage: node scripts/validate-startup.js
 */

const mongoose = require('mongoose');
const { performDatabaseHealthCheck, autoFixDataIssues } = require('../src/utils/databaseHealth');
const logger = require('../src/utils/logger');
require('dotenv').config();

async function validateStartup() {
  logger.info('🚀 Starting system validation...');
  
  try {
    // 1. Check environment variables
    logger.info('🔍 Checking environment variables...');
    const requiredEnvVars = [
      'MONGODB_URI', 
      'JWT_SECRET', 
      'SESSION_SECRET',
      'PORT',
      'REALTIME_PORT',
      'FRONTEND_URL',
      'ALLOWED_ORIGINS'
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      logger.error('❌ Missing required environment variables:', { missing: missingEnvVars });
      logger.error('💡 Please check your .env file and ensure all required variables are set');
      process.exit(1);
    }
    logger.info('✅ Environment variables validated');
    
    // 1.1. Validate port configuration
    logger.info('🔍 Validating port configuration...');
    const port = parseInt(process.env.PORT);
    const realtimePort = parseInt(process.env.REALTIME_PORT);
    
    if (isNaN(port) || port < 1024 || port > 65535) {
      logger.error(`❌ Invalid PORT: ${process.env.PORT}. Must be between 1024 and 65535`);
      process.exit(1);
    }
    
    if (isNaN(realtimePort) || realtimePort < 1024 || realtimePort > 65535) {
      logger.error(`❌ Invalid REALTIME_PORT: ${process.env.REALTIME_PORT}. Must be between 1024 and 65535`);
      process.exit(1);
    }
    
    if (port === realtimePort) {
      logger.error(`❌ PORT and REALTIME_PORT cannot be the same: ${port}`);
      process.exit(1);
    }
    
    logger.info(`✅ Ports validated: API=${port}, Realtime=${realtimePort}`);

    // 2. Test database connection
    logger.info('🔍 Testing database connection...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      logger.error('❌ MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    // ENFORCED: Database name is ALWAYS 'evalon' - no configuration allowed
    const REQUIRED_DB_NAME = 'evalon';
    
    await mongoose.connect(mongoUri, { dbName: REQUIRED_DB_NAME });
    logger.info('✅ Database connection successful');
    logger.info(`📁 Connected to database: ${mongoose.connection.db.databaseName}`);

    // 3. Validate database name - MUST be 'evalon'
    if (mongoose.connection.db.databaseName !== REQUIRED_DB_NAME) {
      logger.error(`❌ CRITICAL: Connected to wrong database! Expected: ${REQUIRED_DB_NAME}, Actual: ${mongoose.connection.db.databaseName}`);
      logger.error(`❌ Only 'evalon' database is allowed.`);
      process.exit(1);
    }
    logger.info('✅ Database name validation passed');

    // 4. Perform comprehensive health check
    logger.info('🔍 Performing database health check...');
    const healthReport = await performDatabaseHealthCheck();
    
    if (healthReport.status === 'unhealthy') {
      logger.error('❌ Database health check failed:', { issues: healthReport.issues });
      process.exit(1);
    }
    
    if (healthReport.warnings.length > 0) {
      logger.warn('⚠️ Database health warnings:', { warnings: healthReport.warnings });
      
      // Auto-fix common issues
      logger.info('🔧 Attempting to auto-fix data issues...');
      const fixes = await autoFixDataIssues();
      if (fixes.length > 0) {
        logger.info('✅ Auto-fixes applied:', { fixes });
      }
    }
    
    logger.info('✅ Database health check passed');
    logger.info('📊 Database stats:', healthReport.stats);

    // 5. Test critical API endpoints
    logger.info('🔍 Testing critical models...');
    const User = require('../src/models/User');
    const Teacher = require('../src/models/Teacher');
    const Subject = require('../src/models/Subject');
    const Organization = require('../src/models/Organization');
    
    const userCount = await User.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const orgCount = await Organization.countDocuments();
    
    logger.info('📊 Model counts:', { users: userCount, teachers: teacherCount, subjects: subjectCount, organizations: orgCount });
    
    if (orgCount === 0) {
      logger.warn('⚠️ No organizations found in database');
    }
    
    if (subjectCount === 0) {
      logger.warn('⚠️ No subjects found in database');
    }

    await mongoose.disconnect();
    logger.info('✅ System validation completed successfully');
    logger.info('🎉 System is ready to start!');
    
  } catch (error) {
    logger.error('❌ System validation failed:', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateStartup();
}

module.exports = validateStartup;

