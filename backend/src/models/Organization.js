const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
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
    type: Number
  },
  studentCount: {
    type: Number,
    default: 0
  },
  teacherCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  orgCode: {
    type: String,
    required: true
  },
  institutionStructure: {
    type: String,
    enum: ['single', 'multi'],
    required: true
  },
  departments: [{
    type: String,
    trim: true
  }],
  timeZone: {
    type: String,
    required: true
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  isGovernmentRecognized: {
    type: Boolean,
    default: false
  },
  logo: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
organizationSchema.index({ email: 1 }, { unique: true });
organizationSchema.index({ orgCode: 1 }, { unique: true });
organizationSchema.index({ name: 1 });
organizationSchema.index({ status: 1 });

module.exports = mongoose.model('Organization', organizationSchema);


