const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
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
  
  // Academic Information
  studentId: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  studentCode: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Parent/Guardian Information
  parentName: {
    type: String,
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true
  },
  parentPhone: {
    type: String,
    trim: true
  },
  parentRelationship: {
    type: String,
    default: 'Parent'
  },
  emergencyContact: {
    type: Boolean,
    default: false
  },
  
  // Academic Performance
  averageGrade: {
    type: String,
    default: 'N/A'
  },
  attendanceRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Status and Dates
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred'],
    default: 'active'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  graduationDate: {
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
studentSchema.index({ email: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ organization: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ organization: 1, status: 1 }); // Composite for org + status queries
studentSchema.index({ organization: 1, department: 1 }); // Composite for org + department queries
studentSchema.index({ createdAt: -1 }); // For sorting by newest

module.exports = mongoose.model('Student', studentSchema);