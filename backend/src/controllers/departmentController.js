const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { logger } = require('../utils/logger');

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
      return sendError(res, new Error('Organization not found'), 'Organization not found', HTTP_STATUS.NOT_FOUND);
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
      logger.error('Department code already exists', { code, organizationId });
      return sendError(res, new Error('Department code already exists in this organization'), 'Department code already exists in this organization', HTTP_STATUS.BAD_REQUEST);
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
          logger.error('Parent department not found', { parentDepartment: cleanParentDepartment, organizationId });
          return sendError(res, new Error('Parent department not found or inactive'), 'Parent department not found or inactive', HTTP_STATUS.BAD_REQUEST);
        }
      } catch (error) {
        logger.error('Error validating parent department', { error: error.message, parentDepartment: cleanParentDepartment });
        return sendError(res, new Error('Invalid parent department ID'), 'Invalid parent department ID', HTTP_STATUS.BAD_REQUEST);
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
        return sendError(res, new Error('Head of department not found or inactive'), 'Head of department not found or inactive', HTTP_STATUS.BAD_REQUEST);
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
        return sendError(res, new Error('Coordinator not found or inactive'), 'Coordinator not found or inactive', HTTP_STATUS.BAD_REQUEST);
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
      logger.error('Hierarchy validation failed', { hierarchyErrors });
      return sendError(res, new Error('Hierarchy validation failed'), 'Hierarchy validation failed', HTTP_STATUS.BAD_REQUEST);
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

    sendSuccess(res, department, 'Department created successfully', HTTP_STATUS.CREATED);

  } catch (error) {
    logger.error('Error creating department', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error creating department', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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

    sendSuccess(res, departments, 'Departments retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching departments', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching departments', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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

    sendSuccess(res, tree, 'Department tree retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching department tree', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching department tree', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
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

    sendSuccess(res, {
      ...department.toObject(),
      children,
      subjects,
      teachers
    }, 'Department retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching department', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching department', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if code is being changed and if it conflicts
    if (updateData.code && updateData.code !== department.code) {
      const existingDepartment = await Department.findOne({
        code: updateData.code.toUpperCase(),
        organizationId,
        _id: { $ne: id }
      });

      if (existingDepartment) {
        return sendError(res, new Error('Department code already exists in this organization'), 'Department code already exists in this organization', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Validate parent department if being changed
    if (updateData.parentDepartment && updateData.parentDepartment !== department.parentDepartment?.toString()) {
      if (updateData.parentDepartment === id) {
        return sendError(res, new Error('Department cannot be its own parent'), 'Department cannot be its own parent', HTTP_STATUS.BAD_REQUEST);
      }

      const parent = await Department.findOne({
        _id: updateData.parentDepartment,
        organizationId,
        status: 'active'
      });

      if (!parent) {
        return sendError(res, new Error('Parent department not found or inactive'), 'Parent department not found or inactive', HTTP_STATUS.BAD_REQUEST);
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

    sendSuccess(res, department, 'Department updated successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error updating department', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error updating department', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if department has children
    const children = await Department.find({
      parentDepartment: id,
      status: 'active'
    });

    if (children.length > 0) {
      return sendError(res, new Error('Cannot delete department with active child departments'), 'Cannot delete department with active child departments', HTTP_STATUS.BAD_REQUEST);
    }

    // Check if department has subjects
    const subjects = await Subject.find({
      departmentId: id,
      status: 'active'
    });

    if (subjects.length > 0) {
      return sendError(res, new Error('Cannot delete department with active subjects'), 'Cannot delete department with active subjects', HTTP_STATUS.BAD_REQUEST);
    }

    // Soft delete by changing status
    department.status = 'archived';
    await department.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    sendSuccess(res, null, 'Department archived successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error deleting department', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error deleting department', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      organizationId,
      status: 'active'
    });

    if (!teacher) {
      return sendError(res, new Error('Teacher not found'), 'Teacher not found', HTTP_STATUS.NOT_FOUND);
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

    sendSuccess(res, {
      department: department.getSummary(),
      teacher: {
        id: teacher._id,
        name: teacher.fullName,
        email: teacher.emailAddress,
        role: role
      }
    }, 'Teacher assigned to department successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error assigning teacher', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error assigning teacher', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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

    sendSuccess(res, {
      totalDepartments,
      totalSubjects,
      totalTeachers,
      departmentsWithHeads,
      departmentsWithCoordinators,
      coverage: {
        heads: Math.round((departmentsWithHeads / totalDepartments) * 100) || 0,
        coordinators: Math.round((departmentsWithCoordinators / totalDepartments) * 100) || 0
      }
    }, 'Department statistics retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching department stats', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching department stats', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
    logger.error('Error updating department stats', { error: error.message, stack: error.stack });
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
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
    }

    const hierarchyPath = await department.getHierarchyPath();

    sendSuccess(res, hierarchyPath, 'Department hierarchy retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching department hierarchy', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching department hierarchy', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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

    sendSuccess(res, departments, 'Departments retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching departments by type', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching departments by type', HTTP_STATUS.INTERNAL_SERVER_ERROR);
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
