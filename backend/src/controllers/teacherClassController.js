const TeacherClass = require('../models/TeacherClass');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Organization = require('../models/Organization');

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

    console.log('🎓 Creating teacher class - req.user:', {
      userId: req.user.id,
      teacherId: req.user.userId,
      userType: req.user.userType,
      organizationId: req.user.organizationId
    });

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      console.error('❌ Teacher not found:', teacherId);
      return res.status(404).json({
        success: false,
        message: 'Teacher not found or inactive'
      });
    }

    // If organizationId is not set, get it from teacher
    const orgId = organizationId || teacher.organization;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization not found'
      });
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
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Check if class code already exists
    const existingClass = await TeacherClass.findOne({
      classCode: classCode.toUpperCase(),
      organizationId: orgId
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class code already exists'
      });
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

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: teacherClass
    });

  } catch (error) {
    console.error('Error creating teacher class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all classes for a teacher
const getTeacherClasses = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    // Get teacher to find their organization
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
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

    res.json({
      success: true,
      data: teacherClasses
    });

  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Get organizationId from teacher object
    const organizationId = teacher.organization;
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher is not assigned to any organization'
      });
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

    console.log('🔍 Fetching students with:', {
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

    console.log('✅ Raw students query result:', {
      count: students.length,
      students: students.map(s => ({ name: `${s.firstName} ${s.lastName}`, dept: s.department?.toString() }))
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

    console.log('🎓 Available students for teacher:', {
      teacherId: teacherId.toString(),
      departmentIds: departmentIdsArray,
      studentCount: studentsWithDeptInfo.length
    });

    res.json({
      success: true,
      data: studentsWithDeptInfo
    });

  } catch (error) {
    console.error('Error fetching available students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this class'
      });
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

    res.json({
      success: true,
      message: 'Students added to class successfully',
      data: teacherClass
    });

  } catch (error) {
    console.error('Error adding students to class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this class'
      });
    }

    await teacherClass.removeStudent(studentId);

    res.json({
      success: true,
      message: 'Student removed from class successfully',
      data: teacherClass
    });

  } catch (error) {
    console.error('Error removing student from class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: teacherClass
    });

  } catch (error) {
    console.error('Error fetching teacher class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this class'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'teacherId' && key !== 'organizationId') {
        teacherClass[key] = updates[key];
      }
    });

    await teacherClass.save();

    await teacherClass.populate('students.studentId', 'firstName lastName email studentId');

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: teacherClass
    });

  } catch (error) {
    console.error('Error updating teacher class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete class
const deleteTeacherClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const teacherClass = await TeacherClass.findById(classId);

    if (!teacherClass) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify teacher owns this class
    if (teacherClass.teacherId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this class'
      });
    }

    await TeacherClass.deleteOne({ _id: classId });

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting teacher class:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
