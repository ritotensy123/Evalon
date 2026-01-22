const HealthService = require('../services/HealthService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// Track server start time for uptime calculation
const serverStartTime = Date.now();
HealthService.setServerStartTime(serverStartTime);

/**
 * Basic health check endpoint for load balancers and Kubernetes probes
 * Returns minimal info for quick health verification
 */
const getBasicHealth = asyncWrapper(async (req, res) => {
  const health = await HealthService.getBasicHealth();

  if (!health.success) {
    return sendSuccess(res, health, health.message || 'Unhealthy', 503);
  }

  return sendSuccess(res, health, 'OK', 200);
});

/**
 * Detailed health check endpoint for database and system status
 */
const getHealthStatus = asyncWrapper(async (req, res) => {
  const health = await HealthService.getHealthStatus();

  return sendSuccess(res, health, 'OK', 200);
});

/**
 * Auto-fix data issues endpoint (admin only)
 */
const fixDataIssues = asyncWrapper(async (req, res) => {
  // Only allow organization admins to run auto-fixes
  if (req.user.userType !== 'organization_admin') {
    throw AppError.forbidden('Access denied. Only organization administrators can run data fixes.');
  }

  const fixes = await HealthService.autoFixDataIssues();

  return sendSuccess(res, {
    fixes: fixes,
    timestamp: new Date().toISOString()
  }, 'Data fixes completed', 200);
});

/**
 * Database connection info endpoint
 */
const getDatabaseInfo = asyncWrapper(async (req, res) => {
  const connectionStatus = await HealthService.getConnectionStatus();

  if (!connectionStatus.isConnected) {
    throw AppError.serviceUnavailable('Database not connected');
  }

  const dbStats = await HealthService.getDatabaseStats();
  const collections = await HealthService.listCollections();

  const dbInfo = {
    connected: true,
    host: connectionStatus.host,
    port: connectionStatus.port,
    database: connectionStatus.databaseName,
    readyState: connectionStatus.readyState,
    stats: dbStats,
    collections: collections
  };

  return sendSuccess(res, dbInfo, 'OK', 200);
});

module.exports = {
  getBasicHealth,
  getHealthStatus,
  fixDataIssues,
  getDatabaseInfo
};
