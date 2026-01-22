/**
 * Graceful Shutdown Utility
 * 
 * Handles graceful shutdown of all services:
 * - HTTP server
 * - WebSocket server (Socket.IO)
 * - Database connections
 * - Active requests
 */

const { logger } = require('./logger');
const { SHUTDOWN_TIMEOUT_MS } = require('../constants');

/**
 * Track active connections and requests
 */
let activeConnections = new Set();
let isShuttingDown = false;

/**
 * Register an active connection
 * @param {string} id - Connection identifier
 */
const registerConnection = (id) => {
  if (isShuttingDown) {
    return false;
  }
  activeConnections.add(id);
  return true;
};

/**
 * Unregister a connection
 * @param {string} id - Connection identifier
 */
const unregisterConnection = (id) => {
  activeConnections.delete(id);
};

/**
 * Get count of active connections
 * @returns {number} Number of active connections
 */
const getActiveConnectionCount = () => {
  return activeConnections.size;
};

/**
 * Wait for connections to close
 * @param {number} timeoutMs - Maximum time to wait
 * @returns {Promise<void>}
 */
const waitForConnections = async (timeoutMs = SHUTDOWN_TIMEOUT_MS) => {
  const startTime = Date.now();
  const checkInterval = 100; // Check every 100ms
  
  while (activeConnections.size > 0 && (Date.now() - startTime) < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  if (activeConnections.size > 0) {
    logger.warn(`Shutdown timeout: ${activeConnections.size} connections still active`);
  }
};

/**
 * Graceful shutdown handler
 * @param {Object} options - Shutdown options
 * @param {Object} options.httpServer - HTTP server instance
 * @param {Object} options.io - Socket.IO server instance
 * @param {Object} options.mongoose - Mongoose connection
 * @param {string} signal - Shutdown signal (SIGTERM, SIGINT)
 * @param {number} timeoutMs - Shutdown timeout in milliseconds
 */
const gracefulShutdown = async (options = {}, signal = 'UNKNOWN', timeoutMs = SHUTDOWN_TIMEOUT_MS) => {
  if (isShuttingDown) {
    logger.warn(`[${signal}] Shutdown already in progress...`);
    return;
  }
  
  isShuttingDown = true;
  logger.info(`\n[${signal}] Received shutdown signal. Starting graceful shutdown...`);
  
  const { httpServer, io, mongoose } = options;
  const shutdownStartTime = Date.now();
  
  try {
    // Step 1: Stop accepting new connections
    if (httpServer) {
      logger.info('[SHUTDOWN] Closing HTTP server (no new connections)...');
      await new Promise((resolve, reject) => {
        httpServer.close((err) => {
          if (err) {
            logger.error('[SHUTDOWN] Error closing HTTP server', { error: err.message });
            reject(err);
          } else {
            logger.info('[SHUTDOWN] HTTP server closed successfully');
            resolve();
          }
        });
      });
    }
    
    // Step 2: Close WebSocket connections
    if (io) {
      logger.info('[SHUTDOWN] Closing WebSocket connections...');
      try {
        // Disconnect all sockets
        io.disconnectSockets(true);
        logger.info('[SHUTDOWN] All WebSocket connections closed');
      } catch (err) {
        logger.error('[SHUTDOWN] Error closing WebSocket connections', { error: err.message });
      }
    }
    
    // Step 3: Wait for active connections to drain
    logger.info('[SHUTDOWN] Waiting for active connections to drain...');
    await waitForConnections(timeoutMs);
    
    // Step 4: Close database connection
    if (mongoose && mongoose.connection) {
      logger.info('[SHUTDOWN] Closing MongoDB connection...');
      try {
        await mongoose.connection.close();
        logger.info('[SHUTDOWN] MongoDB connection closed successfully');
      } catch (err) {
        logger.error('[SHUTDOWN] Error closing MongoDB connection', { error: err.message });
      }
    }
    
    const shutdownDuration = Date.now() - shutdownStartTime;
    logger.info(`[SHUTDOWN] Graceful shutdown complete in ${shutdownDuration}ms. Exiting...`);
    
  } catch (error) {
    logger.error('[SHUTDOWN] Error during graceful shutdown', {
      error: error.message,
      stack: error.stack,
    });
  } finally {
    process.exit(0);
  }
};

/**
 * Setup process signal handlers
 * @param {Object} options - Shutdown options
 */
const setupShutdownHandlers = (options = {}) => {
  const shutdown = (signal) => gracefulShutdown(options, signal);
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('FATAL: Uncaught Exception', {
      error: err.message,
      stack: err.stack,
    });
    gracefulShutdown(options, 'UNCAUGHT_EXCEPTION', 5000); // Shorter timeout for fatal errors
  });
  
  // Handle unhandled rejections
  process.on('unhandledRejection', (err) => {
    logger.error('FATAL: Unhandled Rejection', {
      error: err.message,
      stack: err.stack,
    });
    gracefulShutdown(options, 'UNHANDLED_REJECTION', 5000); // Shorter timeout for fatal errors
  });
};

module.exports = {
  gracefulShutdown,
  setupShutdownHandlers,
  registerConnection,
  unregisterConnection,
  getActiveConnectionCount,
  waitForConnections,
};





