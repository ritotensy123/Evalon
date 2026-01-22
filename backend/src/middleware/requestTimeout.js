/**
 * Request Timeout Middleware
 * 
 * Prevents hanging requests by enforcing timeouts
 * Configurable per endpoint type
 */

const { logger } = require('../utils/logger');
const { sendError } = require('../utils/apiResponse');
const { HTTP_STATUS_CODES } = require('../constants');

/**
 * Create request timeout middleware
 * 
 * @param {Object} options - Timeout options
 * @param {number} options.timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {string} options.message - Custom timeout message
 * @returns {Function} Express middleware
 */
const createRequestTimeout = (options = {}) => {
  const {
    timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000, // 30 seconds
    message = 'Request timeout. The server took too long to respond.',
  } = options;

  return (req, res, next) => {
    const requestId = req.id || res.locals.requestId || 'unknown';
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          requestId,
          path: req.path,
          method: req.method,
          timeoutMs,
        });
        
        // Clear any pending response
        res.status(HTTP_STATUS_CODES.REQUEST_TIMEOUT || 408).json({
          success: false,
          message,
          code: 'REQUEST_TIMEOUT',
          requestId,
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);
    
    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(...args) {
      clearTimeout(timeout);
      originalEnd.apply(this, args);
    };
    
    next();
  };
};

/**
 * Standard request timeout (30 seconds)
 * Suitable for most endpoints
 */
const standardTimeout = createRequestTimeout({
  timeoutMs: 30000,
  message: 'Request timeout. Please try again.',
});

/**
 * Short timeout (10 seconds)
 * Suitable for simple read operations
 */
const shortTimeout = createRequestTimeout({
  timeoutMs: 10000,
  message: 'Request timeout. Please try again.',
});

/**
 * Long timeout (60 seconds)
 * Suitable for complex operations (file uploads, bulk operations)
 */
const longTimeout = createRequestTimeout({
  timeoutMs: 60000,
  message: 'Request timeout. The operation is taking longer than expected.',
});

/**
 * Very long timeout (120 seconds)
 * Suitable for very complex operations (large file uploads, data exports)
 */
const veryLongTimeout = createRequestTimeout({
  timeoutMs: 120000,
  message: 'Request timeout. The operation is taking longer than expected.',
});

module.exports = {
  createRequestTimeout,
  standardTimeout,
  shortTimeout,
  longTimeout,
  veryLongTimeout,
};





