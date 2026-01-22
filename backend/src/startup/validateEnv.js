/**
 * Environment Variable Validation
 * Validates all required and optional environment variables
 * SAFE MODE: Only validates, never modifies environment
 */

require('dotenv').config();
const { logger } = require('../utils/logger');

const VALIDATION_RESULTS = {
  errors: [],
  warnings: []
};

/**
 * Required environment variables by priority
 */
const REQUIRED_ENV_VARS = {
  CRITICAL: [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS'
  ],
  HIGH: [
    'EMAIL_USER',
    'EMAIL_PASS',
    'NODE_ENV',
    'PORT',
    'REALTIME_PORT'
  ],
  MEDIUM: [
    'MONGODB_DB_NAME',
    'JWT_EXPIRES_IN',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS'
  ],
  OPTIONAL: [
    'AI_URL',
    'REALTIME_URL',
    'API_BASE_URL',
    'FIREBASE_SERVICE_ACCOUNT_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
};

/**
 * Validate MongoDB URI format
 */
function validateMongoDBURI() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    VALIDATION_RESULTS.errors.push('MONGODB_URI is required');
    return false;
  }

  // Basic URI format validation
  const uriPattern = /^mongodb(\+srv)?:\/\//;
  if (!uriPattern.test(mongoUri)) {
    VALIDATION_RESULTS.errors.push('MONGODB_URI must be a valid MongoDB connection string');
    return false;
  }

  // Check for prohibited database names in URI
  const prohibitedDbs = ['test', 'demo', 'dev', 'evalon-app', 'evalon_test'];
  for (const dbName of prohibitedDbs) {
    if (mongoUri.includes(`/${dbName}`) || mongoUri.includes(`/${dbName}?`)) {
      VALIDATION_RESULTS.errors.push(`MONGODB_URI contains prohibited database name: ${dbName}`);
      return false;
    }
  }

  return true;
}

/**
 * Validate JWT Secret
 */
function validateJWTSecret() {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    VALIDATION_RESULTS.errors.push('JWT_SECRET is required');
    return false;
  }

  if (jwtSecret.length < 32) {
    VALIDATION_RESULTS.errors.push('JWT_SECRET must be at least 32 characters long');
    return false;
  }

  return true;
}

/**
 * Validate Session Secret
 */
function validateSessionSecret() {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    VALIDATION_RESULTS.errors.push('SESSION_SECRET is required');
    return false;
  }

  if (sessionSecret.length < 32) {
    VALIDATION_RESULTS.errors.push('SESSION_SECRET must be at least 32 characters long');
    return false;
  }

  return true;
}

/**
 * Validate URL format
 */
function validateURL(url, varName) {
  if (!url) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (error) {
    VALIDATION_RESULTS.errors.push(`${varName} must be a valid URL`);
    return false;
  }
}

/**
 * Validate port number
 */
function validatePort(port, varName) {
  if (!port) {
    return false;
  }

  const portNum = parseInt(port, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    VALIDATION_RESULTS.errors.push(`${varName} must be a valid port number (1-65535)`);
    return false;
  }

  return true;
}

/**
 * Validate NODE_ENV
 */
function validateNodeEnv() {
  const nodeEnv = process.env.NODE_ENV;
  
  if (!nodeEnv) {
    VALIDATION_RESULTS.warnings.push('NODE_ENV not set, defaulting to development');
    return true;
  }

  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    VALIDATION_RESULTS.warnings.push(`NODE_ENV should be one of: ${validEnvs.join(', ')}`);
  }

  return true;
}

/**
 * Validate database name (must be 'evalon')
 */
function validateDatabaseName() {
  const dbName = process.env.MONGODB_DB_NAME;
  
  if (dbName && dbName !== 'evalon') {
    VALIDATION_RESULTS.errors.push(`MONGODB_DB_NAME must be 'evalon' (found: ${dbName})`);
    return false;
  }

  return true;
}

/**
 * Main validation function
 */
function validateRequiredEnvVars() {
  VALIDATION_RESULTS.errors = [];
  VALIDATION_RESULTS.warnings = [];

  logger.info('🔍 Validating environment variables...');

  // Validate CRITICAL variables (fail fast)
  for (const varName of REQUIRED_ENV_VARS.CRITICAL) {
    if (!process.env[varName]) {
      VALIDATION_RESULTS.errors.push(`${varName} is required (CRITICAL)`);
    }
  }

  // Validate specific CRITICAL variables with format checks
  validateMongoDBURI();
  validateJWTSecret();
  validateSessionSecret();
  
  if (!validateURL(process.env.FRONTEND_URL, 'FRONTEND_URL')) {
    VALIDATION_RESULTS.errors.push('FRONTEND_URL is required and must be a valid URL');
  }

  if (!process.env.ALLOWED_ORIGINS) {
    VALIDATION_RESULTS.errors.push('ALLOWED_ORIGINS is required');
  } else {
    // Validate ALLOWED_ORIGINS format
    const origins = process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
    for (const origin of origins) {
      if (!validateURL(origin, 'ALLOWED_ORIGINS')) {
        VALIDATION_RESULTS.errors.push(`Invalid URL in ALLOWED_ORIGINS: ${origin}`);
      }
    }
  }

  // Validate database name
  validateDatabaseName();

  // Validate HIGH priority variables (warn if missing)
  for (const varName of REQUIRED_ENV_VARS.HIGH) {
    if (!process.env[varName]) {
      VALIDATION_RESULTS.warnings.push(`${varName} is recommended but not set`);
    }
  }

  // Validate HIGH priority variables with format checks
  validateNodeEnv();
  validatePort(process.env.PORT, 'PORT');
  validatePort(process.env.REALTIME_PORT, 'REALTIME_PORT');

  // Validate email configuration
  if (process.env.EMAIL_USER && !process.env.EMAIL_PASS) {
    VALIDATION_RESULTS.warnings.push('EMAIL_USER is set but EMAIL_PASS is missing');
  }
  if (process.env.EMAIL_PASS && !process.env.EMAIL_USER) {
    VALIDATION_RESULTS.warnings.push('EMAIL_PASS is set but EMAIL_USER is missing');
  }

  // Validate optional variables if set
  if (process.env.AI_URL && !validateURL(process.env.AI_URL, 'AI_URL')) {
    VALIDATION_RESULTS.warnings.push('AI_URL is set but invalid');
  }

  if (process.env.REALTIME_URL && !validateURL(process.env.REALTIME_URL, 'REALTIME_URL')) {
    VALIDATION_RESULTS.warnings.push('REALTIME_URL is set but invalid');
  }

  // Print results
  if (VALIDATION_RESULTS.errors.length > 0) {
    logger.error('❌ Environment variable validation failed');
    VALIDATION_RESULTS.errors.forEach(error => logger.error(`   - ${error}`));
    throw new Error(`Environment validation failed: ${VALIDATION_RESULTS.errors.join(', ')}`);
  }

  if (VALIDATION_RESULTS.warnings.length > 0) {
    logger.warn('⚠️  Environment variable warnings');
    VALIDATION_RESULTS.warnings.forEach(warning => logger.warn(`   - ${warning}`));
  } else {
    logger.info('✅ All environment variables validated');
  }

  return {
    success: true,
    errors: VALIDATION_RESULTS.errors,
    warnings: VALIDATION_RESULTS.warnings
  };
}

module.exports = {
  validateRequiredEnvVars,
  validateMongoDBURI,
  validateJWTSecret,
  validateDatabaseName
};


