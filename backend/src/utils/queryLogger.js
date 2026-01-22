/**
 * Query Logger Utility
 * 
 * Logs slow database queries for performance monitoring
 * Can be enabled/disabled via environment variable
 */

const { logger } = require('./logger');

// Configuration
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING === 'true';
const SLOW_QUERY_THRESHOLD_MS = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 100; // Default 100ms

/**
 * Log slow queries
 * @param {Object} query - Mongoose query object
 * @param {number} duration - Query duration in milliseconds
 */
const logSlowQuery = (query, duration) => {
  if (!ENABLE_QUERY_LOGGING || duration < SLOW_QUERY_THRESHOLD_MS) {
    return;
  }

  const queryInfo = {
    model: query.model?.modelName || 'Unknown',
    operation: query.op || 'unknown',
    duration: `${duration}ms`,
    filter: query.getFilter ? query.getFilter() : {},
    slow: duration >= SLOW_QUERY_THRESHOLD_MS * 2, // Very slow if 2x threshold
  };

  if (queryInfo.slow) {
    logger.warn('Slow database query detected', queryInfo);
  } else {
    logger.info('Database query', queryInfo);
  }
};

/**
 * Create query middleware for Mongoose
 * Logs queries that exceed the threshold
 */
const createQueryLogger = () => {
  if (!ENABLE_QUERY_LOGGING) {
    return null;
  }

  return (schema) => {
    schema.pre(/^find|^count|^update|^delete/, function() {
      const startTime = Date.now();
      const query = this;

      // Log after query completes
      query.exec = (function(originalExec) {
        return function(...args) {
          const result = originalExec.apply(this, args);
          
          if (result && typeof result.then === 'function') {
            // Promise-based query
            return result
              .then((data) => {
                const duration = Date.now() - startTime;
                logSlowQuery(query, duration);
                return data;
              })
              .catch((error) => {
                const duration = Date.now() - startTime;
                logger.error('Database query error', {
                  model: query.model?.modelName || 'Unknown',
                  operation: query.op || 'unknown',
                  duration: `${duration}ms`,
                  error: error.message,
                });
                throw error;
              });
          } else {
            // Callback-based query
            const duration = Date.now() - startTime;
            logSlowQuery(query, duration);
            return result;
          }
        };
      })(query.exec);

      return query;
    });
  };
};

/**
 * Enable query logging for all models
 * Call this after all models are loaded
 */
const enableQueryLogging = () => {
  if (!ENABLE_QUERY_LOGGING) {
    logger.info('Query logging is disabled. Set ENABLE_QUERY_LOGGING=true to enable.');
    return;
  }

  logger.info('Query logging enabled', {
    threshold: `${SLOW_QUERY_THRESHOLD_MS}ms`,
    verySlowThreshold: `${SLOW_QUERY_THRESHOLD_MS * 2}ms`,
  });
};

module.exports = {
  logSlowQuery,
  createQueryLogger,
  enableQueryLogging,
  ENABLE_QUERY_LOGGING,
  SLOW_QUERY_THRESHOLD_MS,
};





