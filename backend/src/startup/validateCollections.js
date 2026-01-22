/**
 * Collection and Query Validation
 * Validates collection existence and naming consistency
 * SAFE MODE: Only validates, never modifies or deletes collections
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const VALIDATION_RESULTS = {
  errors: [],
  warnings: []
};

/**
 * Expected collections based on models
 */
const EXPECTED_COLLECTIONS = [
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

/**
 * Critical collections that should have data
 */
const CRITICAL_COLLECTIONS = [
  'organizations' // At least one organization should exist
];

/**
 * Validate required collections exist
 */
async function validateRequiredCollections() {
  logger.info('🔍 Validating required collections...');

  if (mongoose.connection.readyState !== 1) {
    VALIDATION_RESULTS.errors.push('Database connection not established');
    throw new Error('Database connection not established');
  }

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const actualCollectionNames = collections.map(c => c.name.toLowerCase());

    // Check for missing critical collections
    const missingCritical = CRITICAL_COLLECTIONS.filter(
      name => !actualCollectionNames.includes(name.toLowerCase())
    );

    if (missingCritical.length > 0) {
      const warningMsg = `Critical collections not found: ${missingCritical.join(', ')}`;
      VALIDATION_RESULTS.warnings.push(warningMsg);
      logger.warn(`⚠️  ${warningMsg}`);
    } else {
      logger.info('✅ All critical collections exist');
    }

    return true;
  } catch (error) {
    const errorMsg = `Failed to validate collections: ${error.message}`;
    VALIDATION_RESULTS.warnings.push(errorMsg);
    logger.warn(`⚠️  ${errorMsg}`);
    return true; // Don't fail on collection validation errors
  }
}

/**
 * Validate collection names match expected model names
 */
async function validateCollectionNames() {
  logger.info('🔍 Validating collection names match model names...');

  if (mongoose.connection.readyState !== 1) {
    VALIDATION_RESULTS.errors.push('Database connection not established');
    throw new Error('Database connection not established');
  }

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const actualCollectionNames = collections.map(c => c.name.toLowerCase());

    // Check each registered model has a corresponding collection name
    const registeredModels = Object.keys(mongoose.models);
    
    for (const modelName of registeredModels) {
      const model = mongoose.models[modelName];
      const collectionName = model.collection.name.toLowerCase();
      
      // Check if collection exists
      if (!actualCollectionNames.includes(collectionName)) {
        const warningMsg = `Model ${modelName} expects collection '${collectionName}' but it doesn't exist (will be created on first use)`;
        VALIDATION_RESULTS.warnings.push(warningMsg);
        logger.warn(`⚠️  ${warningMsg}`);
      }
    }

    logger.info('✅ Collection names validation completed');
    return true;
  } catch (error) {
    const errorMsg = `Failed to validate collection names: ${error.message}`;
    VALIDATION_RESULTS.warnings.push(errorMsg);
    logger.warn(`⚠️  ${errorMsg}`);
    return true; // Don't fail on collection name validation errors
  }
}

/**
 * Warn for empty critical collections
 */
async function validateCriticalCollectionsNotEmpty() {
  logger.info('🔍 Checking critical collections are not empty...');

  if (mongoose.connection.readyState !== 1) {
    return true; // Skip if not connected
  }

  try {
    for (const collectionName of CRITICAL_COLLECTIONS) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();

        if (count === 0) {
          const warningMsg = `Critical collection '${collectionName}' is empty`;
          VALIDATION_RESULTS.warnings.push(warningMsg);
          logger.warn(`⚠️  ${warningMsg}`);
        } else {
          logger.info(`✅ Collection '${collectionName}' has ${count} document(s)`);
        }
      } catch (error) {
        // Collection might not exist yet, that's okay
        const warningMsg = `Could not check collection '${collectionName}': ${error.message}`;
        VALIDATION_RESULTS.warnings.push(warningMsg);
        logger.warn(`⚠️  ${warningMsg}`);
      }
    }

    return true;
  } catch (error) {
    const warningMsg = `Failed to check collection counts: ${error.message}`;
    VALIDATION_RESULTS.warnings.push(warningMsg);
    logger.warn(`⚠️  ${warningMsg}`);
    return true; // Don't fail on collection count errors
  }
}

/**
 * Main collection validation function
 */
async function validateCollections() {
  VALIDATION_RESULTS.errors = [];
  VALIDATION_RESULTS.warnings = [];

  logger.info('🔍 Starting collection validation...');

  // Run all validations
  await validateRequiredCollections();
  await validateCollectionNames();
  await validateCriticalCollectionsNotEmpty();

  // Print summary
  if (VALIDATION_RESULTS.errors.length > 0) {
    logger.error('❌ Collection validation failed');
    VALIDATION_RESULTS.errors.forEach(error => logger.error(`   - ${error}`));
    throw new Error(`Collection validation failed: ${VALIDATION_RESULTS.errors.join(', ')}`);
  }

  if (VALIDATION_RESULTS.warnings.length > 0) {
    logger.warn('⚠️  Collection validation warnings');
    VALIDATION_RESULTS.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  } else {
    logger.info('✅ Collection validation completed successfully');
  }

  return {
    success: true,
    errors: VALIDATION_RESULTS.errors,
    warnings: VALIDATION_RESULTS.warnings
  };
}

module.exports = {
  validateCollections,
  validateRequiredCollections,
  validateCollectionNames,
  validateCriticalCollectionsNotEmpty
};


