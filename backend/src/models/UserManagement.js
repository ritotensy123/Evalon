const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userManagementSchema = new mongoose.Schema({
  // Basic user information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'email';
    }
  },
  
  // Contact information
  phone: {
    type: String,
    trim: true
  },
  countryCode: {
    type: String,
    default: '+1'
  },
  
  // Role and organization
  role: {
    type: String,
    enum: ['admin', 'sub_admin', 'teacher', 'student'],
    required: true,
    index: true
  },
  department: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  
  // User status
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Authentication
  authProvider: {
    type: String,
    enum: ['email', 'google', 'invitation'],
    default: 'email'
  },
  
  // Verification status
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Login tracking
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Additional information
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Profile information (for compatibility)
  profile: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    role: String,
    department: String,
    avatar: String
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Email verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Invitation tracking
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserManagement'
  },
  invitationToken: String,
  invitationExpires: Date,
  
  // Activity tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  sessionDuration: {
    type: Number,
    default: 0 // in minutes
  },
  deviceInfo: {
    type: String
  },
  location: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userManagementSchema.index({ email: 1, organizationId: 1 }, { unique: true });
userManagementSchema.index({ organizationId: 1, role: 1 });
userManagementSchema.index({ organizationId: 1, status: 1 });
userManagementSchema.index({ lastLogin: -1 });
userManagementSchema.index({ createdAt: -1 });

// Virtual for full name
userManagementSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full phone number
userManagementSchema.virtual('fullPhone').get(function() {
  if (this.phone && this.countryCode) {
    return `${this.countryCode}${this.phone}`;
  }
  return this.phone;
});

// Pre-save middleware to hash password and update profile
userManagementSchema.pre('save', async function(next) {
  // Update profile information
  this.profile = {
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.fullPhone,
    role: this.role,
    department: this.department,
    avatar: this.profile?.avatar || null
  };
  
  // Skip hashing if password is not modified and user already exists
  if (!this.isModified('password') && !this.isNew) {
    return next();
  }
  
  // Skip hashing if auth provider doesn't support password authentication
  if (this.authProvider !== 'email') {
    return next();
  }
  
  // Only hash if password exists and is not already hashed
  if (this.password && !this.password.startsWith('$2')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Method to compare password
userManagementSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.authProvider !== 'email' || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userManagementSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Method to update activity
userManagementSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Method to get user statistics
userManagementSchema.statics.getUserStats = function(organizationId) {
  return this.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        teachers: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $in: ['$role', ['admin', 'sub_admin']] }, 1, 0] } },
        emailVerified: { $sum: { $cond: ['$emailVerified', 1, 0] } },
        phoneVerified: { $sum: { $cond: ['$phoneVerified', 1, 0] } }
      }
    }
  ]);
};

// Method to get role distribution
userManagementSchema.statics.getRoleDistribution = function(organizationId) {
  return this.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Method to get recent activity
userManagementSchema.statics.getRecentActivity = function(organizationId, limit = 10) {
  return this.find({ organizationId })
    .select('firstName lastName email role lastLogin lastActivity status')
    .sort({ lastActivity: -1 })
    .limit(limit);
};

// Method to find users by role
userManagementSchema.statics.findByRole = function(organizationId, role) {
  return this.find({ organizationId, role, status: 'active' })
    .select('-password')
    .sort({ firstName: 1, lastName: 1 });
};

// Method to find users by status
userManagementSchema.statics.findByStatus = function(organizationId, status) {
  return this.find({ organizationId, status })
    .select('-password')
    .sort({ createdAt: -1 });
};

// Method to search users
userManagementSchema.statics.searchUsers = function(organizationId, searchTerm, options = {}) {
  const { role, status, limit = 50, skip = 0 } = options;
  
  const query = {
    organizationId,
    $or: [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { department: { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (role && role !== 'all') {
    query.role = role;
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  return this.find(query)
    .select('-password')
    .sort({ firstName: 1, lastName: 1 })
    .skip(skip)
    .limit(limit);
};

// Method to bulk create users
userManagementSchema.statics.bulkCreate = async function(users, organizationId) {
  const results = {
    successful: [],
    failed: [],
    total: users.length
  };
  
  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await this.findOne({
        email: userData.email.toLowerCase(),
        organizationId
      });
      
      if (existingUser) {
        results.failed.push({
          email: userData.email,
          error: 'User already exists'
        });
        continue;
      }
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).substring(2, 15);
      
      const user = new this({
        ...userData,
        email: userData.email.toLowerCase(),
        organizationId,
        password: tempPassword,
        authProvider: 'email',
        status: userData.status || 'active'
      });
      
      await user.save();
      
      results.successful.push({
        email: userData.email,
        userId: user._id,
        tempPassword
      });
      
    } catch (error) {
      results.failed.push({
        email: userData.email,
        error: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('UserManagement', userManagementSchema);
