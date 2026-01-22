/**
 * HealthService
 * Service layer for health check operations
 * Handles system health monitoring and validation
 */

const HealthRepository = require('../repositories/HealthRepository');
const { performDatabaseHealthCheck, autoFixDataIssues } = require('../utils/databaseHealth');
const AppError = require('../utils/AppError');
const { version } = require('../../package.json');

// Track server start time for uptime calculation
let serverStartTime = Date.now();

class HealthService {
  /**
   * Set server start time
   * @param {number} startTime - Server start timestamp
   */
  setServerStartTime(startTime) {
    serverStartTime = startTime;
  }

  /**
   * Get basic health status
   * @returns {Promise<Object>} - Basic health status
   */
  async getBasicHealth() {
    try {
      const connectionStatus = await HealthRepository.getConnectionStatus();
      const isHealthy = connectionStatus.isConnected;

      return {
        success: isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        version,
        database: {
          connected: connectionStatus.isConnected,
          status: connectionStatus.status
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        version,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive health status
   * @returns {Promise<Object>} - Comprehensive health status
   */
  async getHealthStatus() {
    try {
      const connectionStatus = await HealthRepository.getConnectionStatus();
      const uptime = Date.now() - serverStartTime;

      let healthReport = null;
      let databaseStats = null;

      if (connectionStatus.isConnected) {
        try {
          healthReport = await performDatabaseHealthCheck();
          databaseStats = await HealthRepository.getDatabaseStats();
        } catch (error) {
          // If health check fails, still return connection status
          console.error('Health check error:', error.message);
        }
      }

      return {
        success: connectionStatus.isConnected,
        status: connectionStatus.isConnected ? 'healthy' : 'unhealthy',
        version,
        uptime: {
          milliseconds: uptime,
          seconds: Math.floor(uptime / 1000),
          minutes: Math.floor(uptime / 60000),
          hours: Math.floor(uptime / 3600000)
        },
        database: {
          ...connectionStatus,
          stats: databaseStats,
          health: healthReport
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw AppError.internal(`Failed to get health status: ${error.message}`);
    }
  }

  /**
   * Get database connection status
   * @returns {Promise<Object>} - Connection status
   */
  async getConnectionStatus() {
    try {
      return await HealthRepository.getConnectionStatus();
    } catch (error) {
      throw AppError.internal(`Failed to get connection status: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} - Database statistics
   */
  async getDatabaseStats() {
    try {
      return await HealthRepository.getDatabaseStats();
    } catch (error) {
      throw AppError.internal(`Failed to get database stats: ${error.message}`);
    }
  }

  /**
   * List all collections
   * @returns {Promise<Array>} - Array of collection names
   */
  async listCollections() {
    try {
      return await HealthRepository.listCollections();
    } catch (error) {
      throw AppError.internal(`Failed to list collections: ${error.message}`);
    }
  }

  /**
   * Get collection statistics
   * @param {string} collectionName - Collection name
   * @returns {Promise<Object>} - Collection statistics
   */
  async getCollectionStats(collectionName) {
    try {
      return await HealthRepository.getCollectionStats(collectionName);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get collection stats: ${error.message}`);
    }
  }

  /**
   * Ping database
   * @returns {Promise<Object>} - Ping result
   */
  async pingDatabase() {
    try {
      return await HealthRepository.ping();
    } catch (error) {
      throw AppError.internal(`Failed to ping database: ${error.message}`);
    }
  }

  /**
   * Perform comprehensive database health check
   * @returns {Promise<Object>} - Health check report
   */
  async performHealthCheck() {
    try {
      return await performDatabaseHealthCheck();
    } catch (error) {
      throw AppError.internal(`Failed to perform health check: ${error.message}`);
    }
  }

  /**
   * Auto-fix data issues
   * @returns {Promise<Array>} - Array of fixes applied
   */
  async autoFixDataIssues() {
    try {
      return await autoFixDataIssues();
    } catch (error) {
      throw AppError.internal(`Failed to auto-fix data issues: ${error.message}`);
    }
  }
}

module.exports = new HealthService();






