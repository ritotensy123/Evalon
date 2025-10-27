const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  // Basic Information
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
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  
  // Professional Information
  employeeId: {
    type: String,
    unique: true,
    required: true
  },
  teacherRole: {
    type: String,
    enum: ['teacher', 'head_teacher', 'coordinator', 'principal'],
    default: 'teacher'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  
  // Experience and Qualifications
  experience: {
    type: String,
    enum: ['0-2 years', '3-5 years', '6-10 years', '11-15 years', '16+ years'],
    default: '0-2 years'
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  
  // Schedule Information
  workingHours: {
    type: Number,
    default: 40
  },
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String,
    subject: String,
    class: String
  }],
  
  // Performance Metrics
  workload: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  performanceRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Status and Dates
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  terminationDate: {
    type: Date
  },
  
  // System Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
teacherSchema.index({ email: 1 });
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ organization: 1 });
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ status: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);