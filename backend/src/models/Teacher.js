const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  // Basic Details (Step 1)
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  countryCode: {
    type: String,
    required: true,
    default: '+91'
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  
  // Professional Details (Step 2)
  subjects: [{
    type: String,
    trim: true
  }],
  role: {
    type: String,
    enum: ['teacher', 'hod', 'coordinator'],
    required: true
  },
  affiliationType: {
    type: String,
    enum: ['organization', 'freelance'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'experienced', 'expert'],
    required: function() {
      return this.affiliationType === 'freelance';
    }
  },
  currentInstitution: {
    type: String,
    trim: true
  },
  yearsOfExperience: {
    type: String,
    trim: true
  },
  
  // Organization Link (Step 3)
  organizationCode: {
    type: String,
    trim: true,
    required: function() {
      return this.affiliationType === 'organization';
    }
  },
  organizationName: {
    type: String,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function() {
      return this.affiliationType === 'organization';
    }
  },
  isOrganizationValid: {
    type: Boolean,
    default: false
  },
  associationStatus: {
    type: String,
    enum: ['verified', 'pending', 'not_found'],
    default: 'pending'
  },
  
  // Security Verification (Step 4)
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Additional fields for compatibility
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  
  // Verification data
  emailOTP: {
    code: String,
    expiresAt: Date
  },
  phoneOTP: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Index for better query performance
teacherSchema.index({ emailAddress: 1 });
teacherSchema.index({ organizationId: 1 });
teacherSchema.index({ organizationCode: 1 });
teacherSchema.index({ status: 1 });
teacherSchema.index({ affiliationType: 1 });

// Password hashing middleware
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate teacher code
teacherSchema.methods.generateTeacherCode = function() {
  const prefix = 'TCH';
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${randomNum}`;
};

// Ensure virtual fields are serialized
teacherSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailOTP;
    delete ret.phoneOTP;
    return ret;
  }
});
teacherSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailOTP;
    delete ret.phoneOTP;
    return ret;
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);


