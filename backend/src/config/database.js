const mongoose = require('mongoose');
const { performDatabaseHealthCheck, autoFixDataIssues } = require('../utils/databaseHealth');
const { logger } = require('../utils/logger');
require('dotenv').config();

const connectDB = async () => {
  try {
    // SECURITY: MongoDB URI must be provided via environment variable
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required. Please set it in your .env file.');
    }
    
    // ENFORCED: Database name is ALWAYS 'evalon' - no configuration allowed
    const REQUIRED_DB_NAME = 'evalon';
    
    // SECURITY: Never log the full MongoDB URI as it may contain credentials
    logger.info('🔗 Connecting to MongoDB...', { database: REQUIRED_DB_NAME });
    
    // Connection pool configuration based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const poolSize = parseInt(process.env.MONGODB_POOL_SIZE) || (isProduction ? 10 : 5);
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE) || (isProduction ? 20 : 10);
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE) || (isProduction ? 5 : 2);
    
    const connectionOptions = {
      dbName: REQUIRED_DB_NAME,
      // Connection pool settings
      maxPoolSize,
      minPoolSize,
      // Connection timeout
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
      // Heartbeat
      heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY) || 10000,
      // Retry settings
      retryWrites: true,
      retryReads: true,
      // Buffer settings (removed - not supported in newer MongoDB driver)
      // bufferMaxEntries: 0, // Disable mongoose buffering
      // bufferCommands: false,
    };
    
    const conn = await mongoose.connect(mongoUri, connectionOptions);

    logger.info(`MongoDB Connected`, { 
      host: conn.connection.host,
      database: conn.connection.db.databaseName 
    });
    
    // Validate database connection
    await validateDatabaseConnection(conn);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown (note: this is a fallback, main graceful shutdown is in gracefulShutdown.js)
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('Error connecting to MongoDB', { error: error.message, stack: error.stack });
    throw error; // Don't exit, let the caller handle it
  }
};

/**
 * Validate database connection and perform health checks
 */
const validateDatabaseConnection = async (conn) => {
  try {
    logger.info('🔍 Validating database connection...');
    
    // ENFORCED: Database MUST be 'evalon' - no exceptions
    const REQUIRED_DB_NAME = 'evalon';
    const actualDbName = conn.connection.db.databaseName;
    
    if (actualDbName !== REQUIRED_DB_NAME) {
      logger.error(`❌ CRITICAL: Connected to wrong database! Expected: ${REQUIRED_DB_NAME}, Actual: ${actualDbName}`);
      throw new Error(`Database mismatch: Expected ${REQUIRED_DB_NAME}, got ${actualDbName}. Only 'evalon' database is allowed.`);
    }
    
    logger.info('✅ Database name validation passed', { database: actualDbName });
    
    // Perform comprehensive health check
    const healthReport = await performDatabaseHealthCheck();
    
    if (healthReport.status === 'unhealthy') {
      logger.error('❌ Database health check failed', { issues: healthReport.issues });
      throw new Error(`Database health check failed: ${healthReport.issues.join(', ')}`);
    }
    
    if (healthReport.warnings.length > 0) {
      logger.warn('⚠️ Database health warnings', { warnings: healthReport.warnings });
      
      // Auto-fix common issues
      logger.info('🔧 Attempting to auto-fix data issues...');
      const fixes = await autoFixDataIssues();
      if (fixes.length > 0) {
        logger.info('✅ Auto-fixes applied', { fixes });
      }
    }
    
    logger.info('✅ Database connection validation completed successfully', { stats: healthReport.stats });
    
  } catch (error) {
    logger.error('❌ Database validation failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

module.exports = connectDB;



