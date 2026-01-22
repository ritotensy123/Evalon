/**
 * TeacherService
 * Service layer for teacher operations
 * Handles teacher CRUD operations and business logic
 */

const TeacherRepository = require('../repositories/TeacherRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

class TeacherService {

  /**
   * Delete teacher by user ID
   * @param {string} userId - Teacher user ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If teacher not found
   */
  async deleteTeacherByUserId(userId) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const teacher = await TeacherRepository.findById(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    await TeacherRepository.deleteById(userId);

    return {
      success: true,
      message: 'Teacher deleted successfully'
    };
  }

  /**
   * Update teacher by user ID
   * @param {string} userId - Teacher user ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated teacher document
   * @throws {AppError} - If teacher not found
   */
  async updateTeacherByUserId(userId, updates) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const teacher = await TeacherRepository.findById(userId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.organizationId;
    delete updates.organization;
    delete updates.organizationCode;

    const updated = await TeacherRepository.updateById(userId, updates);
    return updated;
  }

  /**
   * Get all teachers with filtering, pagination, and statistics
   * @param {Object} filters - Filter options (page, limit, search, status, department)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Teachers with pagination and stats
   * @throws {AppError} - If validation fails
   */
  async getTeachers(filters, organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const { page = 1, limit = 10, search = '', status = '', department = '' } = filters;

    // Build filter object
    const filter = { organization: organizationId };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) filter.status = status;
    if (department) filter.department = department;

    // Get teachers with pagination
    const teachers = await TeacherRepository.findAll(filter, {
      populate: [
        { path: 'departments', select: 'name departmentType' },
        { path: 'subjects', select: 'name' }
      ],
      sort: { createdAt: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await TeacherRepository.count(filter);

    // Calculate statistics
    const stats = await TeacherRepository.aggregate([
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

    const distribution = await TeacherRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return {
      teachers,
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
   * Get teacher by ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} - Teacher document
   * @throws {AppError} - If teacher not found
   */
  async getTeacherById(teacherId) {
    if (!teacherId) {
      throw AppError.badRequest('Teacher ID is required');
    }

    const teacher = await TeacherRepository.findById(teacherId, {
      populate: [
        { path: 'departments', select: 'name departmentType' },
        { path: 'subjects', select: 'name' },
        { path: 'createdBy', select: 'firstName lastName' }
      ]
    });

    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    return teacher;
  }

  /**
   * Create a new teacher with auto-generated employee ID
   * @param {Object} teacherData - Teacher data
   * @param {string} organizationId - Organization ID
   * @param {string} createdBy - User ID who created the teacher
   * @returns {Promise<Object>} - Created teacher document
   * @throws {AppError} - If validation fails
   */
  async createTeacher(teacherData, organizationId, createdBy) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Set organization fields
    teacherData.organization = organizationId;
    teacherData.organizationId = organizationId;
    if (createdBy) {
      teacherData.createdBy = createdBy;
    }

    // Create teacher
    const teacher = await TeacherRepository.create(teacherData);

    // Populate the created teacher
    const populatedTeacher = await TeacherRepository.findById(teacher._id, {
      populate: [
        { path: 'departments', select: 'name departmentType' },
        { path: 'subjects', select: 'name' }
      ]
    });

    return populatedTeacher;
  }

  /**
   * Update teacher by ID
   * @param {string} teacherId - Teacher ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated teacher document
   * @throws {AppError} - If teacher not found
   */
  async updateTeacher(teacherId, updates) {
    if (!teacherId) {
      throw AppError.badRequest('Teacher ID is required');
    }

    const updated = await TeacherRepository.updateById(teacherId, updates);

    if (!updated) {
      throw AppError.notFound('Teacher not found');
    }

    // Populate the updated teacher
    const populatedTeacher = await TeacherRepository.findById(updated._id, {
      populate: [
        { path: 'departments', select: 'name departmentType' },
        { path: 'subjects', select: 'name' }
      ]
    });

    return populatedTeacher;
  }

  /**
   * Delete teacher by ID
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If teacher not found
   */
  async deleteTeacher(teacherId) {
    if (!teacherId) {
      throw AppError.badRequest('Teacher ID is required');
    }

    const teacher = await TeacherRepository.deleteById(teacherId);

    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    return { message: 'Teacher deleted successfully' };
  }

  /**
   * Get teacher statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Teacher statistics
   * @throws {AppError} - If validation fails
   */
  async getTeacherStats(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const stats = await TeacherRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
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

    const departmentDistribution = await TeacherRepository.aggregate([
      { $match: { organization: mongoose.Types.ObjectId(organizationId) } },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $group: { _id: '$dept.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return {
      stats: stats[0] || { total: 0, active: 0, inactive: 0, newThisMonth: 0 },
      departmentDistribution
    };
  }

  /**
   * Assign teacher to department
   * @param {string} teacherId - Teacher ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} - Updated teacher document
   * @throws {AppError} - If validation fails
   */
  async assignToDepartment(teacherId, departmentId) {
    if (!teacherId) {
      throw AppError.badRequest('Teacher ID is required');
    }

    if (!departmentId) {
      throw AppError.badRequest('Department ID is required');
    }

    const teacher = await TeacherRepository.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }
    
    const departments = teacher.departments || [];
    if (!departments.includes(departmentId)) {
      departments.push(departmentId);
    }
    
    const updated = await TeacherRepository.updateById(teacherId, { departments });

    return {
      teacher: {
        id: updated._id,
        departments: updated.departments
      }
    };
  }

  /**
   * Remove teacher from department
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} - Updated teacher document
   * @throws {AppError} - If validation fails
   */
  /**
   * Remove teacher from department
   * @param {string} teacherId - Teacher ID
   * @param {string} departmentId - Department ID to remove (optional, if not provided removes all)
   * @returns {Promise<Object>} - Updated teacher document
   * @throws {AppError} - If validation fails
   */
  async removeFromDepartment(teacherId, departmentId = null) {
    if (!teacherId) {
      throw AppError.badRequest('Teacher ID is required');
    }

    const teacher = await TeacherRepository.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }
    
    let departments;
    if (departmentId) {
      // Remove specific department
      departments = (teacher.departments || []).filter(
        deptId => deptId.toString() !== departmentId.toString()
      );
    } else {
      // Remove all departments
      departments = [];
    }
    
    const updated = await TeacherRepository.updateById(teacherId, { departments });

    return {
      teacher: {
        id: updated._id,
        departments: updated.departments
      }
    };
  }
}

module.exports = new TeacherService();
