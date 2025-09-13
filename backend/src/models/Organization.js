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
    type: String,
    required: true,
    trim: true
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
    default: 0
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
  
  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalTeachers: {
      type: Number,
      default: 0
    },
    totalSubAdmins: {
      type: Number,
      default: 0
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
