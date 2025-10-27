const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Organization = require('../models/Organization');

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      parentDepartment,
      institutionType,
      departmentType,
      isClass,
      classLevel,
      standard,
      section,
      academicType,
      specialization,
      academicYear,
      semester,
      batch,
      headOfDepartment,
      coordinator,
      settings
    } = req.body;


    const organizationId = req.user.organizationId;


    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Clean up empty strings for ObjectId fields
    const cleanParentDepartment = parentDepartment === '' ? null : parentDepartment;
    const cleanHeadOfDepartment = headOfDepartment === '' ? null : headOfDepartment;
    const cleanCoordinator = coordinator === '' ? null : coordinator;
    const cleanClassLevel = classLevel === '' ? null : classLevel;
    const cleanStandard = standard === '' ? null : standard;
    const cleanSection = section === '' ? null : section;
    const cleanSpecialization = specialization === '' ? null : specialization;
    const cleanAcademicYear = academicYear === '' ? null : academicYear;
    const cleanSemester = semester === '' ? null : semester;
    const cleanBatch = batch === '' ? null : batch;

    // Check if department code already exists in organization
    const existingDepartment = await Department.findOne({
      code: code.toUpperCase(),
      organizationId
    });

    if (existingDepartment) {
      console.error('Department code already exists:', code);
      return res.status(400).json({
        success: false,
        message: 'Department code already exists in this organization',
        code: code
      });
    }

    // Validate parent department if provided
    if (cleanParentDepartment) {
      try {
        const parent = await Department.findOne({
          _id: cleanParentDepartment,
          organizationId,
          status: 'active'
        });

        if (!parent) {
          console.error('Parent department not found:', cleanParentDepartment);
          return res.status(400).json({
            success: false,
            message: 'Parent department not found or inactive',
            parentDepartment: cleanParentDepartment
          });
        }
      } catch (error) {
        console.error('Error validating parent department:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid parent department ID',
          parentDepartment: cleanParentDepartment
        });
      }
    }

    // Validate head of department if provided
    if (cleanHeadOfDepartment) {
      const teacher = await Teacher.findOne({
        _id: cleanHeadOfDepartment,
        organizationId,
        status: 'active'
      });

      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Head of department not found or inactive'
        });
      }
    }

    // Validate coordinator if provided
    if (cleanCoordinator) {
      const teacher = await Teacher.findOne({
        _id: cleanCoordinator,
        organizationId,
        status: 'active'
      });

      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: 'Coordinator not found or inactive'
        });
      }
    }

    // Create department
    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      organizationId,
      parentDepartment: cleanParentDepartment,
      institutionType: institutionType || organization.institutionStructure,
      departmentType: departmentType || 'department',
      isClass,
      classLevel: cleanClassLevel,
      standard: cleanStandard,
      section: cleanSection,
      academicType: academicType || 'academic',
      specialization: cleanSpecialization,
      academicYear: cleanAcademicYear,
      semester: cleanSemester,
      batch: cleanBatch,
      headOfDepartment: cleanHeadOfDepartment,
      coordinator: cleanCoordinator,
      level: 0, // Will be calculated by pre-save middleware
      path: code.toUpperCase(), // Will be updated by pre-save middleware
      settings: settings || {}
    });

    // Validate hierarchy before saving
    const hierarchyErrors = await department.validateHierarchy();
    if (hierarchyErrors.length > 0) {
      console.error('Hierarchy validation failed:', hierarchyErrors);
      return res.status(400).json({
        success: false,
        message: 'Hierarchy validation failed',
        errors: hierarchyErrors
      });
    }

    await department.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    // Populate references
    await department.populate([
      { path: 'parentDepartment', select: 'name code' },
      { path: 'headOfDepartment', select: 'fullName emailAddress' },
      { path: 'coordinator', select: 'fullName emailAddress' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });

  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: error.stack
    });
  }
};

// Get all departments for organization
const getDepartments = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status = 'active', includeArchived = false } = req.query;

    let query = { organizationId };
    
    if (!includeArchived) {
      query.status = status;
    }

    const departments = await Department.find(query)
      .populate('parentDepartment', 'name code')
      .populate('headOfDepartment', 'fullName emailAddress')
      .populate('coordinator', 'fullName emailAddress')
      .sort({ level: 1, name: 1 });

    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get department tree structure
