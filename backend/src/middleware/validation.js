/**
 * Validation Middleware
 * 
 * Standardized validation error handling for express-validator
 * Provides consistent error responses and integrates with apiResponse utility
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');
const { logger } = require('../utils/logger');
const { HTTP_STATUS_CODES } = require('../constants');

/**
 * Middleware to check validation results
 * Should be used after express-validator rules
 * 
 * @example
 * router.post('/endpoint', [
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 8 }),
 *   validateRequest
 * ], handler);
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  const requestId = req.id || res.locals.requestId || 'unknown';
  
  if (!errors.isEmpty()) {
    // Log validation errors
    logger.warn('Validation failed', {
      requestId,
      path: req.path,
      method: req.method,
      errors: errors.array(),
    });
    
    // Format errors for response
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));
    
    return sendError(
      res,
      {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors,
      },
      'Validation failed',
      HTTP_STATUS_CODES.BAD_REQUEST
    );
  }
  
  next();
};

/**
 * Custom validation error handler
 * Can be used to create custom validation logic
 * 
 * @param {Function} validator - Validation function that returns error object or null
 * @returns {Function} Express middleware
 */
const customValidator = (validator) => {
  return async (req, res, next) => {
    try {
      const error = await validator(req);
      if (error) {
        return sendError(
          res,
          {
            code: 'VALIDATION_ERROR',
            message: error.message || 'Validation failed',
            details: error.details || null,
          },
          error.message || 'Validation failed',
          HTTP_STATUS_CODES.BAD_REQUEST
        );
      }
      next();
    } catch (err) {
      logger.error('Validation error', {
        requestId: req.id || 'unknown',
        error: err.message,
        stack: err.stack,
      });
      return sendError(
        res,
        { code: 'VALIDATION_ERROR', message: 'Validation check failed' },
        'Validation check failed',
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
      );
    }
  };
};

module.exports = {
  validateRequest,
  customValidator,
};





