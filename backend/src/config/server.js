/**
 * Centralized Server Configuration
 * 
 * All URLs, ports, and CORS settings in one place.
 * Environment variables should be set in .env file.
 * 
 * Required environment variables for production:
 * - FRONTEND_URL: Frontend application URL
 * - ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins
 * - JWT_SECRET: (validated in auth middleware)
 * - MONGODB_URI: (validated in database config)
 */

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================

// Import comprehensive environment validator
const { validateEnvironment, getEnvSummary } = require('../utils/envValidator');
const { logger } = require('../utils/logger');

/**
 * Validates that required environment variables are set.
 * Uses comprehensive envValidator for full validation.
 * In production, throws an error if any are missing.
 * In development, logs warnings but allows fallbacks.
 */
const validateEnv = () => {
  try {
    const result = validateEnvironment();
    
    if (!result.valid && process.env.NODE_ENV === 'production') {
      throw new Error(`FATAL: Missing required environment variables: ${result.missing.join(', ')}`);
    }
    
    // Log environment summary (without secrets)
    if (process.env.NODE_ENV !== 'test') {
      const summary = getEnvSummary();
      logger.info('Environment configuration', summary);
    }
    
    return result;
  } catch (error) {
    logger.error('Environment validation failed', { error: error.message });
    throw error;
  }
};

// Import centralized port configuration
const { ports, getUrls } = require('./ports');

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================

const config = {
  // Ports (from centralized config)
  PORT: ports.API,
  REALTIME_PORT: ports.REALTIME,
  
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001',
  get API_BASE_URL() {
    return process.env.API_BASE_URL || getUrls().API;
  },
  get REALTIME_URL() {
    return process.env.REALTIME_URL || getUrls().REALTIME;
  },
  
  // CORS - Parse from comma-separated string or use defaults
  get ALLOWED_ORIGINS() {
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
    }
    // Development fallbacks
    return ['http://localhost:3000', 'http://localhost:3001'];
  },
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  get IS_PRODUCTION() {
    return this.NODE_ENV === 'production';
  },
};

// =============================================================================
// CORS CONFIGURATION (Reusable)
// =============================================================================

/**
 * Standard CORS configuration for Express middleware
 */
const corsConfig = {
  origin: config.ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
};

/**
 * Socket.IO specific CORS configuration
 */
const socketCorsConfig = {
  origin: config.ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true,
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  config,
  corsConfig,
  socketCorsConfig,
  validateEnv,
};



