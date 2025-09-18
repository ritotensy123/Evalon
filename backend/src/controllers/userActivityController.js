const UserManagement = require('../models/UserManagement');
const { store, retrieve, remove } = require('../utils/tempStorage');

// Track user activity
const trackUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { activity, deviceInfo, location } = req.body;

    const user = await UserManagement.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user activity
    user.lastActivity = new Date();
    if (deviceInfo) user.deviceInfo = deviceInfo;
    if (location) user.location = location;
    
    await user.save();

    // Store activity log
    const activityLog = {
      userId,
      activity,
      deviceInfo,
      location,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress
    };

    const logKey = `activity_${userId}_${Date.now()}`;
    store(logKey, activityLog);

    res.status(200).json({
      success: true,
      message: 'Activity tracked successfully',
      data: activityLog
    });

  } catch (error) {
    console.error('Track user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track user activity',
      error: error.message
    });
  }
};

// Get user activity log
const getUserActivityLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get user
    const user = await UserManagement.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get activity logs (in a real implementation, you'd store these in a database)
    const activities = [
      {
        id: 1,
        activity: 'Logged in',
        deviceInfo: 'Desktop - Chrome',
        location: 'Office',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ip: '192.168.1.100'
      },
      {
        id: 2,
        activity: 'Viewed dashboard',
        deviceInfo: 'Desktop - Chrome',
        location: 'Office',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ip: '192.168.1.100'
      },
      {
        id: 3,
        activity: 'Updated profile',
        deviceInfo: 'Desktop - Chrome',
        location: 'Office',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        ip: '192.168.1.100'
      }
    ];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          lastActivity: user.lastActivity
        },
        activities: activities.slice(offset, offset + parseInt(limit)),
        pagination: {
          total: activities.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });

  } catch (error) {
    console.error('Get user activity log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user activity log',
      error: error.message
    });
  }
};

// Get online users
const getOnlineUsers = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { limit = 100 } = req.query;

    // Get users who were active in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const onlineUsers = await UserManagement.find({
      organizationId,
      lastActivity: { $gte: fifteenMinutesAgo },
      status: 'active'
    })
    .select('-password')
    .sort({ lastActivity: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        users: onlineUsers,
        count: onlineUsers.length,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online users',
      error: error.message
    });
  }
};

// Get user session information
const getUserSession = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserManagement.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sessionInfo = {
      userId: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      lastActivity: user.lastActivity,
      loginCount: user.loginCount,
      sessionDuration: user.sessionDuration,
      deviceInfo: user.deviceInfo,
      location: user.location,
      isOnline: user.lastActivity && (new Date() - user.lastActivity) < 15 * 60 * 1000
    };

    res.status(200).json({
      success: true,
      data: sessionInfo
    });

  } catch (error) {
    console.error('Get user session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user session',
      error: error.message
    });
  }
};

// Update user session
const updateUserSession = async (req, res) => {
  try {
    const { userId } = req.params;
    const { deviceInfo, location, sessionDuration } = req.body;

    const user = await UserManagement.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update session information
    user.lastActivity = new Date();
    if (deviceInfo) user.deviceInfo = deviceInfo;
    if (location) user.location = location;
    if (sessionDuration) user.sessionDuration = sessionDuration;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User session updated successfully',
      data: {
        lastActivity: user.lastActivity,
        deviceInfo: user.deviceInfo,
        location: user.location,
        sessionDuration: user.sessionDuration
      }
    });

  } catch (error) {
    console.error('Update user session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user session',
      error: error.message
    });
  }
};

module.exports = {
  trackUserActivity,
  getUserActivityLog,
  getOnlineUsers,
  getUserSession,
  updateUserSession
};
