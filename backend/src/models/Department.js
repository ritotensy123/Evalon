const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
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
  
  // Organization Reference
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  
  // Hierarchical Structure
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  level: {
    type: Number,
    required: true,
    default: 0
  },
  path: {
    type: String,
    required: true
  },
  
  // Institution Type Configuration
  institutionType: {
    type: String,
    enum: ['school', 'college', 'university', 'institute'],
    required: true
  },
  
  // Department Type Configuration
  departmentType: {
    type: String,
    enum: ['department', 'sub-department', 'class', 'section'],
    required: true,
    default: 'department'
  },
  
  // For Schools - Class Configuration
  isClass: {
    type: Boolean,
    default: false
  },
  classLevel: {
    type: String,
    enum: {
      values: [null, 'pre-primary', 'primary', 'middle', 'secondary', 'senior-secondary'],
      message: 'Class level must be one of: pre-primary, primary, middle, secondary, senior-secondary'
    },
    default: null
  },
  standard: {
    type: String
  },
  section: {
    type: String,
    trim: true
  },
  
  // For Colleges - Academic Configuration
  academicType: {
    type: String,
    enum: ['academic', 'administrative', 'support', 'research'],
    default: 'academic'
  },
  specialization: {
    type: String,
    trim: true
  },
  
  // Academic Year/Semester (for colleges)
  academicYear: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    enum: {
      values: [null, '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'],
      message: 'Semester must be one of: 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th'
    },
    trim: true,
    default: null
  },
  
  // Batch Information
  batch: {
    type: String,
    trim: true
  },
  
  // Department Head/Coordinator
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  
  // Settings
  settings: {
    allowStudentEnrollment: {
      type: Boolean,
      default: true
    },
    allowTeacherAssignment: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxStudents: {
      type: Number,
      default: null
    },
    maxTeachers: {
      type: Number,
      default: null
    }
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
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
    totalSubjects: {
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
departmentSchema.index({ organizationId: 1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ code: 1, organizationId: 1 }, { unique: true });
departmentSchema.index({ path: 1 });
departmentSchema.index({ institutionType: 1 });
departmentSchema.index({ status: 1 });

// Virtual for full department name
departmentSchema.virtual('fullName').get(function() {
  return `${this.name} (${this.code})`;
});

// Virtual for department hierarchy level
departmentSchema.virtual('hierarchyLevel').get(function() {
  return this.path.split('/').length - 1;
});

// Method to get department hierarchy
departmentSchema.methods.getHierarchy = async function() {
  const hierarchy = [];
  let current = this;
  
  while (current) {
    hierarchy.unshift({
      id: current._id,
      name: current.name,
      code: current.code,
      level: current.level
    });
    
    if (current.parentDepartment) {
      current = await this.constructor.findById(current.parentDepartment);
    } else {
      current = null;
    }
  }
  
  return hierarchy;
};

// Method to get all child departments
departmentSchema.methods.getChildren = async function() {
  return this.constructor.find({
    parentDepartment: this._id,
    status: 'active'
  }).sort({ name: 1 });
};

// Method to get all descendants
departmentSchema.methods.getDescendants = async function() {
  const descendants = [];
  
  const findChildren = async (parentId) => {
    const children = await this.constructor.find({
      parentDepartment: parentId,
      status: 'active'
    });
    
    for (const child of children) {
      descendants.push(child);
      await findChildren(child._id);
    }
  };
  
  await findChildren(this._id);
  return descendants;
};

// Method to update path when parent changes
departmentSchema.methods.updatePath = async function() {
  if (this.parentDepartment) {
    const parent = await this.constructor.findById(this.parentDepartment);
    if (parent) {
      this.path = `${parent.path}/${this.code}`;
      this.level = parent.level + 1;
    } else {
      this.path = this.code;
      this.level = 0;
    }
  } else {
    this.path = this.code;
    this.level = 0;
  }
  
  // Update all children paths recursively
  const children = await this.getChildren();
  for (const child of children) {
    await child.updatePath();
    await child.save();
  }
};

// Static method to get department tree
departmentSchema.statics.getDepartmentTree = async function(organizationId) {
  const departments = await this.find({
    organizationId,
    status: 'active'
  }).sort({ level: 1, name: 1 });
  
  const buildTree = (parentId = null) => {
    return departments
      .filter(dept => {
        if (parentId === null) {
          return !dept.parentDepartment;
        }
        return dept.parentDepartment && dept.parentDepartment.toString() === parentId.toString();
      })
      .map(dept => ({
        ...dept.toObject(),
        children: buildTree(dept._id)
      }));
  };
  
  return buildTree();
};

// Pre-save middleware to update path and level
departmentSchema.pre('save', async function(next) {
  if (this.isModified('parentDepartment') || this.isModified('code') || this.isNew) {
    // Calculate path and level before saving
    if (this.parentDepartment) {
      const parent = await this.constructor.findById(this.parentDepartment);
      if (parent) {
        this.path = `${parent.path}/${this.code}`;
        this.level = parent.level + 1;
      } else {
        this.path = this.code;
        this.level = 0;
      }
    } else {
      this.path = this.code;
      this.level = 0;
    }
  }
  next();
});

// Method to get department summary
departmentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    description: this.description,
    institutionType: this.institutionType,
    departmentType: this.departmentType,
    isClass: this.isClass,
    classLevel: this.classLevel,
    standard: this.standard,
    section: this.section,
    academicType: this.academicType,
    specialization: this.specialization,
    academicYear: this.academicYear,
    semester: this.semester,
    batch: this.batch,
    level: this.level,
    path: this.path,
    status: this.status,
    stats: this.stats
  };
};

// Method to get department hierarchy path
departmentSchema.methods.getHierarchyPath = async function() {
  const path = [];
  let current = this;
  
  while (current) {
    path.unshift({
      id: current._id,
      name: current.name,
      code: current.code,
      type: current.departmentType
    });
    
    if (current.parentDepartment) {
      current = await this.constructor.findById(current.parentDepartment);
    } else {
      current = null;
    }
  }
  
  return path;
};

// Method to validate department hierarchy
departmentSchema.methods.validateHierarchy = async function() {
  const errors = [];
  
  // Check if parent department exists and is valid
  if (this.parentDepartment) {
    const parent = await this.constructor.findById(this.parentDepartment);
    if (!parent) {
      errors.push('Parent department not found');
    } else if (parent.institutionType !== this.institutionType) {
      errors.push('Parent department must be of the same institution type');
    } else if (parent.level >= 3) {
      errors.push('Maximum hierarchy depth exceeded (max 3 levels)');
    }
  }
  
  // Validate department type based on institution type
  if (this.institutionType === 'school') {
    if (this.departmentType === 'sub-department') {
      errors.push('Schools cannot have sub-departments');
    }
  } else if (this.institutionType === 'college') {
    // Classes in colleges can be standalone or under departments
    // No strict requirement for parent department
  }
  
  return errors;
};

module.exports = mongoose.model('Department', departmentSchema);
