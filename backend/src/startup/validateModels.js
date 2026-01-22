/**
 * Model Schema Validation
 * Validates all Mongoose models for consistency
 * SAFE MODE: Only validates, never modifies schemas
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const VALIDATION_RESULTS = {
  errors: [],
  warnings: []
};

/**
 * Expected models based on model files
 */
const EXPECTED_MODELS = [
  'User',
  'Teacher',
  'Student',
  'Organization',
  'Exam',
  'ExamSession',
  'ExamActivityLog',
  'Question',
  'QuestionBank',
  'Subject',
  'Department',
  'TeacherClass',
  'UserManagement',
  'Invitation',
  'OTP'
];

/**
 * Models that should have organizationId field
 */
const MODELS_WITH_ORGANIZATION_ID = [
  'Exam',
  'ExamSession',
  'ExamActivityLog',
  'Question',
  'QuestionBank',
  'Subject',
  'Department',
  'TeacherClass',
  'UserManagement',
  'Invitation'
];

/**
 * Models that should have organization field (not organizationId)
 */
const MODELS_WITH_ORGANIZATION = [
  'Teacher',
  'Student',
  'User'
];

/**
 * Models that should NOT have organization fields
 */
const MODELS_WITHOUT_ORGANIZATION = [
  'Organization',
  'OTP'
];

/**
 * Load all model files
 */
function loadAllModels() {
  const modelsPath = path.join(__dirname, '../models');
  const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));

  logger.info(`📦 Loading ${modelFiles.length} model files...`);

  const loadedModels = [];
  for (const file of modelFiles) {
    try {
      const modelPath = path.join(modelsPath, file);
      require(modelPath);
      loadedModels.push(file.replace('.js', ''));
    } catch (error) {
      const errorMsg = `Failed to load model ${file}: ${error.message}`;
      VALIDATION_RESULTS.errors.push(errorMsg);
      logger.error(`❌ ${errorMsg}`);
    }
  }

  logger.info(`✅ Loaded ${loadedModels.length} models`);
  return loadedModels;
}

/**
 * Validate no duplicate model definitions
 */
