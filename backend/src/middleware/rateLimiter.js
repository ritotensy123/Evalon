/**
 * Rate Limiting Middleware
 * 
 * Provides configurable rate limiting for API endpoints
 * Uses express-rate-limit with environment-based configuration
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');
const { HTTP_STATUS_CODES } = require('../constants');

/**
 * Create a rate limiter with custom configuration
 * 
 * @param {Object} options - Rate limiter options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.message - Custom error message
 * @param {boolean} options.standardHeaders - Enable standard rate limit headers
 * @param {boolean} options.legacyHeaders - Enable legacy rate limit headers
 * @param {string} options.name - Name for logging (optional)
 * @returns {Function} Express rate limit middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false,
    name = 'RateLimiter',
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders,
    legacyHeaders,
    handler: (req, res) => {
      const requestId = req.id || res.locals.requestId || 'unknown';
      
      logger.warn('Rate limit exceeded', {
        requestId,
        ip: req.ip,
        path: req.path,
        method: req.method,
        limiter: name,
      });
      
      return sendError(
        res,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil(windowMs / 1000), // seconds
        },
        message,
        HTTP_STATUS_CODES.TOO_MANY_REQUESTS || 429
      );
    },
    skip: (req) => {
      // Skip rate limiting in test environment
      if (process.env.NODE_ENV === 'test') return true;
      
      // Skip rate limiting in development if explicitly disabled
      if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
        return true;
      }
      
      return false;
    },
  });
};

/**
 * Strict rate limiter for sensitive endpoints (auth, registration, etc.)
 * 5 requests per 15 minutes
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many attempts. Please try again later.',
  name: 'StrictRateLimiter',
});

/**
 * Standard rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
const standardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests. Please try again later.',
  name: 'StandardRateLimiter',
});

/**
 * Generous rate limiter for read-only endpoints
 * 200 requests per 15 minutes
 */
const generousRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests. Please try again later.',
  name: 'GenerousRateLimiter',
});

/**
 * Upload rate limiter for file upload endpoints
 * 10 requests per 15 minutes
 */
const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many upload requests. Please try again later.',
  name: 'UploadRateLimiter',
});

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  standardRateLimiter,
  generousRateLimiter,
  uploadRateLimiter,
};



