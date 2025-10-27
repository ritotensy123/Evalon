const mongoose = require('mongoose');
const { performDatabaseHealthCheck, autoFixDataIssues } = require('../utils/databaseHealth');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ritotensy:redriders@evalon.u8jqfbo.mongodb.net/?retryWrites=true&w=majority&appName=Evalon';
    const dbName = process.env.MONGODB_DB_NAME || 'evalon';
    
    console.log('🔗 Connecting to MongoDB with URI:', mongoUri);
    console.log('📁 Database name:', dbName);
    
    const conn = await mongoose.connect(mongoUri, {
      dbName: dbName
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Connected to database: ${conn.connection.db.databaseName}`);
    
    // Validate database connection
    await validateDatabaseConnection(conn);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    throw error; // Don't exit, let the caller handle it
  }
};

/**
 * Validate database connection and perform health checks
 */
const validateDatabaseConnection = async (conn) => {
  try {
    console.log('🔍 Validating database connection...');
    
    // Check if we're connected to the expected database
    const expectedDbName = process.env.MONGODB_DB_NAME || 'evalon';
    const actualDbName = conn.connection.db.databaseName;
    
    if (actualDbName !== expectedDbName) {
      console.error(`❌ CRITICAL: Connected to wrong database! Expected: ${expectedDbName}, Actual: ${actualDbName}`);
      throw new Error(`Database mismatch: Expected ${expectedDbName}, got ${actualDbName}`);
    }
    
    console.log('✅ Database name validation passed');
    
    // Perform comprehensive health check
    const healthReport = await performDatabaseHealthCheck();
    
    if (healthReport.status === 'unhealthy') {
      console.error('❌ Database health check failed:', healthReport.issues);
      throw new Error(`Database health check failed: ${healthReport.issues.join(', ')}`);
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
    
    console.log('✅ Database connection validation completed successfully');
    console.log('📊 Database stats:', healthReport.stats);
    
  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;



