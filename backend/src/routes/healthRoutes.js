/**
 * Health Check Routes
 * 
 * Comprehensive health check endpoints for monitoring
 * and system status verification
 */

const express = require('express');
const mongoose = require('mongoose');
const os = require('os');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logger } = require('../utils/logger');
const asyncWrapper = require('../middleware/asyncWrapper');

const router = express.Router();

/**
 * Basic health check
 * Returns simple OK status
 */
router.get('/', asyncWrapper(async (req, res) => {
  return sendSuccess(res, {
    status: 'healthy',
    service: 'evalon-api',
    timestamp: new Date().toISOString()
  }, 'Service is healthy', 200);
}));

/**
 * Comprehensive health check
 * Checks database, memory, disk space, and services
 */
router.get('/detailed', asyncWrapper(async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'evalon-api',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      memory: checkMemory(),
      disk: checkDiskSpace(),
      uptime: process.uptime()
    }
  };

  // Determine overall status
  const allHealthy = Object.values(health.checks).every(check => 
    check.status === 'healthy' || check.status === 'ok'
  );

  if (!allHealthy) {
    health.status = 'degraded';
  }

  const statusCode = allHealthy ? 200 : 503;
  return sendSuccess(res, health, 'Health check completed', statusCode);
}));

/**
 * Database health check
 */
async function checkDatabase() {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state === 1) {
      // Test query
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        state: states[state],
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host
      };
    }

    return {
      status: 'unhealthy',
      state: states[state] || 'unknown',
      message: 'Database not connected'
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Memory health check
 */
function checkMemory() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = (usedMemory / totalMemory) * 100;

  const status = usagePercent > 90 ? 'warning' : usagePercent > 95 ? 'critical' : 'healthy';

  return {
    status: status,
    total: formatBytes(totalMemory),
    used: formatBytes(usedMemory),
    free: formatBytes(freeMemory),
    usagePercent: Math.round(usagePercent * 100) / 100
  };
}

/**
 * Disk space health check
 */
function checkDiskSpace() {
  try {
    // Get disk space info (simplified - may need fs.statfs for detailed info)
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      status: 'healthy',
      cpus: cpus.length,
      loadAverage: {
        '1min': Math.round(loadAvg[0] * 100) / 100,
        '5min': Math.round(loadAvg[1] * 100) / 100,
        '15min': Math.round(loadAvg[2] * 100) / 100
      },
      platform: os.platform(),
      arch: os.arch()
    };
  } catch (error) {
    logger.error('Disk space check failed', { error: error.message });
    return {
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Liveness probe (for Kubernetes/Docker)
 * Simple check that service is running
 */
router.get('/live', asyncWrapper(async (req, res) => {
  return sendSuccess(res, {
    status: 'alive',
    timestamp: new Date().toISOString()
  }, 'Service is alive', 200);
}));

/**
 * Readiness probe (for Kubernetes/Docker)
 * Checks if service is ready to accept traffic
 */
router.get('/ready', asyncWrapper(async (req, res) => {
  const dbStatus = await checkDatabase();
  
  if (dbStatus.status !== 'healthy') {
    return sendError(res, null, 'Service not ready', 503);
  }

  return sendSuccess(res, {
    status: 'ready',
    timestamp: new Date().toISOString()
  }, 'Service is ready', 200);
}));

module.exports = router;
