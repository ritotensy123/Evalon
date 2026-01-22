/**
 * Common Validation Schemas
 * 
 * Reusable validation rules for express-validator
 * Use with validateRequest middleware
 */

const { body, param, query } = require('express-validator');

/**
 * MongoDB ObjectId validation
 */
const mongoId = (field = 'id') => {
  return param(field)
    .isMongoId()
    .withMessage(`${field} must be a valid MongoDB ObjectId`);
};

/**
 * Email validation
 */
const email = (field = 'email') => {
  return body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage(`${field} must be a valid email address`);
};

/**
 * Password validation
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const password = (field = 'password') => {
  return body(field)
    .isLength({ min: 8 })
    .withMessage(`${field} must be at least 8 characters long`)
    .matches(/[A-Z]/)
    .withMessage(`${field} must contain at least one uppercase letter`)
    .matches(/[a-z]/)
    .withMessage(`${field} must contain at least one lowercase letter`)
    .matches(/[0-9]/)
    .withMessage(`${field} must contain at least one number`);
};

/**
 * Phone number validation (international format)
 */
const phone = (field = 'phone') => {
  return body(field)
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage(`${field} must be a valid international phone number`);
};

/**
 * String length validation
 */
const stringLength = (field, min = 1, max = 255) => {
  return body(field)
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);
};

/**
 * Required string validation
 */
const requiredString = (field, min = 1, max = 255) => {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min, max })
    .withMessage(`${field} must be between ${min} and ${max} characters`);
};

/**
 * Optional string validation
 */
const optionalString = (field, max = 255) => {
  return body(field)
    .optional()
    .trim()
    .isLength({ max })
    .withMessage(`${field} must not exceed ${max} characters`);
};

/**
 * Integer validation
 */
const integer = (field, min = null, max = null) => {
  let validator = body(field).isInt();
  
  if (min !== null) {
    validator = validator.withOptions({ min });
  }
  if (max !== null) {
    validator = validator.withOptions({ max });
  }
  
  return validator.withMessage(
    `${field} must be an integer${min !== null ? ` >= ${min}` : ''}${max !== null ? ` <= ${max}` : ''}`
  );
};

/**
 * Array validation
 */
const array = (field, minLength = 0, maxLength = null) => {
  let validator = body(field).isArray();
  
  if (minLength > 0) {
    validator = validator.withOptions({ min: minLength });
  }
  if (maxLength !== null) {
    validator = validator.withOptions({ max: maxLength });
  }
  
  return validator.withMessage(
    `${field} must be an array${minLength > 0 ? ` with at least ${minLength} items` : ''}${maxLength !== null ? ` and at most ${maxLength} items` : ''}`
  );
};

/**
 * Boolean validation
 */
const boolean = (field) => {
  return body(field)
    .optional()
    .isBoolean()
    .withMessage(`${field} must be a boolean value`);
};

/**
 * Date validation
 */
const date = (field) => {
  return body(field)
    .optional()
    .isISO8601()
    .withMessage(`${field} must be a valid ISO 8601 date`);
};

/**
 * URL validation
 */
const url = (field) => {
  return body(field)
    .optional()
    .isURL()
    .withMessage(`${field} must be a valid URL`);
};

/**
 * Pagination validation
 */
const pagination = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('limit must be between 1 and 100'),
  ];
};

/**
 * Sort validation
 */
const sort = (allowedFields = []) => {
  return query('sort')
    .optional()
    .custom((value) => {
      if (allowedFields.length === 0) {
        return true; // No restrictions
      }
      const field = value.startsWith('-') ? value.slice(1) : value;
      return allowedFields.includes(field);
    })
    .withMessage(`sort field must be one of: ${allowedFields.join(', ')}`);
};

module.exports = {
  mongoId,
  email,
  password,
  phone,
  stringLength,
  requiredString,
  optionalString,
  integer,
  array,
  boolean,
  date,
  url,
  pagination,
  sort,
};





