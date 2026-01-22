const TeacherClass = require('../models/TeacherClass');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Organization = require('../models/Organization');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { logger } = require('../utils/logger');

// Create a new teacher class
const createTeacherClass = async (req, res) => {
  try {
    const {
      className,
      classCode,
      description,
      departmentId,
      subjectId,
      academicYear,
      semester,
      studentIds,
      schedule,
      settings
    } = req.body;

    const organizationId = req.user.organizationId;
    const userId = req.user.id; // Get user ID from authenticated user
    const teacherId = req.user.userId; // Get teacher model ID

    logger.debug('Creating teacher class', { userType: req.user.userType, requestId: req.id });

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      logger.error('Teacher not found', { teacherId, requestId: req.id });
      return sendError(res, new Error('Teacher not found or inactive'), 'Teacher not found or inactive', HTTP_STATUS.NOT_FOUND);
    }

    // If organizationId is not set, get it from teacher
    const orgId = organizationId || teacher.organization;
    
    if (!orgId) {
      return sendError(res, new Error('Organization not found'), 'Organization not found', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify department exists if provided
    let department = null;
    if (departmentId && departmentId !== '' && departmentId !== null) {
      department = await Department.findOne({
        _id: departmentId,
        organizationId: orgId,
        status: 'active'
      });

      if (!department) {
        return sendError(res, new Error('Department not found'), 'Department not found', HTTP_STATUS.NOT_FOUND);
      }
    }

    // Check if class code already exists
    const existingClass = await TeacherClass.findOne({
      classCode: classCode.toUpperCase(),
      organizationId: orgId
    });

    if (existingClass) {
      return sendError(res, new Error('Class code already exists'), 'Class code already exists', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify subject if provided
    let subjectName = null;
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        subjectName = subject.name;
      }
    }

    // Verify students if provided
    let students = [];
    if (studentIds && studentIds.length > 0) {
      // Build query for students
      const studentQuery = {
        _id: { $in: studentIds },
        organization: orgId,
        status: 'active'
      };
      
      // If departmentId is provided, filter by it; otherwise allow students from teacher's departments
      if (departmentId) {
        studentQuery.department = departmentId;
      } else {
        // Filter by teacher's assigned departments
        if (teacher.departments && teacher.departments.length > 0) {
          // Get all department IDs including hierarchy
          const allDepartmentIds = new Set();
          
          for (const deptId of teacher.departments) {
            allDepartmentIds.add(deptId.toString());
            
            const dept = await Department.findById(deptId);
            if (dept) {
              const hierarchyPath = await dept.getHierarchyPath();
              hierarchyPath.forEach(dept => allDepartmentIds.add(dept.id.toString()));
            }
          }
          
          studentQuery.department = { $in: Array.from(allDepartmentIds) };
        }
      }

      const validStudents = await Student.find(studentQuery);

      students = validStudents.map(student => ({
        studentId: student._id,
        enrolledAt: new Date(),
        status: 'active'
      }));
    }

    // Create the class
    const teacherClass = new TeacherClass({
      className,
      classCode: classCode.toUpperCase(),
      description,
      teacherId,
      departmentId: departmentId || null,
      organizationId: orgId,
      subjectId: subjectId || null,
      subjectName,
      academicYear,
      semester,
      students,
      schedule: schedule || [],
      settings: settings || {
        allowSelfEnrollment: false,
        maxStudents: null,
        requireApproval: false
      },
      status: 'active'
    });

    await teacherClass.save();

    // Populate references
    await teacherClass.populate([
      { path: 'teacherId', select: 'firstName lastName email' },
      { path: 'departmentId', select: 'name code' },
      { path: 'subjectId', select: 'name code' },
      { path: 'students.studentId', select: 'firstName lastName email studentId' }
    ]);

    sendSuccess(res, teacherClass, 'Class created successfully', HTTP_STATUS.CREATED);

  } catch (error) {
    logger.error('Error creating teacher class', { error: error.message, stack: error.stack, requestId: req.id });
    sendError(res, error, 'Error creating teacher class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get all classes for a teacher
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    // Get teacher to find their organization
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return sendError(res, new Error('Teacher not found'), 'Teacher not found', HTTP_STATUS.NOT_FOUND);
    }

    const organizationId = teacher.organization;
    const { status = 'active' } = req.query;

    const teacherClasses = await TeacherClass.find({
      teacherId,
      organizationId,
      status
    })
      .populate('departmentId', 'name code')
      .populate('subjectId', 'name code')
      .populate('students.studentId', 'firstName lastName email studentId')
      .sort({ createdAt: -1 });

    sendSuccess(res, teacherClasses, 'Teacher classes retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching teacher classes', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching teacher classes', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get students available for class assignment from teacher's departments
const getAvailableStudents = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const teacherId = req.user.userId;

    // Get teacher to find their assigned departments and organization
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return sendError(res, new Error('Teacher not found'), 'Teacher not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get organizationId from teacher object
    const organizationId = teacher.organization;
    if (!organizationId) {
      return sendError(res, new Error('Teacher is not assigned to any organization'), 'Teacher is not assigned to any organization', HTTP_STATUS.BAD_REQUEST);
    }

    // Get all department IDs that teacher is assigned to (including hierarchy)
    const allDepartmentIds = new Set();
    
    // Add the specified department
    if (departmentId && departmentId !== 'all') {
      allDepartmentIds.add(departmentId.toString());
      
      // Get hierarchy for the specified department
      const department = await Department.findById(departmentId);
      if (department) {
        const hierarchyPath = await department.getHierarchyPath();
        hierarchyPath.forEach(dept => allDepartmentIds.add(dept.id.toString()));
      }
    }

    // Also add departments from teacher's departments array
    if (teacher.departments && teacher.departments.length > 0) {
      for (const deptId of teacher.departments) {
        allDepartmentIds.add(deptId.toString());
        
        // Get hierarchy for each department
        const dept = await Department.findById(deptId);
        if (dept) {
          const hierarchyPath = await dept.getHierarchyPath();
          hierarchyPath.forEach(dept => allDepartmentIds.add(dept.id.toString()));
        }
      }
    }

    const departmentIdsArray = Array.from(allDepartmentIds);

    logger.debug('Fetching students', {
      organizationId: organizationId.toString(),
      departmentIdsArray,
      departmentCount: departmentIdsArray.length
    });

    // Get all students from these departments
    const students = await Student.find({
      organization: organizationId,
      department: { $in: departmentIdsArray },
      status: 'active'
    }).select('firstName lastName email studentId grade section department');

    logger.debug('Students query result', {
      count: students.length
    });

    // Add department info to each student
    const studentsWithDeptInfo = await Promise.all(students.map(async (student) => {
      const studentObj = student.toObject();
      const studentDept = await Department.findById(student.department);
      if (studentDept) {
        studentObj.departmentName = studentDept.name;
        studentObj.departmentCode = studentDept.code;
      }
      return studentObj;
    }));

    logger.info('🎓 Available students for teacher', {
      teacherId: teacherId.toString(),
      departmentIds: departmentIdsArray,
      studentCount: studentsWithDeptInfo.length
    });

    sendSuccess(res, studentsWithDeptInfo, 'Available students retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching available students', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching available students', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Add students to a class
const addStudentsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return sendError(res, new Error('You do not have permission to modify this class'), 'You do not have permission to modify this class', HTTP_STATUS.FORBIDDEN);
    }

    // Get valid students from the department
    const validStudents = await Student.find({
      _id: { $in: studentIds },
      organization: teacherClass.organizationId,
      department: teacherClass.departmentId,
      status: 'active'
    });

    // Add students to class
    for (const student of validStudents) {
      if (!teacherClass.isStudentEnrolled(student._id)) {
        await teacherClass.addStudent(student._id);
      }
    }

    // Refresh the class data
    await teacherClass.populate('students.studentId', 'firstName lastName email studentId');

    sendSuccess(res, teacherClass, 'Students added to class successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error adding students to class', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error adding students to class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return sendError(res, new Error('Class not found'), 'Class not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return sendError(res, new Error('You do not have permission to modify this class'), 'You do not have permission to modify this class', HTTP_STATUS.FORBIDDEN);
    }

    await teacherClass.removeStudent(studentId);

    sendSuccess(res, teacherClass, 'Student removed from class successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error removing student from class', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error removing student from class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Get single class with details
const getTeacherClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const teacherClass = await TeacherClass.findById(classId)
      .populate('teacherId', 'firstName lastName email')
      .populate('departmentId', 'name code')
      .populate('subjectId', 'name code')
      .populate('students.studentId', 'firstName lastName email studentId grade section');

    if (!teacherClass) {
      return sendError(res, new Error('Class not found'), 'Class not found', HTTP_STATUS.NOT_FOUND);
    }

    sendSuccess(res, teacherClass, 'Teacher class retrieved successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error fetching teacher class', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error fetching teacher class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Update class
const updateTeacherClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const updates = req.body;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return sendError(res, new Error('You do not have permission to modify this class'), 'You do not have permission to modify this class', HTTP_STATUS.FORBIDDEN);
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'teacherId' && key !== 'organizationId') {
        teacherClass[key] = updates[key];
      }
    });

    await teacherClass.save();

    await teacherClass.populate('students.studentId', 'firstName lastName email studentId');

    sendSuccess(res, teacherClass, 'Class updated successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error updating teacher class', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error updating teacher class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Delete class
const deleteTeacherClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return sendError(res, new Error('Class not found'), 'Class not found', HTTP_STATUS.NOT_FOUND);
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return sendError(res, new Error('You do not have permission to delete this class'), 'You do not have permission to delete this class', HTTP_STATUS.FORBIDDEN);
    }

    await TeacherClass.deleteOne({ _id: classId });

    sendSuccess(res, null, 'Class deleted successfully', HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Error deleting teacher class', { error: error.message, stack: error.stack });
    sendError(res, error, 'Error deleting teacher class', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  createTeacherClass,
  getTeacherClasses,
  getTeacherClass,
  updateTeacherClass,
  deleteTeacherClass,
  getAvailableStudents,
  addStudentsToClass,
  removeStudentFromClass
};
