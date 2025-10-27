const Student = require('../models/Student');
const Department = require('../models/Department');
const Subject = require('../models/Subject');

// Get all students with filtering and pagination
const getStudents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      grade = '', 
      status = '', 
      department = '' 
    } = req.query;

    const organizationId = req.user.organizationId || req.user.organization;
    
    console.log('📚 Student Controller - getStudents called');
    console.log('📚 User object:', {
      id: req.user.id,
      email: req.user.email,
      userType: req.user.userType,
      organization: req.user.organization,
      organizationId: req.user.organizationId
    });
    console.log('📚 Organization ID (using organizationId || organization):', organizationId);
    console.log('📚 Query params:', { page, limit, search, grade, status, department });

    // Build filter object
    const filter = { organization: organizationId };
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (grade) filter.grade = grade;
    if (status) filter.status = status;
    if (department) filter.department = department;

    console.log('📚 Filter object:', filter);
    
    const students = await Student.find(filter)
      .populate('department', 'name departmentType')
      .populate('class', 'name')
      .populate('subjects', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);
    
    console.log('📚 Found students:', students.length);
    console.log('📚 Total students in database:', total);
    if (students.length > 0) {
      console.log('📚 Sample student:', {
        id: students[0]._id,
        firstName: students[0].firstName,
        lastName: students[0].lastName,
        email: students[0].email,
        organization: students[0].organization
      });
    }

    // Calculate statistics
    const stats = await Student.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          newThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const distribution = await Student.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      students,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      },
      stats: stats[0] || { total: 0, active: 0, newThisMonth: 0 },
      distribution
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('department', 'name departmentType')
      .populate('class', 'name')
      .populate('subjects', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || req.user.organization;
    
    // Generate unique student ID
    const studentCount = await Student.countDocuments({ organization: organizationId });
    const studentId = `STU${String(studentCount + 1).padStart(4, '0')}`;

    const studentData = {
      ...req.body,
      studentId,
      organization: organizationId,
      createdBy: req.user.id
    };

    const student = new Student(studentData);
    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate('department', 'name departmentType')
      .populate('class', 'name')
      .populate('subjects', 'name');

    res.status(201).json(populatedStudent);
  } catch (error) {
    console.error('Error creating student:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Student with this email or student ID already exists' });
    } else {
      res.status(500).json({ message: 'Error creating student', error: error.message });
    }
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department', 'name departmentType')
     .populate('class', 'name')
     .populate('subjects', 'name');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Error updating student', error: error.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const organizationId = req.user.organizationId || req.user.organization;

    const stats = await Student.aggregate([
      { $match: { organization: organizationId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          graduated: { $sum: { $cond: [{ $eq: ['$status', 'graduated'] }, 1, 0] } },
          newThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const gradeDistribution = await Student.aggregate([
      { $match: { organization: organizationId } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const departmentDistribution = await Student.aggregate([
      { $match: { organization: organizationId } },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      stats: stats[0] || { total: 0, active: 0, inactive: 0, graduated: 0, newThisMonth: 0 },
      gradeDistribution,
      departmentDistribution
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Error fetching student statistics', error: error.message });
  }
};

// Assign student to department
const assignToDepartment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { departmentId } = req.body;

    console.log('🎯 Assigning student to department:', { studentId, departmentId });

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Update the student's department
    student.department = departmentId;
    await student.save();

    console.log('✅ Student assigned to department successfully');

    res.json({
      success: true,
      message: 'Student assigned to department successfully',
      data: {
        student: {
          id: student._id,
          department: student.department
        }
      }
    });

  } catch (error) {
    console.error('Error assigning student to department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign student to department',
      error: error.message
    });
  }
};

// Remove student from department
const removeFromDepartment = async (req, res) => {
  try {
    const { studentId, departmentId } = req.params;

    console.log('🎯 Removing student from department:', { studentId, departmentId });

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove the department assignment
    student.department = null;
    await student.save();

    console.log('✅ Student removed from department successfully');

    res.json({
      success: true,
      message: 'Student removed from department successfully',
      data: {
        student: {
          id: student._id,
          department: student.department
        }
      }
    });

  } catch (error) {
    console.error('Error removing student from department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from department',
      error: error.message
    });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  // Department assignment
  assignToDepartment,
  removeFromDepartment
};