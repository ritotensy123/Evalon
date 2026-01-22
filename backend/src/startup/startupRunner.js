/**
 * Startup Validation Runner
 * Orchestrates all validation checks in SAFE MODE
 * Runs before server starts to ensure system integrity
 */

const validateEnv = require('./validateEnv');
const validateDatabase = require('./validateDatabase');
const validateModels = require('./validateModels');
const validateCollections = require('./validateCollections');
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const { logger } = require('../utils/logger');

const VALIDATION_RESULTS = {
  passed: [],
  warnings: [],
  errors: []
};

/**
 * Run startup validation
 * This function must be called BEFORE the server starts
 */
async function runStartupValidation() {
  logger.info('\n' + '='.repeat(60));
  logger.info('🚀 STARTUP VALIDATION SYSTEM');
  logger.info('='.repeat(60) + '\n');

  try {
    // Phase 1: Environment Variables (before any connections)
    logger.info('📋 Phase 1: Validating environment variables...');
    logger.info('-'.repeat(60));
    try {
      const envResult = validateEnv.validateRequiredEnvVars();
      VALIDATION_RESULTS.passed.push('Environment variables validated');
      if (envResult.warnings && envResult.warnings.length > 0) {
        VALIDATION_RESULTS.warnings.push(...envResult.warnings.map(w => `ENV: ${w}`));
      }
    } catch (error) {
      VALIDATION_RESULTS.errors.push(`Environment validation failed: ${error.message}`);
      throw error; // Fail fast on critical errors
    }
    logger.info('');

    // Phase 2: Database Connection
    logger.info('📋 Phase 2: Connecting to database...');
    logger.info('-'.repeat(60));
    try {
      // Connect to database (this will also validate database name)
      await connectDB();
      VALIDATION_RESULTS.passed.push('Database connection established');
    } catch (error) {
      VALIDATION_RESULTS.errors.push(`Database connection failed: ${error.message}`);
      throw error; // Fail fast on connection errors
    }
    logger.info('');

    // Phase 3: Database Validation
    logger.info('📋 Phase 3: Validating database configuration...');
    logger.info('-'.repeat(60));
    try {
      const dbResult = await validateDatabase.validateDatabase();
      VALIDATION_RESULTS.passed.push('Database validation completed');
      if (dbResult.warnings && dbResult.warnings.length > 0) {
        VALIDATION_RESULTS.warnings.push(...dbResult.warnings.map(w => `DB: ${w}`));
      }
    } catch (error) {
      VALIDATION_RESULTS.errors.push(`Database validation failed: ${error.message}`);
      throw error; // Fail fast on critical database errors
    }
    logger.info('');

    // Phase 4: Model Validation
    logger.info('📋 Phase 4: Validating Mongoose models...');
    logger.info('-'.repeat(60));
    try {
      const modelResult = await validateModels.validateAllModels();
      VALIDATION_RESULTS.passed.push('Model validation completed');
      if (modelResult.warnings && modelResult.warnings.length > 0) {
        VALIDATION_RESULTS.warnings.push(...modelResult.warnings.map(w => `MODEL: ${w}`));
      }
    } catch (error) {
      VALIDATION_RESULTS.errors.push(`Model validation failed: ${error.message}`);
      throw error; // Fail fast on critical model errors
    }
    logger.info('');

    // Phase 5: Collection Validation
    logger.info('📋 Phase 5: Validating collections...');
    logger.info('-'.repeat(60));
    try {
      const collectionResult = await validateCollections.validateCollections();
      VALIDATION_RESULTS.passed.push('Collection validation completed');
      if (collectionResult.warnings && collectionResult.warnings.length > 0) {
        VALIDATION_RESULTS.warnings.push(...collectionResult.warnings.map(w => `COLLECTION: ${w}`));
      }
    } catch (error) {
      VALIDATION_RESULTS.errors.push(`Collection validation failed: ${error.message}`);
      throw error; // Fail fast on critical collection errors
    }
    logger.info('');

    // Print summary
    printValidationSummary();

    // Fail if critical errors occurred
    if (VALIDATION_RESULTS.errors.length > 0) {
      logger.error('\n❌ STARTUP VALIDATION FAILED');
      logger.error('Server startup aborted due to critical validation errors.\n');
      throw new Error(`Startup validation failed: ${VALIDATION_RESULTS.errors.length} critical error(s)`);
    }

    logger.info('✅ STARTUP VALIDATION COMPLETED SUCCESSFULLY\n');
    return {
      success: true,
      passed: VALIDATION_RESULTS.passed.length,
      warnings: VALIDATION_RESULTS.warnings.length,
      errors: VALIDATION_RESULTS.errors.length
    };

  } catch (error) {
    logger.error('\n❌ STARTUP VALIDATION FAILED');
    logger.error(`Error: ${error.message}\n`, { error: error.message, stack: error.stack });
    
    // Print summary even on failure
    printValidationSummary();
    
    throw error; // Re-throw to prevent server startup
  }
}

/**
 * Print validation summary
 */
function printValidationSummary() {
  logger.info('\n' + '='.repeat(60));
  logger.info('VALIDATION SUMMARY');
  logger.info('='.repeat(60));
  logger.info(`✅ Passed: ${VALIDATION_RESULTS.passed.length}`);
  logger.info(`⚠️  Warnings: ${VALIDATION_RESULTS.warnings.length}`);
  logger.info(`❌ Errors: ${VALIDATION_RESULTS.errors.length}`);
  
  if (VALIDATION_RESULTS.passed.length > 0) {
    logger.info('\n✅ Passed Checks:');
    VALIDATION_RESULTS.passed.forEach(check => logger.info(`   - ${check}`));
  }
  
  if (VALIDATION_RESULTS.warnings.length > 0) {
    logger.warn('\n⚠️  Warnings:');
    VALIDATION_RESULTS.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  }
  
  if (VALIDATION_RESULTS.errors.length > 0) {
    logger.error('\n❌ Errors:');
    VALIDATION_RESULTS.errors.forEach(error => logger.error(`   - ${error}`));
  }
  
  logger.info('='.repeat(60) + '\n');
}

module.exports = {
  runStartupValidation
};


