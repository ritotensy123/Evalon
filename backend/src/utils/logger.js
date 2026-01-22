/**
 * Centralized Logging Utility
 * 
 * Uses Winston for structured logging with different transports
 * based on environment.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors for console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Format for console (development - human readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      let log = `${info.timestamp} [${info.level}]: ${info.message}`;
      if (info.requestId) {
        log += ` [${info.requestId}]`;
      }
      if (info.stack) {
        log += `\n${info.stack}`;
      }
      return log;
    }
  )
);

// Format for console (production - JSON)
const consoleJsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for files (always JSON for structured logging)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  defaultMeta: { service: 'evalon-backend' },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add console transport
// Production: JSON format for log aggregation tools (ELK, CloudWatch, etc.)
// Development: Human-readable format for easier debugging
logger.add(
  new winston.transports.Console({
    format: isProduction ? consoleJsonFormat : consoleFormat,
  })
);

// Create request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    // Structured log metadata
    const logMeta = {
      requestId: req.id || res.locals.requestId,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress,
    };
    
    // Add user info if available
    if (req.user) {
      logMeta.userId = req.user._id || req.user.id;
      logMeta.userType = req.user.userType;
    }
    
    if (res.statusCode >= 500) {
      logger.error(message, logMeta);
    } else if (res.statusCode >= 400) {
      logger.warn(message, logMeta);
    } else {
      logger.http(message, logMeta);
    }
  });
  
  next();
};

// Helper methods with structured logging
const logError = (error, context = {}) => {
  const errorMeta = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    timestamp: new Date().toISOString(),
    ...context,
  };
  
  logger.error(error.message, errorMeta);
};

const logInfo = (message, meta = {}) => {
  logger.info(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, {
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Structured logging helper for business events
const logEvent = (eventType, data = {}) => {
  logger.info(`Event: ${eventType}`, {
    eventType,
    timestamp: new Date().toISOString(),
    ...data,
  });
};

module.exports = {
  logger,
  requestLogger,
  logError,
  logInfo,
  logWarn,
  logDebug,
  logEvent,
};

