const express = require('express');
const router = express.Router();
const {
  trackUserActivity,
  getUserActivityLog,
  getOnlineUsers,
  getUserSession,
  updateUserSession
} = require('../controllers/userActivityController');
const {
  authenticateUserManagement,
  canViewUsers,
  validateOrganizationMembership,
  rateLimitUserOperations,
  logUserAction
} = require('../middleware/userManagementAuth');

// Apply authentication middleware to all routes
router.use(authenticateUserManagement);

// User activity tracking
router.post('/users/:userId/activity', 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 100),
  logUserAction('track_activity'),
  trackUserActivity
);

router.get('/users/:userId/activity', 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 50),
  logUserAction('get_activity_log'),
  getUserActivityLog
);

router.get('/users/:userId/session', 
  canViewUsers, 
  logUserAction('get_user_session'),
  getUserSession
);

router.put('/users/:userId/session', 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 200),
  logUserAction('update_user_session'),
  updateUserSession
);

// Organization-wide activity
router.get('/organization/:organizationId/online-users', 
  validateOrganizationMembership, 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 30),
  logUserAction('get_online_users'),
  getOnlineUsers
);

module.exports = router;
