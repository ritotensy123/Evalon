const { performDatabaseHealthCheck, autoFixDataIssues } = require('../utils/databaseHealth');
const { authenticate } = require('../middleware/auth');

/**
 * Health check endpoint for database and system status
 */
const getHealthStatus = async (req, res) => {
  try {
    const healthReport = await performDatabaseHealthCheck();
    
    res.json({
      success: true,
      data: healthReport,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

/**
 * Auto-fix data issues endpoint (admin only)
 */
const fixDataIssues = async (req, res) => {
  try {
    // Only allow organization admins to run auto-fixes
    if (req.user.userType !== 'organization_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only organization administrators can run data fixes.'
      });
    }

    const fixes = await autoFixDataIssues();
    
    res.json({
      success: true,
      message: 'Data fixes completed',
      fixes: fixes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auto-fix failed:', error);
    res.status(500).json({
      success: false,
      message: 'Auto-fix failed',
      error: error.message
    });
  }
};

/**
 * Database connection info endpoint
 */
const getDatabaseInfo = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }

    const dbInfo = {
      connected: true,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.db.databaseName,
      readyState: mongoose.connection.readyState,
      collections: await mongoose.connection.db.listCollections().toArray()
    };

    res.json({
      success: true,
      data: dbInfo
    });
  } catch (error) {
    console.error('Database info failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database info',
      error: error.message
    });
  }
};

module.exports = {
  getHealthStatus,
  fixDataIssues,
  getDatabaseInfo
};

