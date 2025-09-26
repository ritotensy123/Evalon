const express = require('express');
const router = express.Router();
const {
  getAllUserManagements,
  getUserManagementById,
  createUserManagement,
  updateUserManagement,
  deleteUserManagement,
  toggleUserStatus,
  bulkCreateUserManagements,
  bulkDeleteUserManagements,
  bulkToggleUserManagementStatus,
  sendInvitation,
  getInvitation,
  acceptInvitation,
  getInvitations,
  cancelInvitation,
  resendInvitation,
  bulkSendInvitations,
  getUserManagementStats,
  updateUserManagementRole,
  updateUserRole,
  bulkUpdateUserRoles,
  getRoleDistribution,
  getRecentActivity,
  getUsersByRole,
  getRegistrationDetails,
  completeRegistration,
  validateOrganizationCode
} = require('../controllers/userManagementController');
const {
  authenticateUserManagement,
  requireAdminOrSubAdmin,
  canManageUsers,
  canViewUsers,
  validateOrganizationMembership,
  rateLimitUserOperations,
  logUserAction
} = require('../middleware/userManagementAuth');

// Public routes (no authentication required)
router.get('/invitations/:token', getInvitation);
router.post('/invitations/:token/accept', acceptInvitation);

// Registration completion routes (no authentication required)
router.get('/registration/:token', getRegistrationDetails);
router.post('/registration/:token/complete', completeRegistration);
router.post('/registration/validate-code', validateOrganizationCode);

// Apply authentication middleware to all other routes
router.use(authenticateUserManagement);

// Bulk operations
router.post('/users/bulk', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 5),
  logUserAction('bulk_create_users'),
  bulkCreateUserManagements
);

router.delete('/users/bulk', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 3),
  logUserAction('bulk_delete_users'),
  bulkDeleteUserManagements
);

router.patch('/users/bulk/status', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 5),
  logUserAction('bulk_toggle_user_status'),
  bulkToggleUserManagementStatus
);

// User CRUD operations
router.get('/organization/:organizationId/users', 
  validateOrganizationMembership, 
  canViewUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 50),
  logUserAction('get_all_users'),
  getAllUserManagements
);

router.get('/users/:userId', 
  canViewUsers, 
  logUserAction('get_user_by_id'),
  getUserManagementById
);

router.post('/users', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 20),
  logUserAction('create_user'),
  createUserManagement
);

router.put('/users/:userId', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 30),
  logUserAction('update_user'),
  updateUserManagement
);

router.delete('/users/:userId', 
  requireAdminOrSubAdmin, 
  rateLimitUserOperations(15 * 60 * 1000, 10),
  logUserAction('delete_user'),
  deleteUserManagement
);

router.patch('/users/:userId/status', 
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 20),
  logUserAction('toggle_user_status'),
  toggleUserStatus
);


// Invitation system
router.post('/organization/:organizationId/invitations', 
  validateOrganizationMembership,
  canManageUsers, 
  rateLimitUserOperations(15 * 60 * 1000, 20),
  logUserAction('send_invitation'),
  sendInvitation
);

router.get('/organization/:organizationId/invitations', 
  validateOrganizationMembership,
  canViewUsers,
  getInvitations
);

router.put('/invitations/:invitationId/cancel', 
  canManageUsers,
  rateLimitUserOperations(15 * 60 * 1000, 10),
  logUserAction('cancel_invitation'),
  cancelInvitation
);

router.post('/invitations/:invitationId/resend', 
  canManageUsers,
  rateLimitUserOperations(15 * 60 * 1000, 10),
  logUserAction('resend_invitation'),
  resendInvitation
);

router.post('/organization/:organizationId/invitations/bulk', 
  validateOrganizationMembership,
  canManageUsers,
  rateLimitUserOperations(15 * 60 * 1000, 5),
  logUserAction('bulk_send_invitations'),
  bulkSendInvitations
);

// Statistics and analytics
router.get('/organization/:organizationId/stats', 
  validateOrganizationMembership, 
  canViewUsers, 
  getUserManagementStats
);

router.get('/organization/:organizationId/role-distribution', 
  validateOrganizationMembership, 
  canViewUsers, 
  getRoleDistribution
);

router.get('/organization/:organizationId/recent-activity', 
  validateOrganizationMembership, 
  canViewUsers, 
  getRecentActivity
);

router.get('/organization/:organizationId/users/role/:role', 
  validateOrganizationMembership, 
  canViewUsers, 
  getUsersByRole
);

// Role management
router.put('/users/:userId/role', 
  requireAdminOrSubAdmin, 
  rateLimitUserOperations(15 * 60 * 1000, 15),
  logUserAction('update_user_role'),
  updateUserManagementRole
);

router.put('/users/:userId/role-update', 
  requireAdminOrSubAdmin, 
  rateLimitUserOperations(15 * 60 * 1000, 15),
  logUserAction('update_user_role_new'),
  updateUserRole
);

router.post('/users/roles/bulk-update', 
  requireAdminOrSubAdmin,
  rateLimitUserOperations(15 * 60 * 1000, 5),
  logUserAction('bulk_update_user_roles'),
  bulkUpdateUserRoles
);

module.exports = router;
