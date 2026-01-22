/**
 * Environment Variable Validator
 * 
 * Validates all required environment variables at startup.
 * Throws errors for missing critical variables.
 */

const { ports, validatePorts } = require('../config/ports');
const { logger } = require('./logger');

/**
 * Required environment variables by environment
 */
const REQUIRED_VARS = {
  production: [
    'MONGODB_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'FRONTEND_URL',
    'ALLOWED_ORIGINS',
  ],
  development: [
    'MONGODB_URI',
    'JWT_SECRET',
  ],
  test: [
    'MONGODB_URI',
    'JWT_SECRET',
  ],
};

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_VARS = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  JWT_EXPIRES_IN: '7d',
  PORT: '5001',
  REALTIME_PORT: '5004',
  AI_SERVICE_PORT: '5002',
};

/**
 * Validate environment variables
 */
const validateEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  const required = REQUIRED_VARS[env] || REQUIRED_VARS.development;
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`${varName} not set, using default: ${defaultValue}`);
    }
  }

  // Validate JWT_SECRET strength in production
  if (env === 'production' && process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters in production. ' +
        'Generate with: openssl rand -base64 64'
      );
    }
  }

  // Validate ports
  try {
    validatePorts();
  } catch (error) {
    throw new Error(`Port validation failed: ${error.message}`);
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI) {
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
        !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }
  }

  // Handle missing variables
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    
    if (env === 'production') {
      throw new Error(`FATAL: ${errorMsg}`);
    } else {
      logger.warn('[ENV_VALIDATOR] Environment variable warning', { warning: errorMsg });
      logger.warn('[ENV_VALIDATOR] Using development fallbacks. Set these for production.');
    }
  }

  // Log warnings
  if (warnings.length > 0 && env !== 'production') {
    warnings.forEach(warning => logger.warn('[ENV_VALIDATOR] Configuration warning', { warning }));
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    environment: env,
  };
};

/**
 * Get environment configuration summary (without secrets)
 */
const getEnvSummary = () => {
  const summary = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    ports: {
      API: ports.API,
      REALTIME: ports.REALTIME,
      AI_SERVICE: ports.AI_SERVICE,
      FRONTEND: ports.FRONTEND,
    },
    database: {
      connected: !!process.env.MONGODB_URI,
      uri_masked: process.env.MONGODB_URI 
        ? process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')
        : 'not set',
    },
    frontend: {
      url: process.env.FRONTEND_URL || 'not set',
    },
    cors: {
      origins: process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
        : ['default'],
    },
  };

  return summary;
};

module.exports = {
  validateEnvironment,
  getEnvSummary,
  REQUIRED_VARS,
  OPTIONAL_VARS,
};

