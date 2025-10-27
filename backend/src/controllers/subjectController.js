const Subject = require('../models/Subject');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');

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
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if department exists
    const department = await Department.findOne({
      _id: departmentId,
      organizationId,
      status: 'active'
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found or inactive'
      });
    }

    // Check if subject code already exists in organization
    const existingSubject = await Subject.findOne({
      code: code.toUpperCase(),
      organizationId
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists in this organization'
      });
    }

    // Validate prerequisites if provided
    if (prerequisites && prerequisites.length > 0) {
      const prerequisiteSubjects = await Subject.find({
        _id: { $in: prerequisites },
        organizationId,
        status: 'active'
      });

      if (prerequisiteSubjects.length !== prerequisites.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more prerequisite subjects not found'
        });
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
        return res.status(400).json({
          success: false,
          message: 'Coordinator not found or inactive'
        });
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

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
        
        console.log('🎓 Teacher subject filtering:', {
          teacherId: teacher._id,
          departments: teacher.departments,
          effectiveDepartmentIds: Array.from(allDepartmentIds),
          requestedDepartmentId: departmentId
        });
      } else {
        // If teacher has no assigned departments, show all subjects in the organization
        // This allows teachers to see subjects even if they haven't been assigned to departments yet
        console.log('⚠️ Teacher has no assigned departments, showing all organization subjects');
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

    console.log('🔍 Subject query:', JSON.stringify(query, null, 2));
    
    // Validate organizationId exists
    if (!organizationId) {
      console.error('❌ No organizationId found for user:', { userId, userType });
      return res.status(400).json({
        success: false,
        message: 'User organization not found. Please contact administrator.',
        debug: { userId, userType, organizationId }
      });
    }
    
    const subjects = await Subject.find(query)
      .populate('departmentId', 'name code')
      .populate('coordinator', 'fullName emailAddress')
      .populate('prerequisites', 'name code')
      .sort({ name: 1 });

    console.log('📚 Found subjects:', subjects.length, subjects.map(s => ({ id: s._id, name: s.name, department: s.departmentId?.name })));

    // Log warning if no subjects found for teachers
    if (userType === 'teacher' && subjects.length === 0) {
      console.warn('⚠️ No subjects found for teacher:', {
        teacherId: userId,
        organizationId,
        departments: query.departmentId ? 'filtered by departments' : 'no department filter',
        totalSubjectsInOrg: await Subject.countDocuments({ organizationId })
      });
    }

    res.json({
      success: true,
      data: subjects,
      meta: {
        total: subjects.length,
        organizationId,
        userType,
        filteredByDepartments: userType === 'teacher' && query.departmentId
      }
    });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const subjects = await Subject.find({
      departmentId,
      status
    })
      .populate('coordinator', 'fullName emailAddress')
      .populate('prerequisites', 'name code')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        department: department.getSummary(),
        subjects
      }
    });

  } catch (error) {
    console.error('Error fetching subjects by department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Get teachers who can teach this subject
    const teachers = await Teacher.find({
      organizationId,
      status: 'active',
      subjects: { $elemMatch: { departmentId: subject.departmentId } }
    }).select('fullName emailAddress subjects role');

    res.json({
      success: true,
      data: {
        ...subject.toObject(),
        availableTeachers: teachers
      }
    });

  } catch (error) {
    console.error('Error fetching subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if code is being changed and if it conflicts
    if (updateData.code && updateData.code !== subject.code) {
      const existingSubject = await Subject.findOne({
        code: updateData.code.toUpperCase(),
        organizationId,
        _id: { $ne: id }
      });

      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject code already exists in this organization'
        });
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
        return res.status(400).json({
          success: false,
          message: 'Department not found or inactive'
        });
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
        return res.status(400).json({
          success: false,
          message: 'One or more prerequisite subjects not found'
        });
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

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });

  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if subject is a prerequisite for other subjects
    const dependentSubjects = await Subject.find({
      prerequisites: id,
      status: 'active'
    });

    if (dependentSubjects.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete subject as it is a prerequisite for other subjects',
        dependentSubjects: dependentSubjects.map(sub => ({
          id: sub._id,
          name: sub.name,
          code: sub.code
        }))
      });
    }

    // Soft delete by changing status
    subject.status = 'archived';
    await subject.save();

    // Update department statistics
    await updateDepartmentStats(organizationId);

    res.json({
      success: true,
      message: 'Subject archived successfully'
    });

  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
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

    res.json({
      success: true,
      message: 'Coordinator assigned to subject successfully',
      data: {
        subject: subject.getSummary(),
        coordinator: {
          id: teacher._id,
          name: teacher.fullName,
          email: teacher.emailAddress
        }
      }
    });

  } catch (error) {
    console.error('Error assigning coordinator:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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

    res.json({
      success: true,
      data: {
        totalSubjects,
        subjectsByCategory,
        subjectsByType,
        subjectsWithCoordinators,
        averageCredits: averageCredits[0]?.avgCredits || 0,
        coverage: {
          coordinators: Math.round((subjectsWithCoordinators / totalSubjects) * 100) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Error fetching subjects by category:', error);
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
    console.error('Error updating department stats:', error);
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
