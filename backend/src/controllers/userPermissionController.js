const UserManagement = require('../models/UserManagement');
const Organization = require('../models/Organization');

// Define role permissions
const ROLE_PERMISSIONS = {
  admin: {
    userManagement: { read: true, write: true, delete: true },
    organizationSettings: { read: true, write: true, delete: true },
    studentManagement: { read: true, write: true, delete: true },
    teacherManagement: { read: true, write: true, delete: true },
    examManagement: { read: true, write: true, delete: true },
    questionBank: { read: true, write: true, delete: true },
    reports: { read: true, write: true, delete: true },
    systemSettings: { read: true, write: true, delete: true },
    roleManagement: { read: true, write: true, delete: true }
  },
  sub_admin: {
    userManagement: { read: true, write: true, delete: false },
    organizationSettings: { read: true, write: false, delete: false },
    studentManagement: { read: true, write: true, delete: true },
    teacherManagement: { read: true, write: true, delete: false },
    examManagement: { read: true, write: true, delete: true },
    questionBank: { read: true, write: true, delete: true },
    reports: { read: true, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: true, write: false, delete: false }
  },
  teacher: {
    userManagement: { read: false, write: false, delete: false },
    organizationSettings: { read: false, write: false, delete: false },
    studentManagement: { read: true, write: true, delete: false },
    teacherManagement: { read: false, write: false, delete: false },
    examManagement: { read: true, write: true, delete: false },
    questionBank: { read: true, write: true, delete: true },
    reports: { read: true, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: false, write: false, delete: false }
  },
  student: {
    userManagement: { read: false, write: false, delete: false },
    organizationSettings: { read: false, write: false, delete: false },
    studentManagement: { read: false, write: false, delete: false },
    teacherManagement: { read: false, write: false, delete: false },
    examManagement: { read: true, write: false, delete: false },
    reports: { read: false, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: false, write: false, delete: false }
  }
};

// Get user permissions
const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserManagement.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const permissions = ROLE_PERMISSIONS[user.role] || {};

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        role: user.role,
        permissions,
        organizationId: user.organizationId
      }
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user permissions',
      error: error.message
    });
  }
};

// Check if user has specific permission
const checkUserPermission = async (req, res) => {
  try {
    const { userId } = req.params;
    const { resource, action } = req.query;

    if (!resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Resource and action are required'
      });
    }

    const user = await UserManagement.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const permissions = ROLE_PERMISSIONS[user.role] || {};
    const hasPermission = permissions[resource] && permissions[resource][action];

    res.status(200).json({
      success: true,
      data: {
        hasPermission,
        userId: user._id,
        role: user.role,
        resource,
        action,
        permissions: permissions[resource] || {}
      }
    });

  } catch (error) {
    console.error('Check user permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user permission',
      error: error.message
    });
  }
};

// Get all role permissions
const getAllRolePermissions = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        roles: Object.keys(ROLE_PERMISSIONS),
        permissions: ROLE_PERMISSIONS
      }
    });

  } catch (error) {
    console.error('Get all role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get role permissions',
      error: error.message
    });
  }
};

// Update role permissions (admin only)
const updateRolePermissions = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!role || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Role and permissions are required'
      });
    }

    if (!ROLE_PERMISSIONS[role]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Update permissions for the role
    ROLE_PERMISSIONS[role] = { ...ROLE_PERMISSIONS[role], ...permissions };

    res.status(200).json({
      success: true,
      message: 'Role permissions updated successfully',
      data: {
        role,
        permissions: ROLE_PERMISSIONS[role]
      }
    });

  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role permissions',
      error: error.message
    });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { role } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }

    const users = await UserManagement.findByRole(organizationId, role);

    res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
        role
      }
    });

  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users by role',
      error: error.message
    });
  }
};

// Get role distribution
const getRoleDistribution = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const distribution = await UserManagement.getRoleDistribution(organizationId);

    res.status(200).json({
      success: true,
      data: {
        distribution,
        total: distribution.reduce((sum, item) => sum + item.count, 0)
      }
    });

  } catch (error) {
    console.error('Get role distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get role distribution',
      error: error.message
    });
  }
};

// Middleware to check permissions
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await UserManagement.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const permissions = ROLE_PERMISSIONS[user.role] || {};
      const hasPermission = permissions[resource] && permissions[resource][action];

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      req.userPermissions = permissions;
      next();

    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check permissions',
        error: error.message
      });
    }
  };
};

module.exports = {
  getUserPermissions,
  checkUserPermission,
  getAllRolePermissions,
  updateRolePermissions,
  getUsersByRole,
  getRoleDistribution,
  requirePermission,
  ROLE_PERMISSIONS
};