const getDepartmentTree = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { includeArchived = false, institutionType } = req.query;

    let query = { organizationId };
    
    if (!includeArchived) {
      query.status = 'active';
    }

    if (institutionType) {
      query.institutionType = institutionType;
    }

    const departments = await Department.find(query)
      .populate('parentDepartment', 'name code departmentType')
      .populate('headOfDepartment', 'fullName emailAddress')
      .populate('coordinator', 'fullName emailAddress')
      .sort({ level: 1, departmentType: 1, name: 1 });

    // Build tree structure with enhanced information
    const buildTree = (parentId = null) => {
      return departments
        .filter(dept => {
          if (parentId === null) {
            return !dept.parentDepartment;
          }
          return dept.parentDepartment && dept.parentDepartment._id.toString() === parentId.toString();
        })
        .map(dept => ({
          ...dept.toObject(),
          children: buildTree(dept._id),
          hierarchyPath: dept.path,
          displayName: getDisplayName(dept)
        }));
    };

    const tree = buildTree();

    res.json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error('Error fetching department tree:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to get display name based on department type
const getDisplayName = (dept) => {
  if (!dept) return 'Unknown Department';
  
  const baseName = dept.name || 'Unnamed Department';
  
  switch (dept.departmentType) {
    case 'class':
      // For classes, prioritize standard + section, fallback to name
      if (dept.standard) {
        return `${dept.standard}${dept.section ? ` - ${dept.section}` : ''}`;
      }
      return baseName;
    case 'section':
      // For sections, show name with section info
      return `${baseName}${dept.section ? ` (${dept.section})` : ''}`;
    case 'sub-department':
      // For sub-departments, show name with specialization
      return `${baseName}${dept.specialization ? ` (${dept.specialization})` : ''}`;
    case 'department':
    default:
      return baseName;
  }
};

// Get single department
const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      _id: id,
      organizationId
    })
      .populate('parentDepartment', 'name code')
      .populate('headOfDepartment', 'fullName emailAddress phoneNumber')
      .populate('coordinator', 'fullName emailAddress phoneNumber');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get children departments
    const children = await Department.find({
      parentDepartment: id,
      status: 'active'
    }).select('name code description level');

    // Get subjects in this department
    const subjects = await Subject.find({
      departmentId: id,
      status: 'active'
    }).select('name code subjectType category credits');

    // Get teachers in this department
    const teachers = await Teacher.find({
      organizationId,
      status: 'active',
      'subjects.departmentId': id
    }).select('fullName emailAddress subjects role');

    res.json({
      success: true,
      data: {
        ...department.toObject(),
        children,
        subjects,
        teachers
      }
    });

  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update department
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const department = await Department.findOne({
      _id: id,
      organizationId
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if code is being changed and if it conflicts
    if (updateData.code && updateData.code !== department.code) {
      const existingDepartment = await Department.findOne({
        code: updateData.code.toUpperCase(),
        organizationId,
        _id: { $ne: id }
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists in this organization'
        });
      }
    }

    // Validate parent department if being changed
    if (updateData.parentDepartment && updateData.parentDepartment !== department.parentDepartment?.toString()) {
      if (updateData.parentDepartment === id) {
        return res.status(400).json({
          success: false,
          message: 'Department cannot be its own parent'
        });
      }

      const parent = await Department.findOne({
        _id: updateData.parentDepartment,
        organizationId,
        status: 'active'
      });

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: 'Parent department not found or inactive'
        });
      }
    }

    // Update department
    Object.assign(department, updateData);
    await department.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    // Populate references
    await department.populate([
      { path: 'parentDepartment', select: 'name code' },
      { path: 'headOfDepartment', select: 'fullName emailAddress' },
      { path: 'coordinator', select: 'fullName emailAddress' }
    ]);

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });

  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete department
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      _id: id,
      organizationId
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has children
    const children = await Department.find({
      parentDepartment: id,
      status: 'active'
    });

    if (children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active child departments'
      });
    }

    // Check if department has subjects
    const subjects = await Subject.find({
      departmentId: id,
      status: 'active'
    });

    if (subjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with active subjects'
      });
    }

    // Soft delete by changing status
    department.status = 'archived';
    await department.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    res.json({
      success: true,
      message: 'Department archived successfully'
    });

  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Assign teacher to department