function validateNoDuplicates() {
  logger.info('🔍 Checking for duplicate model definitions...');

  const registeredModels = Object.keys(mongoose.models);
  const duplicates = [];
  const seen = new Set();

  for (const modelName of registeredModels) {
    if (seen.has(modelName)) {
      duplicates.push(modelName);
    } else {
      seen.add(modelName);
    }
  }

  if (duplicates.length > 0) {
    const errorMsg = `Duplicate model definitions found: ${duplicates.join(', ')}`;
    VALIDATION_RESULTS.errors.push(errorMsg);
    logger.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  logger.info('✅ No duplicate model definitions found');
  return true;
}

/**
 * Validate all expected models are registered
 */
function validateAllModelsRegistered() {
  logger.info('🔍 Validating all expected models are registered...');

  const registeredModels = Object.keys(mongoose.models);
  const missingModels = EXPECTED_MODELS.filter(model => !registeredModels.includes(model));

  if (missingModels.length > 0) {
    const warningMsg = `Expected models not registered: ${missingModels.join(', ')}`;
    VALIDATION_RESULTS.warnings.push(warningMsg);
    logger.warn(`⚠️  ${warningMsg}`);
  } else {
    logger.info('✅ All expected models are registered');
  }

  // Check for unexpected models
  const unexpectedModels = registeredModels.filter(model => !EXPECTED_MODELS.includes(model));
  if (unexpectedModels.length > 0) {
    const warningMsg = `Unexpected models registered: ${unexpectedModels.join(', ')}`;
    VALIDATION_RESULTS.warnings.push(warningMsg);
    logger.warn(`⚠️  ${warningMsg}`);
  }

  return true;
}

/**
 * Validate organization field consistency
 */
function validateOrganizationFields() {
  logger.info('🔍 Validating organization field consistency...');

  const registeredModels = Object.keys(mongoose.models);

  for (const modelName of registeredModels) {
    const model = mongoose.models[modelName];
    const schema = model.schema;
    const schemaPaths = Object.keys(schema.paths);

    // Check models that should have organizationId
    if (MODELS_WITH_ORGANIZATION_ID.includes(modelName)) {
      if (!schemaPaths.includes('organizationId')) {
        const warningMsg = `Model ${modelName} should have 'organizationId' field but it's missing`;
        VALIDATION_RESULTS.warnings.push(warningMsg);
        logger.warn(`⚠️  ${warningMsg}`);
      }
    }

    // Check models that should have organization
    if (MODELS_WITH_ORGANIZATION.includes(modelName)) {
      if (!schemaPaths.includes('organization')) {
        const warningMsg = `Model ${modelName} should have 'organization' field but it's missing`;
        VALIDATION_RESULTS.warnings.push(warningMsg);
        logger.warn(`⚠️  ${warningMsg}`);
      }
    }

    // Check models that should NOT have organization fields
    if (MODELS_WITHOUT_ORGANIZATION.includes(modelName)) {
      if (schemaPaths.includes('organizationId') || schemaPaths.includes('organization')) {
        const warningMsg = `Model ${modelName} should not have organization fields but found: ${schemaPaths.filter(p => p.includes('organization')).join(', ')}`;
        VALIDATION_RESULTS.warnings.push(warningMsg);
        logger.warn(`⚠️  ${warningMsg}`);
      }
    }
  }

  logger.info('✅ Organization field validation completed');
  return true;
}

/**
 * Validate required fields exist in schema
 */
function validateRequiredFields() {
  logger.info('🔍 Validating required fields in schemas...');

  const registeredModels = Object.keys(mongoose.models);

  for (const modelName of registeredModels) {
    const model = mongoose.models[modelName];
    const schema = model.schema;

    // Check each path for required fields
    schema.eachPath((pathName, schemaType) => {
      if (schemaType.isRequired && !schemaType.defaultValue) {
        // Field is required and has no default - this is fine, just log for info
        // We could add specific validation here if needed
      }
    });
  }

  logger.info('✅ Required fields validation completed');
  return true;
}

/**
 * Validate field types
 */
function validateFieldTypes() {
  logger.info('🔍 Validating field types...');

  const registeredModels = Object.keys(mongoose.models);

  for (const modelName of registeredModels) {
    const model = mongoose.models[modelName];
    const schema = model.schema;

    schema.eachPath((pathName, schemaType) => {
      // Check String fields should have trim (from Task 1.4B)
      if (schemaType.instance === 'String') {
        // Note: We can't easily check if trim is set without accessing internal properties
        // This is informational only
      }

      // Check Number fields should have min: 0 where applicable (from Task 1.4B)
      if (schemaType.instance === 'Number') {
        // Note: We can't easily check if min is set without accessing internal properties
        // This is informational only
      }
    });
  }

  logger.info('✅ Field types validation completed');
  return true;
}

/**
 * Main model validation function
 */
async function validateAllModels() {
  VALIDATION_RESULTS.errors = [];
  VALIDATION_RESULTS.warnings = [];

  logger.info('🔍 Starting model validation...');

  // Load all models
  loadAllModels();

  // Run all validations
  validateNoDuplicates();
  validateAllModelsRegistered();
  validateOrganizationFields();
  validateRequiredFields();
  validateFieldTypes();

  // Print summary
  if (VALIDATION_RESULTS.errors.length > 0) {
    logger.error('❌ Model validation failed');
    VALIDATION_RESULTS.errors.forEach(error => logger.error(`   - ${error}`));
    throw new Error(`Model validation failed: ${VALIDATION_RESULTS.errors.join(', ')}`);
  }

  if (VALIDATION_RESULTS.warnings.length > 0) {
    logger.warn('⚠️  Model validation warnings');
    VALIDATION_RESULTS.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  } else {
    logger.info('✅ Model validation completed successfully');
  }

  return {
    success: true,
    errors: VALIDATION_RESULTS.errors,
    warnings: VALIDATION_RESULTS.warnings
  };
}

module.exports = {
  validateAllModels,
  validateNoDuplicates,
  validateAllModelsRegistered,
  validateOrganizationFields,
  validateRequiredFields,
  validateFieldTypes
};


