const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Organization and Department Reference
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  
  // Subject Classification
  subjectType: {
    type: String,
    enum: ['core', 'elective', 'practical', 'theory', 'project', 'internship'],
    default: 'core'
  },
  category: {
    type: String,
    trim: true
    // No enum - allows custom categories
    // No required - makes it optional
  },
  
  // Academic Configuration
  credits: {
    type: Number,
    min: 0,
    max: 10,
    default: 1
  },
  hoursPerWeek: {
    type: Number,
    min: 0,
    max: 40,
    default: 1
  },
  duration: {
    type: String,
    enum: ['semester', 'annual', 'quarterly', 'monthly'],
    default: 'semester'
  },
  
  // For Schools - Grade/Class Configuration
  applicableGrades: [{
    type: String,
    trim: true
  }],
  applicableStandards: [{
    type: String,
    trim: true
  }],
  
  // For Colleges - Course Configuration
  applicableSemesters: [{
    type: String,
    trim: true
  }],
  applicableYears: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Subject Coordinator
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  
  // Assessment Configuration
  assessment: {
    hasTheory: {
      type: Boolean,
      default: true
    },
    hasPractical: {
      type: Boolean,
      default: false
    },
    hasProject: {
      type: Boolean,
      default: false
    },
    hasInternship: {
      type: Boolean,
      default: false
    },
    theoryMarks: {
      type: Number,
      default: 100
    },
    practicalMarks: {
      type: Number,
      default: 0
    },
    projectMarks: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      default: 100
    }
  },
  
  // Settings
  settings: {
    allowMultipleTeachers: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    allowStudentEnrollment: {
      type: Boolean,
      default: true
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'draft'],
    default: 'active'
  },
  
  // Statistics
  stats: {
    totalTeachers: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    totalClasses: {
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
subjectSchema.index({ organizationId: 1 });
subjectSchema.index({ departmentId: 1 });
subjectSchema.index({ code: 1, organizationId: 1 }, { unique: true });
subjectSchema.index({ category: 1 });
subjectSchema.index({ subjectType: 1 });
subjectSchema.index({ status: 1 });
subjectSchema.index({ coordinator: 1 });

// Virtual for full subject name
subjectSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Method to get subject details with department info
subjectSchema.methods.getDetails = async function() {
  await this.populate('departmentId', 'name code');
  await this.populate('coordinator', 'fullName emailAddress');
  
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    subjectType: this.subjectType,
    category: this.category,
    credits: this.credits,
    hoursPerWeek: this.hoursPerWeek,
    duration: this.duration,
    department: this.departmentId,
    coordinator: this.coordinator,
    assessment: this.assessment,
    settings: this.settings,
    status: this.status,
    stats: this.stats
  };
};

// Method to get applicable grades/standards
subjectSchema.methods.getApplicableLevels = function() {
  if (this.applicableGrades.length > 0) {
    return {
      type: 'grades',
      values: this.applicableGrades
    };
  } else if (this.applicableStandards.length > 0) {
    return {
      type: 'standards',
      values: this.applicableStandards
    };
  } else if (this.applicableSemesters.length > 0) {
    return {
      type: 'semesters',
      values: this.applicableSemesters
    };
  } else if (this.applicableYears.length > 0) {
    return {
      type: 'years',
      values: this.applicableYears
    };
  }
  return null;
};

// Method to check if subject is applicable to a specific level
subjectSchema.methods.isApplicableTo = function(level, type) {
  switch (type) {
    case 'grade':
      return this.applicableGrades.includes(level);
    case 'standard':
      return this.applicableStandards.includes(level);
    case 'semester':
      return this.applicableSemesters.includes(level);
    case 'year':
      return this.applicableYears.includes(level);
    default:
      return false;
  }
};

// Static method to get subjects by department
subjectSchema.statics.getByDepartment = function(departmentId, status = 'active') {
  return this.find({
    departmentId,
    status
  }).sort({ name: 1 });
};

// Static method to get subjects by category
subjectSchema.statics.getByCategory = function(organizationId, category, status = 'active') {
  return this.find({
    organizationId,
    category,
    status
  }).sort({ name: 1 });
};

// Static method to get subjects by type
subjectSchema.statics.getByType = function(organizationId, subjectType, status = 'active') {
  return this.find({
    organizationId,
    subjectType,
    status
  }).sort({ name: 1 });
};

// Method to get subject summary
subjectSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    subjectType: this.subjectType,
    category: this.category,
    credits: this.credits,
    hoursPerWeek: this.hoursPerWeek,
    duration: this.duration,
    status: this.status,
    stats: this.stats
  };
};

module.exports = mongoose.model('Subject', subjectSchema);
