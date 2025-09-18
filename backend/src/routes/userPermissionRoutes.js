const express = require('express');
const router = express.Router();
const {
  getUserPermissions,
  checkUserPermission,
  getAllRolePermissions,
  updateRolePermissions,
  getUsersByRole,
  getRoleDistribution,
  requirePermission
} = require('../controllers/userPermissionController');
const {
  authenticateUserManagement,
  requireAdminOrSubAdmin,
  canViewUsers,
  validateOrganizationMembership,
  rateLimitUserOperations,
  logUserAction
} = require('../middleware/userManagementAuth');

// Apply authentication middleware to all routes
router.use(authenticateUserManagement);

// Permission management
router.get('/users/:userId/permissions', 
  canViewUsers, 
  logUserAction('get_user_permissions'),
  getUserPermissions
);

router.get('/users/:userId/permissions/check', 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 100),
  logUserAction('check_user_permission'),
  checkUserPermission
);

router.get('/roles/permissions', 
  canViewUsers, 
  logUserAction('get_all_role_permissions'),
  getAllRolePermissions
);

router.put('/roles/permissions', 
  requireAdminOrSubAdmin, 
  rateLimitUserOperations(15 * 60 * 1000, 10),
  logUserAction('update_role_permissions'),
  updateRolePermissions
);

// Role-based queries
router.get('/organization/:organizationId/users/by-role', 
  validateOrganizationMembership, 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 50),
  logUserAction('get_users_by_role'),
  getUsersByRole
);

router.get('/organization/:organizationId/role-distribution', 
  validateOrganizationMembership, 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 30),
  logUserAction('get_role_distribution'),
  getRoleDistribution
);

module.exports = router;
