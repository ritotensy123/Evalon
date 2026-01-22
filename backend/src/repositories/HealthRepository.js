/**
 * HealthRepository
 * Repository layer for health check data access
 * Handles database health check operations
 */

const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class HealthRepository {
  /**
   * Check database connection status
   * @returns {Promise<Object>} - Connection status information
   */
  async getConnectionStatus() {
    try {
      const readyState = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };

      return {
        status: states[readyState] || 'unknown',
        readyState,
        isConnected: readyState === 1,
        databaseName: mongoose.connection.db?.databaseName || null,
        host: mongoose.connection.host || null,
        port: mongoose.connection.port || null
      };
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
      if (mongoose.connection.readyState !== 1) {
        throw AppError.badRequest('Database is not connected');
      }

      const db = mongoose.connection.db;
      const stats = await db.stats();

      return {
        database: db.databaseName,
        collections: stats.collections || 0,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        indexes: stats.indexes || 0,
        indexSize: stats.indexSize || 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get database stats: ${error.message}`);
    }
  }

  /**
   * List all collections in the database
   * @returns {Promise<Array>} - Array of collection names
   */
  async listCollections() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw AppError.badRequest('Database is not connected');
      }

      const collections = await mongoose.connection.db.listCollections().toArray();
      return collections.map(c => c.name);
    } catch (error) {
      if (error instanceof AppError) throw error;
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
      if (mongoose.connection.readyState !== 1) {
        throw AppError.badRequest('Database is not connected');
      }

      if (!collectionName) {
        throw AppError.badRequest('Collection name is required');
      }

      const db = mongoose.connection.db;
      const stats = await db.collection(collectionName).stats();

      return {
        name: collectionName,
        count: stats.count || 0,
        size: stats.size || 0,
        storageSize: stats.storageSize || 0,
        indexes: stats.nindexes || 0,
        indexSize: stats.totalIndexSize || 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get collection stats: ${error.message}`);
    }
  }

  /**
   * Ping database to check connectivity
   * @returns {Promise<Object>} - Ping result
   */
  async ping() {
    try {
      if (mongoose.connection.readyState !== 1) {
        throw AppError.badRequest('Database is not connected');
      }

      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const latency = Date.now() - startTime;

      return {
        success: true,
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to ping database: ${error.message}`);
    }
  }
}

module.exports = new HealthRepository();






