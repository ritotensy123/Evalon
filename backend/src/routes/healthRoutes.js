const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const { authenticate } = require('../middleware/auth');

// Public health check (no authentication required)
router.get('/status', healthController.getHealthStatus);

// Database info (requires authentication)
router.get('/database', authenticate, healthController.getDatabaseInfo);

// Auto-fix data issues (admin only)
router.post('/fix-data', authenticate, healthController.fixDataIssues);

module.exports = router;

