const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
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
    lowercase: true,
    trim: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
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
  
  // Organization Verification (Step 2)
  organizationCode: {
    type: String,
    required: false,
    trim: true,
    uppercase: true
  },
  organizationName: {
    type: String,
    required: false,
    trim: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  },
  isStandalone: {
    type: Boolean,
    default: false
  },
  isOrganizationValid: {
    type: Boolean,
    default: false
  },
  associationStatus: {
    type: String,
    enum: ['verified', 'pending', 'not_found', 'standalone'],
    default: 'pending'
  },
  
  // Security Verification (Step 3)
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Auto Mapping (Step 4)
  studentCode: {
    type: String,
    unique: true,
    sparse: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  rollNumber: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    trim: true
  }],
  assignedTeachers: [{
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher'
    },
    subject: {
      type: String,
      trim: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Account Security
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studentSchema.index({ emailAddress: 1 });
studentSchema.index({ organizationCode: 1 });
studentSchema.index({ studentCode: 1 });
studentSchema.index({ organizationId: 1 });
studentSchema.index({ rollNumber: 1, organizationId: 1 }, { unique: true });

// Pre-save middleware to hash password
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate student code
studentSchema.methods.generateStudentCode = function() {
  const prefix = 'STU';
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${prefix}${randomNum}`;
};

// Method to generate roll number
studentSchema.methods.generateRollNumber = function() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${randomNum}`;
};

// Virtual for age calculation
studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full phone number
studentSchema.virtual('fullPhoneNumber').get(function() {
  return `${this.countryCode}${this.phoneNumber}`;
});

// Ensure virtual fields are serialized
studentSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Student', studentSchema);
