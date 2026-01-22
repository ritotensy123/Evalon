/**
 * Database Validation
 * Validates database connection, name, and health
 * SAFE MODE: Only validates, never modifies database or collections
 */

const mongoose = require('mongoose');
const { performDatabaseHealthCheck } = require('../utils/databaseHealth');
const { logger } = require('../utils/logger');

const REQUIRED_DB_NAME = 'evalon';
const PROHIBITED_DB_NAMES = ['test', 'demo', 'dev', 'evalon-app', 'evalon_test', 'evalon-dev'];

const VALIDATION_RESULTS = {
  errors: [],
  warnings: []
};

/**
 * Validate database name is exactly 'evalon'
 */
async function validateDatabaseName() {
  VALIDATION_RESULTS.errors = [];
  VALIDATION_RESULTS.warnings = [];

  logger.info('🔍 Validating database name...');

  if (mongoose.connection.readyState !== 1) {
    VALIDATION_RESULTS.errors.push('Database connection not established');
    throw new Error('Database connection not established');
  }

  const actualDbName = mongoose.connection.db.databaseName;

  if (actualDbName !== REQUIRED_DB_NAME) {
    const errorMsg = `CRITICAL: Connected to wrong database! Expected: '${REQUIRED_DB_NAME}', Actual: '${actualDbName}'`;
    VALIDATION_RESULTS.errors.push(errorMsg);
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  logger.info(`✅ Database name validation passed: ${actualDbName}`);
  return true;
}

/**
 * Validate no prohibited database names exist
 */
function validateNoFallbackDatabases() {
  logger.info('🔍 Checking for prohibited database names...');

  // Check environment variables
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    for (const prohibitedName of PROHIBITED_DB_NAMES) {
      if (mongoUri.includes(`/${prohibitedName}`) || mongoUri.includes(`/${prohibitedName}?`)) {
        const errorMsg = `MONGODB_URI contains prohibited database name: ${prohibitedName}`;
        VALIDATION_RESULTS.errors.push(errorMsg);
        logger.error(`❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }
    }
  }

  // Check MONGODB_DB_NAME if set
  if (process.env.MONGODB_DB_NAME) {
    if (PROHIBITED_DB_NAMES.includes(process.env.MONGODB_DB_NAME)) {
      const errorMsg = `MONGODB_DB_NAME is set to prohibited value: ${process.env.MONGODB_DB_NAME}`;
      VALIDATION_RESULTS.errors.push(errorMsg);
      logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  logger.info('✅ No prohibited database names found');
  return true;
}

/**
 * Validate single active connection
 */
function validateSingleConnection() {
  logger.info('🔍 Validating database connection count...');

  const connectionCount = mongoose.connections.length;

  if (connectionCount > 1) {
    const warningMsg = `Multiple database connections detected: ${connectionCount}`;
    VALIDATION_RESULTS.warnings.push(warningMsg);
    logger.warn(`⚠️  ${warningMsg}`);
  } else if (connectionCount === 0) {
    const errorMsg = 'No database connections found';
    VALIDATION_RESULTS.errors.push(errorMsg);
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  } else {
    logger.info('✅ Single database connection confirmed');
  }

  return true;
}

/**
 * Validate collection consistency
 * Checks for unexpected collections (shadow collections)
 */
async function validateCollectionConsistency() {
  logger.info('🔍 Validating collection consistency...');

  if (mongoose.connection.readyState !== 1) {
    VALIDATION_RESULTS.errors.push('Database connection not established');
    throw new Error('Database connection not established');
  }

  // Expected collections based on models
  const expectedCollections = [
    'users',
    'teachers',
    'students',
    'organizations',
    'exams',
    'examsessions',
    'examactivitylogs',
    'questions',
    'questionbanks',
    'subjects',
    'departments',
    'teacherclasses',
    'usermanagements',
    'invitations',
    'otps'
  ];

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const actualCollectionNames = collections.map(c => c.name.toLowerCase());

    // Check for unexpected collections
    const unexpectedCollections = actualCollectionNames.filter(
      name => !expectedCollections.includes(name.toLowerCase())
    );

    if (unexpectedCollections.length > 0) {
      const warningMsg = `Unexpected collections found: ${unexpectedCollections.join(', ')}`;
      VALIDATION_RESULTS.warnings.push(warningMsg);
      logger.warn(`⚠️  ${warningMsg}`);
    } else {
      logger.info('✅ All collections match expected model names');
    }

    // Check for missing expected collections (warn only, not error)
    const missingCollections = expectedCollections.filter(
      name => !actualCollectionNames.includes(name.toLowerCase())
    );

    if (missingCollections.length > 0) {
      const warningMsg = `Expected collections not found (will be created on first use): ${missingCollections.join(', ')}`;
      VALIDATION_RESULTS.warnings.push(warningMsg);
      logger.warn(`⚠️  ${warningMsg}`);
    }

    return true;
  } catch (error) {
    const errorMsg = `Failed to list collections: ${error.message}`;
    VALIDATION_RESULTS.warnings.push(errorMsg);
    logger.warn(`⚠️  ${errorMsg}`);
    return true; // Don't fail on collection listing errors
  }
}

/**
 * Validate MongoDB version
 */
async function validateMongoVersion() {
  logger.info('🔍 Validating MongoDB version...');

  try {
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    const version = serverStatus.version;

    logger.info(`✅ MongoDB version: ${version}`);

    // Check for minimum version (MongoDB 4.0+)
    const majorVersion = parseInt(version.split('.')[0], 10);
    if (majorVersion < 4) {
      const warningMsg = `MongoDB version ${version} is below recommended minimum (4.0+)`;
      VALIDATION_RESULTS.warnings.push(warningMsg);
      logger.warn(`⚠️  ${warningMsg}`);
    }

    return true;
  } catch (error) {
    const warningMsg = `Could not retrieve MongoDB version: ${error.message}`;
    VALIDATION_RESULTS.warnings.push(warningMsg);
    logger.warn(`⚠️  ${warningMsg}`);
    return true; // Don't fail on version check errors
  }
}

/**
 * Run database health check
 */
async function runHealthCheck() {
  logger.info('🔍 Running database health check...');

  try {
    const healthReport = await performDatabaseHealthCheck();

    if (healthReport.status === 'unhealthy') {
      const errorMsg = `Database health check failed: ${healthReport.issues.join(', ')}`;
      VALIDATION_RESULTS.errors.push(errorMsg);
      logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    if (healthReport.warnings && healthReport.warnings.length > 0) {
      healthReport.warnings.forEach(warning => {
        VALIDATION_RESULTS.warnings.push(warning);
        logger.warn(`⚠️  ${warning}`);
      });
    }

    logger.info('✅ Database health check passed');
    if (healthReport.stats) {
      logger.info(`📊 Database stats:`, { stats: healthReport.stats });
    }

    return true;
  } catch (error) {
    // If health check fails, it's a critical error
    const errorMsg = `Database health check failed: ${error.message}`;
    VALIDATION_RESULTS.errors.push(errorMsg);
    logger.error(`❌ ${errorMsg}`);
    throw error;
  }
}

/**
 * Main database validation function
 * Note: Database must be connected before calling this
 */
async function validateDatabase() {
  VALIDATION_RESULTS.errors = [];
  VALIDATION_RESULTS.warnings = [];

  logger.info('🔍 Starting database validation...');

  // Validate connection state
  if (mongoose.connection.readyState !== 1) {
    const errorMsg = 'Database connection not established';
    VALIDATION_RESULTS.errors.push(errorMsg);
    throw new Error(errorMsg);
  }

  // Run all validations
  validateNoFallbackDatabases();
  validateSingleConnection();
  await validateDatabaseName();
  await validateCollectionConsistency();
  await validateMongoVersion();
  await runHealthCheck();

  // Print summary
  if (VALIDATION_RESULTS.errors.length > 0) {
    logger.error('❌ Database validation failed');
    VALIDATION_RESULTS.errors.forEach(error => logger.error(`   - ${error}`));
    throw new Error(`Database validation failed: ${VALIDATION_RESULTS.errors.join(', ')}`);
  }

  if (VALIDATION_RESULTS.warnings.length > 0) {
    logger.warn('⚠️  Database validation warnings');
    VALIDATION_RESULTS.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  } else {
    logger.info('✅ Database validation completed successfully');
  }

  return {
    success: true,
    errors: VALIDATION_RESULTS.errors,
    warnings: VALIDATION_RESULTS.warnings
  };
}

module.exports = {
  validateDatabase,
  validateDatabaseName,
  validateNoFallbackDatabases,
  validateSingleConnection,
  validateCollectionConsistency,
  validateMongoVersion,
  runHealthCheck
};


