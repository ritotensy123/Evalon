/**
 * Centralized Configuration Export
 * 
 * Single entry point for all configuration modules.
 * This provides a clean API for accessing all configuration
 * across the application.
 * 
 * Usage:
 *   const { server, database, ports, cors } = require('./config');
 */

const serverConfig = require('./server');
const databaseConfig = require('./database');
const portsConfig = require('./ports');

/**
 * Server configuration
 * Includes: ports, URLs, CORS, environment settings
 */
const server = {
  ...serverConfig.config,
  cors: serverConfig.corsConfig,
  socketCors: serverConfig.socketCorsConfig,
  validateEnv: serverConfig.validateEnv,
};

/**
 * Database configuration
 * Connection function and settings
 */
const database = {
  connect: databaseConfig,
};

/**
 * Ports configuration
 * All service ports and URL generation
 */
const ports = {
  ...portsConfig.ports,
  validate: portsConfig.validatePorts,
  getUrls: portsConfig.getUrls,
};

/**
 * CORS configuration
 * Reusable CORS settings for Express and Socket.IO
 */
const cors = {
  express: serverConfig.corsConfig,
  socket: serverConfig.socketCorsConfig,
};

/**
 * Environment validation
 * Comprehensive environment variable validation
 */
const env = {
  validate: serverConfig.validateEnv,
};

module.exports = {
  server,
  database,
  ports,
  cors,
  env,
  // Direct access for backward compatibility
  config: serverConfig.config,
  corsConfig: serverConfig.corsConfig,
  socketCorsConfig: serverConfig.socketCorsConfig,
  validateEnv: serverConfig.validateEnv,
};





