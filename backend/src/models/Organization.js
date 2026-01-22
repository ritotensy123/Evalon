const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    country: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    postalCode: {
      type: String,
      default: ''
    },
    street: {
      type: String,
      default: ''
    }
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  foundedYear: {
    type: Number,
    required: true
  },
  orgCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  institutionStructure: {
    type: String,
    enum: ['school', 'college', 'university', 'institute', 'academy', 'single', 'multi'],
    required: true
  },
  timeZone: {
    type: String,
    required: true,
    default: 'Asia/Kolkata'
  },
  
  // Step 3 fields
  departments: [{
    type: String,
    trim: true
  }],
  addSubAdmins: {
    type: Boolean,
    default: false
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  logo: {
    type: String,
    trim: true
  },
  
  // Location fields
  country: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  studentStrength: {
    type: Number,
    default: 0,
    min: 0
  },
  isGovernmentRecognized: {
    type: Boolean,
    default: false
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
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Admin Information
  adminName: {
    type: String,
    required: true,
    trim: true
  },
  adminEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  adminPhone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Settings
  settings: {
    allowStudentRegistration: {
      type: Boolean,
      default: true
    },
    allowTeacherRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    requirePhoneVerification: {
      type: Boolean,
      default: true
    }
  },
  
  // Setup Wizard Fields
  setupCompleted: {
    type: Boolean,
    default: false
  },
  setupCompletedAt: {
    type: Date
  },
  setupSkipped: {
    type: Boolean,
    default: false
  },
  setupSkippedAt: {
    type: Date
  },
  
  // Admin Permissions
  adminPermissions: {
    type: Map,
    of: Boolean,
    default: {}
  },
  
  // Security Settings
  securitySettings: {
    twoFactorAuth: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 30,
      min: 0
    },
    passwordPolicy: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    loginAttempts: {
      type: Number,
      default: 5,
      min: 0
    },
    ipWhitelist: {
      type: Boolean,
      default: false
    },
    auditLogging: {
      type: Boolean,
      default: true
    }
  },
  
  // Notification Settings
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    systemAlerts: {
      type: Boolean,
      default: true
    },
    weeklyReports: {
      type: Boolean,
      default: true
    },
    monthlyReports: {
      type: Boolean,
      default: true
    }
  },
  
  // Sub-Administrators
  subAdmins: [{
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'department_admin', 'content_manager'],
      default: 'department_admin'
    },
    permissions: {
      type: Map,
      of: Boolean,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0,
      min: 0
    },
    totalTeachers: {
      type: Number,
      default: 0,
      min: 0
    },
    totalSubAdmins: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
organizationSchema.index({ email: 1 });
organizationSchema.index({ orgCode: 1 });
organizationSchema.index({ status: 1 });

// Virtual for full organization name
organizationSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.orgCode})`;
});

// Method to get organization summary
organizationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    orgCode: this.orgCode,
    email: this.email,
    status: this.status,
    institutionStructure: this.institutionStructure,
    stats: this.stats
  };
};

module.exports = mongoose.model('Organization', organizationSchema);
