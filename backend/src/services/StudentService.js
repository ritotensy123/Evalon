/**
 * StudentService
 * Service layer for student operations
 * Handles student CRUD operations and business logic
 */

const StudentRepository = require('../repositories/StudentRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

class StudentService {

  /**
   * Delete student by user ID
   * @param {string} userId - Student user ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If student not found
   */
  async deleteStudentByUserId(userId) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const student = await StudentRepository.findById(userId);
    if (!student) {
      throw AppError.notFound('Student not found');
    }

    await StudentRepository.deleteById(userId);

    return {
      success: true,
      message: 'Student deleted successfully'
    };
  }

  /**
   * Update student by user ID
   * @param {string} userId - Student user ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated student document
   * @throws {AppError} - If student not found
   */
  async updateStudentByUserId(userId, updates) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const student = await StudentRepository.findById(userId);
    if (!student) {
      throw AppError.notFound('Student not found');
    }

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.organizationId;
    delete updates.organization;
    delete updates.organizationCode;

    const updated = await StudentRepository.updateById(userId, updates);
    return updated;
  }

  /**
   * Get all students with filtering, pagination, and statistics
   * @param {Object} filters - Filter options (page, limit, search, grade, status, department)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Students with pagination and stats
   * @throws {AppError} - If validation fails
   */
  async getStudents(filters, organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const { page = 1, limit = 10, search = '', grade = '', status = '', department = '' } = filters;

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

    // Get students with pagination
    const students = await StudentRepository.findAll(filter, {
      populate: [
        { path: 'department', select: 'name departmentType' },
        { path: 'class', select: 'name' },
        { path: 'subjects', select: 'name' }
      ],
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await StudentRepository.count(filter);

    // Calculate statistics
    const stats = await StudentRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
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

    const distribution = await StudentRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      },
      stats: stats[0] || { total: 0, active: 0, newThisMonth: 0 },
      distribution
    };
  }

  /**
   * Get student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Student document
   * @throws {AppError} - If student not found
   */
  async getStudentById(studentId) {
    if (!studentId) {
      throw AppError.badRequest('Student ID is required');
    }

    const student = await StudentRepository.findById(studentId, {
      populate: [
        { path: 'department', select: 'name departmentType' },
        { path: 'class', select: 'name' },
        { path: 'subjects', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]
    });

    if (!student) {
      throw AppError.notFound('Student not found');
    }

    return student;
  }

  /**
   * Create a new student with auto-generated student ID
   * @param {Object} studentData - Student data
   * @param {string} organizationId - Organization ID
   * @param {string} createdBy - User ID who created the student
   * @returns {Promise<Object>} - Created student document
   * @throws {AppError} - If validation fails
   */
  async createStudent(studentData, organizationId, createdBy) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Generate unique student ID
    const studentCount = await StudentRepository.count({ organization: organizationId });
    const studentId = `STU${String(studentCount + 1).padStart(4, '0')}`;

    // Set organization fields
    studentData.studentId = studentId;
    studentData.organization = organizationId;
    studentData.createdBy = createdBy;

    // Create student
    const student = await StudentRepository.create(studentData);

    // Populate the created student
    const populatedStudent = await StudentRepository.findById(student._id, {
      populate: [
        { path: 'department', select: 'name departmentType' },
        { path: 'class', select: 'name' },
        { path: 'subjects', select: 'name' }
      ]
    });

    return populatedStudent;
  }

  /**
   * Update student by ID
   * @param {string} studentId - Student ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated student document
   * @throws {AppError} - If student not found
   */
  async updateStudent(studentId, updates) {
    if (!studentId) {
      throw AppError.badRequest('Student ID is required');
    }

    const student = await StudentRepository.findByIdAndUpdate(
      studentId,
      updates,
      {
        new: true,
        runValidators: true,
        populate: [
          { path: 'department', select: 'name departmentType' },
          { path: 'class', select: 'name' },
          { path: 'subjects', select: 'name' }
        ]
      }
    );

    if (!student) {
      throw AppError.notFound('Student not found');
    }

    return student;
  }

  /**
   * Delete student by ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If student not found
   */
  async deleteStudent(studentId) {
    if (!studentId) {
      throw AppError.badRequest('Student ID is required');
    }

    const student = await StudentRepository.deleteById(studentId);

    if (!student) {
      throw AppError.notFound('Student not found');
    }

    return { message: 'Student deleted successfully' };
  }

  /**
   * Get student statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Student statistics
   * @throws {AppError} - If validation fails
   */
  async getStudentStats(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const stats = await StudentRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
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

    const gradeDistribution = await StudentRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const departmentDistribution = await StudentRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      stats: stats[0] || { total: 0, active: 0, inactive: 0, graduated: 0, newThisMonth: 0 },
      gradeDistribution,
      departmentDistribution
    };
  }

  /**
   * Assign student to department
   * @param {string} studentId - Student ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Updated student document
   * @throws {AppError} - If validation fails
   */
  async assignToDepartment(studentId, departmentId) {
    if (!studentId) {
      throw AppError.badRequest('Student ID is required');
    }

    if (!departmentId) {
      throw AppError.badRequest('Department ID is required');
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw AppError.notFound('Student not found');
    }

    const updated = await StudentRepository.updateById(studentId, { department: departmentId });

    return {
      student: {
        id: updated._id,
        department: updated.department
      }
    };
  }

  /**
   * Remove student from department
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Updated student document
   * @throws {AppError} - If validation fails
   */
  async removeFromDepartment(studentId) {
    if (!studentId) {
      throw AppError.badRequest('Student ID is required');
    }

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw AppError.notFound('Student not found');
    }

    const updated = await StudentRepository.updateById(studentId, { department: null });

    return {
      student: {
        id: updated._id,
        department: updated.department
      }
    };
  }
}

module.exports = new StudentService();

