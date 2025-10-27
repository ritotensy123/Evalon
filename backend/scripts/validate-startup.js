#!/usr/bin/env node

/**
 * Startup validation script
 * Run this script to validate the system before starting the server
 * Usage: node scripts/validate-startup.js
 */

const mongoose = require('mongoose');
const { performDatabaseHealthCheck, autoFixDataIssues } = require('../src/utils/databaseHealth');
require('dotenv').config();

async function validateStartup() {
  console.log('🚀 Starting system validation...');
  
  try {
    // 1. Check environment variables
    console.log('🔍 Checking environment variables...');
    const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingEnvVars);
      process.exit(1);
    }
    console.log('✅ Environment variables validated');

    // 2. Test database connection
    console.log('🔍 Testing database connection...');
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'evalon';
    
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ Database connection successful');
    console.log(`📁 Connected to database: ${mongoose.connection.db.databaseName}`);

    // 3. Validate database name
    if (mongoose.connection.db.databaseName !== dbName) {
      console.error(`❌ CRITICAL: Connected to wrong database! Expected: ${dbName}, Actual: ${mongoose.connection.db.databaseName}`);
      process.exit(1);
    }
    console.log('✅ Database name validation passed');

    // 4. Perform comprehensive health check
    console.log('🔍 Performing database health check...');
    const healthReport = await performDatabaseHealthCheck();
    
    if (healthReport.status === 'unhealthy') {
      console.error('❌ Database health check failed:', healthReport.issues);
      process.exit(1);
    }
    
    if (healthReport.warnings.length > 0) {
      console.warn('⚠️ Database health warnings:', healthReport.warnings);
      
      // Auto-fix common issues
      console.log('🔧 Attempting to auto-fix data issues...');
      const fixes = await autoFixDataIssues();
      if (fixes.length > 0) {
        console.log('✅ Auto-fixes applied:', fixes);
      }
    }
    
    console.log('✅ Database health check passed');
    console.log('📊 Database stats:', healthReport.stats);

    // 5. Test critical API endpoints
    console.log('🔍 Testing critical models...');
    const User = require('../src/models/User');
    const Teacher = require('../src/models/Teacher');
    const Subject = require('../src/models/Subject');
    const Organization = require('../src/models/Organization');
    
    const userCount = await User.countDocuments();
    const teacherCount = await Teacher.countDocuments();
    const subjectCount = await Subject.countDocuments();
    const orgCount = await Organization.countDocuments();
    
    console.log('📊 Model counts:', { users: userCount, teachers: teacherCount, subjects: subjectCount, organizations: orgCount });
    
    if (orgCount === 0) {
      console.warn('⚠️ No organizations found in database');
    }
    
    if (subjectCount === 0) {
      console.warn('⚠️ No subjects found in database');
    }

    await mongoose.disconnect();
    console.log('✅ System validation completed successfully');
    console.log('🎉 System is ready to start!');
    
  } catch (error) {
    console.error('❌ System validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateStartup();
}

module.exports = validateStartup;

