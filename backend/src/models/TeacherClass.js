const mongoose = require('mongoose');

const teacherClassSchema = new mongoose.Schema({
  // Basic Information
  className: {
    type: String,
    required: true,
    trim: true
  },
  classCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Reference to Teacher
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  
  // Reference to Department (where the teacher is assigned)
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false  // Optional - students can be from multiple departments
  },
  
  // Reference to Organization
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  
  // Subject Information
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  subjectName: {
    type: String,
    trim: true
  },
  
  // Assigned Students
  students: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'dropped'],
      default: 'active'
    }
  }],
  
  // Schedule Information
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: String,
    endTime: String,
    room: String
  }],
  
  // Academic Information
  academicYear: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    trim: true
  },
  
  // Settings
  settings: {
    allowSelfEnrollment: {
      type: Boolean,
      default: false
    },
    maxStudents: {
      type: Number,
      default: null
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'completed'],
    default: 'active'
  },
  
  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalAssignments: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
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

// Indexes for better performance
teacherClassSchema.index({ teacherId: 1 });
teacherClassSchema.index({ departmentId: 1 });
teacherClassSchema.index({ organizationId: 1 });
teacherClassSchema.index({ classCode: 1 });
teacherClassSchema.index({ status: 1 });

// Update stats when students are added/removed
teacherClassSchema.pre('save', function(next) {
  this.stats.totalStudents = this.students.filter(s => s.status === 'active').length;
  this.updatedAt = Date.now();
  next();
});

// Virtual for student count
teacherClassSchema.virtual('studentCount').get(function() {
  return this.students.filter(s => s.status === 'active').length;
});

// Method to check if student is enrolled
teacherClassSchema.methods.isStudentEnrolled = function(studentId) {
  return this.students.some(
    s => s.studentId.toString() === studentId.toString() && s.status === 'active'
  );
};

// Method to add student
teacherClassSchema.methods.addStudent = function(studentId) {
  if (!this.isStudentEnrolled(studentId)) {
    this.students.push({
      studentId,
      enrolledAt: new Date(),
      status: 'active'
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove student
teacherClassSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(
    s => s.studentId.toString() !== studentId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('TeacherClass', teacherClassSchema);
