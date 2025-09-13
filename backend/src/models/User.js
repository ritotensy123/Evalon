const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'local' || this.authProvider === 'temp_password';
    }
  },
  
  // User role and type
  userType: {
    type: String,
    enum: ['organization_admin', 'sub_admin', 'teacher', 'student'],
    required: true
  },
  
  // Reference to the specific user document
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel'
  },
  
  // Dynamic reference based on userType
  userModel: {
    type: String,
    enum: ['Organization', 'Teacher', 'Student'],
    required: true
  },

  // Unique identifier for this specific user type + email combination
  userTypeEmail: {
    type: String,
    required: true,
    unique: true
  },
  
  // Authentication provider
  authProvider: {
    type: String,
    enum: ['local', 'google', 'temp_password'],
    default: 'local'
  },
  
  // Google authentication
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Login tracking
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Email verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Profile information
  profile: {
    firstName: String,
    lastName: String,
    fullName: String,
    avatar: String,
    phoneNumber: String,
    countryCode: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ userId: 1, userModel: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ userTypeEmail: 1 }, { unique: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.fullName || this.email;
});

// Pre-save middleware to hash password and generate userTypeEmail
userSchema.pre('save', async function(next) {
  // Generate userTypeEmail if not set
  if (!this.userTypeEmail) {
    this.userTypeEmail = `${this.email.toLowerCase()}_${this.userType}`;
  }
  
  if (!this.isModified('password') || (this.authProvider !== 'local' && this.authProvider !== 'temp_password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.authProvider !== 'local' && this.authProvider !== 'temp_password') {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user details with populated data
userSchema.methods.getUserDetails = async function() {
  const user = this.toObject();
  
  // Populate the referenced user document
  await this.populate('userId');
  
  return {
    id: this._id,
    email: this.email,
    userType: this.userType,
    userModel: this.userModel,
    authProvider: this.authProvider,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    isEmailVerified: this.isEmailVerified,
    profile: this.profile,
    userDetails: this.userId
  };
};

// Static method to find user by email and populate
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).populate('userId');
};

// Static method to find user by email and user type
userSchema.statics.findByEmailAndType = function(email, userType) {
  const userTypeEmail = `${email.toLowerCase()}_${userType}`;
  return this.findOne({ userTypeEmail }).populate('userId');
};

// Static method to create user from registration data
userSchema.statics.createFromRegistration = async function(userData) {
  const { email, password, userType, userId, userModel, profile } = userData;
  
  const userTypeEmail = `${email.toLowerCase()}_${userType}`;
  
  const user = new this({
    email: email.toLowerCase(),
    password,
    userType,
    userId,
    userModel,
    userTypeEmail,
    profile,
    isEmailVerified: true // Assuming email is verified during registration
  });
  
  return user.save();
};

module.exports = mongoose.model('User', userSchema);