const assignTeacher = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { teacherId, role } = req.body;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      _id: departmentId,
      organizationId,
      status: 'active'
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      organizationId,
      status: 'active'
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update department based on role
    if (role === 'head') {
      department.headOfDepartment = teacherId;
    } else if (role === 'coordinator') {
      department.coordinator = teacherId;
    }

    await department.save();

    // Update teacher's departments array
    if (!teacher.departments) {
      teacher.departments = [];
    }

    // Add department to teacher's departments if not already present
    const departmentExists = teacher.departments.some(
      dept => dept.toString() === departmentId
    );

    if (!departmentExists) {
      teacher.departments.push(departmentId);
      await teacher.save();
    }

    // Update department statistics
    await updateDepartmentStats(organizationId);

    res.json({
      success: true,
      message: 'Teacher assigned to department successfully',
      data: {
        department: department.getSummary(),
        teacher: {
          id: teacher._id,
          name: teacher.fullName,
          email: teacher.emailAddress,
          role: role
        }
      }
    });

  } catch (error) {
    console.error('Error assigning teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get department statistics
const getDepartmentStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const totalDepartments = await Department.countDocuments({
      organizationId,
      status: 'active'
    });

    const totalSubjects = await Subject.countDocuments({
      organizationId,
      status: 'active'
    });

    const totalTeachers = await Teacher.countDocuments({
      organizationId,
      status: 'active'
    });

    const departmentsWithHeads = await Department.countDocuments({
      organizationId,
      status: 'active',
      headOfDepartment: { $exists: true, $ne: null }
    });

    const departmentsWithCoordinators = await Department.countDocuments({
      organizationId,
      status: 'active',
      coordinator: { $exists: true, $ne: null }
    });

    res.json({
      success: true,
      data: {
        totalDepartments,
        totalSubjects,
        totalTeachers,
        departmentsWithHeads,
        departmentsWithCoordinators,
        coverage: {
          heads: Math.round((departmentsWithHeads / totalDepartments) * 100) || 0,
          coordinators: Math.round((departmentsWithCoordinators / totalDepartments) * 100) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to update department statistics
const updateDepartmentStats = async (organizationId) => {
  try {
    const departments = await Department.find({ organizationId, status: 'active' });
    
    for (const department of departments) {
      // Count subjects in this department
      const subjectCount = await Subject.countDocuments({
        departmentId: department._id,
        status: 'active'
      });

      // Count teachers assigned to this department
      const teacherCount = await Teacher.countDocuments({
        organizationId,
        status: 'active',
        'subjects.departmentId': department._id
      });

      // Count students in this department (if applicable)
      const studentCount = await Student.countDocuments({
        organizationId,
        department: department._id,
        status: 'active'
      });

      // Update department stats
      department.stats = {
        totalSubjects: subjectCount,
        totalTeachers: teacherCount,
        totalStudents: studentCount
      };

      await department.save();
    }
  } catch (error) {
    console.error('Error updating department stats:', error);
  }
};

// Get department hierarchy path
const getDepartmentHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const department = await Department.findOne({
      _id: id,
      organizationId
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const hierarchyPath = await department.getHierarchyPath();

    res.json({
      success: true,
      data: hierarchyPath
    });

  } catch (error) {
    console.error('Error fetching department hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get departments by type
const getDepartmentsByType = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { departmentType, institutionType } = req.query;

    let query = { organizationId, status: 'active' };
    
    if (departmentType) {
      query.departmentType = departmentType;
    }
    
    if (institutionType) {
      query.institutionType = institutionType;
    }

    const departments = await Department.find(query)
      .populate('parentDepartment', 'name code departmentType')
      .populate('headOfDepartment', 'fullName emailAddress')
      .populate('coordinator', 'fullName emailAddress')
      .sort({ level: 1, name: 1 });

    res.json({
      success: true,
      data: departments
    });

  } catch (error) {
    console.error('Error fetching departments by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentTree,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  assignTeacher,
  getDepartmentStats,
  getDepartmentHierarchy,
  getDepartmentsByType
};
