const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { logger } = require('../utils/logger');

// Create a new subject
const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      departmentId,
      subjectType,
      category,
      credits,
      hoursPerWeek,
      duration,
      applicableGrades,
      applicableStandards,
      applicableSemesters,
      applicableYears,
      prerequisites,
      coordinator,
      assessment,
      settings
    } = req.body;

    const organizationId = req.user.organizationId;

    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return sendError(res, new Error('Organization not found'), 'Organization not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if department exists
    const department = await Department.findOne({
      _id: departmentId,
      organizationId,
      status: 'active'
    });

    if (!department) {
      return sendError(res, new Error('Department not found or inactive'), 'Department not found or inactive', HTTP_STATUS.NOT_FOUND);
    }

    // Check if subject code already exists in organization
    const existingSubject = await Subject.findOne({
      code: code.toUpperCase(),
      organizationId
    });

    if (existingSubject) {
      return sendError(res, new Error('Subject code already exists in this organization'), 'Subject code already exists in this organization', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate prerequisites if provided
    if (prerequisites && prerequisites.length > 0) {
      const prerequisiteSubjects = await Subject.find({
        _id: { $in: prerequisites },
        organizationId,
        status: 'active'
      });

      if (prerequisiteSubjects.length !== prerequisites.length) {
        return sendError(res, new Error('One or more prerequisite subjects not found'), 'One or more prerequisite subjects not found', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Validate coordinator if provided
    if (coordinator) {
      const teacher = await Teacher.findOne({
        _id: coordinator,
        organizationId,
        status: 'active'
      });

      if (!teacher) {
        return sendError(res, new Error('Coordinator not found or inactive'), 'Coordinator not found or inactive', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Create subject
    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      description,
      organizationId,
      departmentId,
      subjectType: subjectType || 'core',
      category: category || undefined, // Allow empty category
      credits: credits || 1,
      hoursPerWeek: hoursPerWeek || 1,
      duration: duration || 'semester',
      applicableGrades,
      applicableStandards,
      applicableSemesters,
      applicableYears,
      prerequisites: prerequisites && prerequisites.length > 0 ? prerequisites : undefined,
      coordinator: coordinator && coordinator !== '' ? coordinator : undefined,
      assessment: assessment || {
        hasTheory: true,
        hasPractical: false,
        hasProject: false,
        hasInternship: false,
        theoryMarks: 100,
        practicalMarks: 0,
        projectMarks: 0,
        totalMarks: 100
      },
      settings: settings || {}
    });

    await subject.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    // Populate references
    await subject.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'coordinator', select: 'fullName emailAddress' },
      { path: 'prerequisites', select: 'name code' }
    ]);

    sendSuccess(res, subject, 'Subject created successfully', HTTP_STATUS.CREATED);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error creating subject', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error creating subject', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get all subjects for organization
const getSubjects = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const userType = req.user.userType;
    const { 
      status = 'active', 
      departmentId, 
      category, 
      subjectType,
      includeArchived = false 
    } = req.query;

    let query = { organizationId };
    
    if (!includeArchived) {
      query.status = status;
    }

    // If user is a teacher, filter subjects based on their assigned departments (including parent departments)
    if (userType === 'teacher') {
      // Get teacher to find their assigned departments
      const Teacher = require('../models/Teacher');
      const teacher = await Teacher.findOne({ _id: req.user.userId });
      
      if (teacher && teacher.departments && teacher.departments.length > 0) {
        // Get all departments assigned to the teacher, including hierarchy
        const allDepartmentIds = new Set();
        
        for (const deptId of teacher.departments) {
          const Department = require('../models/Department');
          const currentDepartment = await Department.findById(deptId);
          if (currentDepartment) {
            const hierarchyPath = await currentDepartment.getHierarchyPath();
            hierarchyPath.forEach(dept => allDepartmentIds.add(dept.id.toString()));
          }
        }
        
        // If a specific departmentId is provided, filter subjects only from that department's hierarchy
        if (departmentId) {
          const Department = require('../models/Department');
          const specificDepartment = await Department.findById(departmentId);
          if (specificDepartment) {
            const specificHierarchyPath = await specificDepartment.getHierarchyPath();
            const specificDepartmentIds = new Set(specificHierarchyPath.map(dept => dept.id.toString()));
            // Intersect with teacher's departments to ensure teacher is authorized
            const authorizedDepartmentIds = new Set([...allDepartmentIds].filter(id => specificDepartmentIds.has(id)));
            allDepartmentIds.clear();
            authorizedDepartmentIds.forEach(id => allDepartmentIds.add(id));
          } else {
            // If specific department not found, no subjects can be returned
            allDepartmentIds.clear();
          }
        }
        
        // Filter subjects by department IDs
        query.departmentId = { $in: Array.from(allDepartmentIds) };
        
        const { logger } = require('../utils/logger');
        logger.debug('Teacher subject filtering', {
          teacherId: teacher._id,
          departments: teacher.departments,
          effectiveDepartmentIds: Array.from(allDepartmentIds),
          requestedDepartmentId: departmentId
        });
      } else {
        // If teacher has no assigned departments, show all subjects in the organization
        // This allows teachers to see subjects even if they haven't been assigned to departments yet
        const { logger } = require('../utils/logger');
        logger.warn('Teacher has no assigned departments, showing all organization subjects');
        // Don't add departmentId filter, so all subjects in the organization are returned
      }
    } else if (departmentId) {
      // For non-teachers, just filter by the specified department
      query.departmentId = departmentId;
    }

    if (category) {
      query.category = category;
    }

    if (subjectType) {
      query.subjectType = subjectType;
    }

    const { logger } = require('../utils/logger');
    logger.debug('Subject query', { query });
    
    // Validate organizationId exists
    if (!organizationId) {
      const { logger } = require('../utils/logger');
      logger.error('No organizationId found for user', { userId, userType, organizationId });
      return sendError(res, new Error('User organization not found'), 'User organization not found. Please contact administrator.', HTTP_STATUS.BAD_REQUEST);
    }
    
    const subjects = await Subject.find(query)
      .populate('departmentId', 'name code')
      .populate('coordinator', 'fullName emailAddress')
      .populate('prerequisites', 'name code')
      .sort({ name: 1 });

    logger.info('📚 Found subjects', { count: subjects.length, subjects: subjects.map(s => ({ id: s._id, name: s.name, department: s.departmentId?.name })) });

    // Log warning if no subjects found for teachers
    if (userType === 'teacher' && subjects.length === 0) {
      const { logger } = require('../utils/logger');
      logger.warn('No subjects found for teacher', {
        teacherId: userId,
        organizationId,
        departments: query.departmentId ? 'filtered by departments' : 'no department filter',
        totalSubjectsInOrg: await Subject.countDocuments({ organizationId })
      });
    }

    sendSuccess(res, subjects, 'Subjects retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error fetching subjects', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching subjects', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get subjects by department
const getSubjectsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const organizationId = req.user.organizationId;
    const { status = 'active' } = req.query;

    // Verify department exists and belongs to organization
    const department = await Department.findOne({
      _id: departmentId,
      organizationId,
      status: 'active'
    });

    if (!department) {
      return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
    }

    const subjects = await Subject.find({
      departmentId,
      status
    })
      .populate('coordinator', 'fullName emailAddress')
      .populate('prerequisites', 'name code')
      .sort({ name: 1 });

    sendSuccess(res, {
      department: department.getSummary(),
      subjects
    }, 'Subjects retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error fetching subjects by department', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching subjects by department', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get single subject
const getSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const subject = await Subject.findOne({
      _id: id,
      organizationId
    })
      .populate('departmentId', 'name code description')
      .populate('coordinator', 'fullName emailAddress phoneNumber')
      .populate('prerequisites', 'name code description');

    if (!subject) {
      return sendError(res, new Error('Subject not found'), 'Subject not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get teachers who can teach this subject
    const teachers = await Teacher.find({
      organizationId,
      status: 'active',
      subjects: { $elemMatch: { departmentId: subject.departmentId } }
    }).select('fullName emailAddress subjects role');

    sendSuccess(res, {
      ...subject.toObject(),
      availableTeachers: teachers
    }, 'Subject retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error fetching subject', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching subject', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Update subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    const subject = await Subject.findOne({
      _id: id,
      organizationId
    });

    if (!subject) {
      return sendError(res, new Error('Subject not found'), 'Subject not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if code is being changed and if it conflicts
    if (updateData.code && updateData.code !== subject.code) {
      const existingSubject = await Subject.findOne({
        code: updateData.code.toUpperCase(),
        organizationId,
        _id: { $ne: id }
      });

      if (existingSubject) {
        return sendError(res, new Error('Subject code already exists in this organization'), 'Subject code already exists in this organization', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Validate department if being changed
    if (updateData.departmentId && updateData.departmentId !== subject.departmentId?.toString()) {
      const department = await Department.findOne({
        _id: updateData.departmentId,
        organizationId,
        status: 'active'
      });

      if (!department) {
        return sendError(res, new Error('Department not found or inactive'), 'Department not found or inactive', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Validate prerequisites if being changed
    if (updateData.prerequisites && updateData.prerequisites.length > 0) {
      const prerequisiteSubjects = await Subject.find({
        _id: { $in: updateData.prerequisites },
        organizationId,
        status: 'active'
      });

      if (prerequisiteSubjects.length !== updateData.prerequisites.length) {
        return sendError(res, new Error('One or more prerequisite subjects not found'), 'One or more prerequisite subjects not found', HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Convert empty strings to null for ObjectId fields
    if (updateData.coordinator === '') {
      updateData.coordinator = null;
    }
    if (updateData.departmentId === '') {
      updateData.departmentId = null;
    }

    // Update subject
    Object.assign(subject, updateData);
    await subject.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    // Populate references
    await subject.populate([
      { path: 'departmentId', select: 'name code' },
      { path: 'coordinator', select: 'fullName emailAddress' },
      { path: 'prerequisites', select: 'name code' }
    ]);

    sendSuccess(res, subject, 'Subject updated successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error updating subject', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error updating subject', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Delete subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const subject = await Subject.findOne({
      _id: id,
      organizationId
    });

    if (!subject) {
      return sendError(res, new Error('Subject not found'), 'Subject not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if subject is a prerequisite for other subjects
    const dependentSubjects = await Subject.find({
      prerequisites: id,
      status: 'active'
    });

    if (dependentSubjects.length > 0) {
      return sendError(res, new Error('Cannot delete subject as it is a prerequisite for other subjects'), 'Cannot delete subject as it is a prerequisite for other subjects', HTTP_STATUS.BAD_REQUEST);
    }

    // Soft delete by changing status
    subject.status = 'archived';
    await subject.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    sendSuccess(res, null, 'Subject archived successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error deleting subject', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error deleting subject', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Assign coordinator to subject
const assignCoordinator = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { teacherId } = req.body;
    const organizationId = req.user.organizationId;

    const subject = await Subject.findOne({
      _id: subjectId,
      organizationId,
      status: 'active'
    });

    if (!subject) {
      return sendError(res, new Error('Subject not found'), 'Subject not found', HTTP_STATUS.NOT_FOUND);
    }

    const teacher = await Teacher.findOne({
      _id: teacherId,
      organizationId,
      status: 'active'
    });

    if (!teacher) {
      return sendError(res, new Error('Teacher not found'), 'Teacher not found', HTTP_STATUS.NOT_FOUND);
    }

    // Update subject coordinator
    subject.coordinator = teacherId;
    await subject.save();

    // Update teacher's subjects to include this subject
    if (!teacher.subjects) {
      teacher.subjects = [];
    }

    // Add subject reference to teacher's subjects if not already present
    const subjectRef = {
      subjectId: subjectId,
      role: 'coordinator',
      assignedAt: new Date()
    };

    const existingRef = teacher.subjects.find(sub => 
      sub.subjectId && sub.subjectId.toString() === subjectId
    );

    if (!existingRef) {
      teacher.subjects.push(subjectRef);
      await teacher.save();
    }

    sendSuccess(res, {
      subject: subject.getSummary(),
      coordinator: {
        id: teacher._id,
        name: teacher.fullName,
        email: teacher.emailAddress
      }
    }, 'Coordinator assigned to subject successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error assigning coordinator', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error assigning coordinator', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get subject statistics
const getSubjectStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const totalSubjects = await Subject.countDocuments({
      organizationId,
      status: 'active'
    });

    const subjectsByCategory = await Subject.aggregate([
      { $match: { organizationId, status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const subjectsByType = await Subject.aggregate([
      { $match: { organizationId, status: 'active' } },
      { $group: { _id: '$subjectType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const subjectsWithCoordinators = await Subject.countDocuments({
      organizationId,
      status: 'active',
      coordinator: { $exists: true, $ne: null }
    });

    const averageCredits = await Subject.aggregate([
      { $match: { organizationId, status: 'active' } },
      { $group: { _id: null, avgCredits: { $avg: '$credits' } } }
    ]);

    sendSuccess(res, {
      totalSubjects,
      subjectsByCategory,
      subjectsByType,
      subjectsWithCoordinators,
      averageCredits: averageCredits[0]?.avgCredits || 0,
      coverage: {
        coordinators: Math.round((subjectsWithCoordinators / totalSubjects) * 100) || 0
      }
    }, 'Subject statistics retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error fetching subject stats', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching subject stats', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get subjects by category
const getSubjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const organizationId = req.user.organizationId;
    const { status = 'active' } = req.query;

    const subjects = await Subject.find({
      organizationId,
      category,
      status
    })
      .populate('departmentId', 'name code')
      .populate('coordinator', 'fullName emailAddress')
      .sort({ name: 1 });

    sendSuccess(res, subjects, 'Subjects retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    const { logger } = require('../utils/logger');
    logger.error('Error fetching subjects by category', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching subjects by category', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Helper function to update department statistics
const updateDepartmentStats = async (organizationId) => {
  try {
    const Department = require('../models/Department');
    const departments = await Department.find({ organizationId, status: 'active' });
    
    for (const department of departments) {
      // Count subjects in this department
      const subjectCount = await Subject.countDocuments({
        departmentId: department._id,
        status: 'active'
      });

      // Count teachers assigned to this department
      const Teacher = require('../models/Teacher');
      const teacherCount = await Teacher.countDocuments({
        organizationId,
        status: 'active',
        'subjects.departmentId': department._id
      });

      // Count students in this department (if applicable)
      const Student = require('../models/Student');
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
    const { logger } = require('../utils/logger');
    logger.error('Error updating department stats', { error: error.message, stack: error.stack });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  getSubjectsByDepartment,
  getSubject,
  updateSubject,
  deleteSubject,
  assignCoordinator,
  getSubjectStats,
  getSubjectsByCategory
};
