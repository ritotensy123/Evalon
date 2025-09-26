const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
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
      isClass,
      classLevel,
      standard,
      section,
      departmentType,
      specialization,
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

    // Check if department code already exists in organization
    const existingDepartment = await Department.findOne({
      code: code.toUpperCase(),
      organizationId
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists in this organization'
      });
    }

    // Validate parent department if provided
    if (cleanParentDepartment) {
      const parent = await Department.findOne({
        _id: cleanParentDepartment,
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
      isClass,
      classLevel: cleanClassLevel,
      standard: cleanStandard,
      section: cleanSection,
      departmentType,
      specialization: cleanSpecialization,
      headOfDepartment: cleanHeadOfDepartment,
      coordinator: cleanCoordinator,
      level: 0, // Will be calculated
      path: name.toLowerCase().replace(/\s+/g, '-'), // Will be updated
      settings: settings || {}
    });

    await department.save();

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
      error: error.message
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
    const { includeArchived = false } = req.query;

    let query = { organizationId };
    
    if (!includeArchived) {
      query.status = 'active';
    }

    const departments = await Department.find(query)
      .populate('parentDepartment', 'name code')
      .populate('headOfDepartment', 'fullName emailAddress')
      .populate('coordinator', 'fullName emailAddress')
      .sort({ level: 1, name: 1 });

    // Build tree structure
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
          children: buildTree(dept._id)
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

    // Update teacher's subjects to include this department
    if (!teacher.subjects) {
      teacher.subjects = [];
    }

    // Add department reference to teacher's subjects if not already present
    const departmentRef = {
      departmentId: departmentId,
      role: role,
      assignedAt: new Date()
    };

    const existingRef = teacher.subjects.find(sub => 
      sub.departmentId && sub.departmentId.toString() === departmentId
    );

    if (!existingRef) {
      teacher.subjects.push(departmentRef);
      await teacher.save();
    }

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

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentTree,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  assignTeacher,
  getDepartmentStats
};
