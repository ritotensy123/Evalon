/**
 * TeacherRepository
 * Repository layer for teacher data access
 * Handles all Teacher model database operations
 */

const Teacher = require('../models/Teacher');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class TeacherRepository {
  /**
   * Create a new teacher
   * @param {Object} teacherData - Teacher data object
   * @returns {Promise<Object>} - Created teacher document
   */
  async create(teacherData) {
    try {
      const teacher = new Teacher(teacherData);
      return await teacher.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('Teacher with this email or employee ID already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Teacher validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create teacher: ${error.message}`);
    }
  }

  /**
   * Find teacher by ID
   * @param {string} id - Teacher ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Teacher document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid teacher ID format');
      }

      let query = Teacher.findById(id);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => {
            query = query.populate(pop);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.select) {
        query = query.select(options.select);
      }

      return await query.exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find teacher: ${error.message}`);
    }
  }

  /**
   * Find a single teacher matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Teacher document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Teacher.findOne(filter);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => {
            query = query.populate(pop);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.select) {
        query = query.select(options.select);
      }

      return await query.exec();
    } catch (error) {
      throw AppError.internal(`Failed to find teacher: ${error.message}`);
    }
  }

  /**
   * Find all teachers matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Teacher.find(filter);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach(pop => {
            query = query.populate(pop);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.limit) {
        query = query.limit(parseInt(options.limit));
      }

      if (options.skip) {
        query = query.skip(parseInt(options.skip));
      }

      return await query.exec();
    } catch (error) {
      throw AppError.internal(`Failed to find teachers: ${error.message}`);
    }
  }

  /**
   * Update teacher by ID
   * @param {string} id - Teacher ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated teacher document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid teacher ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const teacher = await Teacher.findByIdAndUpdate(id, updates, updateOptions);
      return teacher;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('Teacher with this identifier already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Teacher validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update teacher: ${error.message}`);
    }
  }

  /**
   * Delete teacher by ID
   * @param {string} id - Teacher ID
   * @returns {Promise<Object|null>} - Deleted teacher document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid teacher ID format');
      }

      return await Teacher.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete teacher: ${error.message}`);
    }
  }

  /**
   * Find teachers by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findByOrganization(organizationId, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      const filter = { organization: organizationId };
      return await this.findAll(filter, options);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find teachers by organization: ${error.message}`);
    }
  }

  /**
   * Check if teacher exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if teacher exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await Teacher.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check teacher existence: ${error.message}`);
    }
  }

  /**
   * Count teachers matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching teachers
   */
  async count(filter = {}) {
    try {
      return await Teacher.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count teachers: ${error.message}`);
    }
  }

  /**
   * Get teacher load
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Teacher load data
   */
  async getTeacherLoad(organizationId) {
    return {
      success: false,
      message: 'TODO: getTeacherLoad not implemented yet'
    };
  }

  /**
   * Get teacher statistics
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} - Teacher statistics
   */
  async getTeacherStatistics(teacherId) {
    return {
      success: false,
      message: 'TODO: getTeacherStatistics not implemented yet'
    };
  }

  /**
   * Get teachers by department
   * @param {string} departmentId - Department ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Teachers data
   */
  async getTeachersByDepartment(departmentId, organizationId) {
    return {
      success: false,
      message: 'TODO: getTeachersByDepartment not implemented yet'
    };
  }

  /**
   * Find teachers by user IDs
   * @param {Array} userIds - Array of user IDs
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findTeachersByUserIds(userIds, organizationId) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      const filter = {
        _id: { $in: userIds },
        organization: organizationId
      };

      return await this.findAll(filter, {
        select: 'firstName lastName email phoneNumber subjects role organizationName yearsOfExperience status departments organization createdAt'
      });
    } catch (error) {
      throw AppError.internal(`Failed to find teachers by user IDs: ${error.message}`);
    }
  }

  /**
   * Find teachers with filter, pagination, and sorting
   * @param {Object} filter - MongoDB filter object
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} sorting - Sorting options (field, order)
   * @returns {Promise<Object>} - { teachers, total, pagination }
   */
  async findTeachers(filter = {}, pagination = {}, sorting = {}) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 10;
      const skip = (page - 1) * limit;

      const sortField = sorting.field || 'firstName';
      const sortOrder = sorting.order === 'desc' ? -1 : 1;
      const sort = { [sortField]: sortOrder };

      const [teachers, total] = await Promise.all([
        Teacher.find(filter)
          .select(pagination.select || 'firstName lastName emailAddress subjects role organizationName yearsOfExperience status')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .exec(),
        Teacher.countDocuments(filter)
      ]);

      return {
        teachers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      };
    } catch (error) {
      throw AppError.internal(`Failed to find teachers: ${error.message}`);
    }
  }

  /**
   * Search teachers by keyword
   * @param {string} keyword - Search keyword
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of matching teacher documents
   */
  async searchTeachers(keyword, organizationId) {
    try {
      if (!keyword) {
        return [];
      }

        const searchRegex = { $regex: keyword, $options: 'i' };
      const filter = {
        organization: organizationId,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      };

      return await Teacher.find(filter)
        .select('firstName lastName email subjects role organizationName yearsOfExperience status')
        .sort({ firstName: 1 })
        .limit(100)
        .exec();
    } catch (error) {
      throw AppError.internal(`Failed to search teachers: ${error.message}`);
    }
  }

  /**
   * Find teachers by department
   * @param {string} departmentId - Department ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findByDepartment(departmentId, organizationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        throw AppError.badRequest('Invalid department ID format');
      }

      const filter = {
        departments: departmentId,
        organization: organizationId
      };

      return await Teacher.find(filter)
        .select('firstName lastName email subjects role organizationName yearsOfExperience status departments')
        .sort({ firstName: 1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find teachers by department: ${error.message}`);
    }
  }

  /**
   * Find teachers by subject
   * @param {string} subjectId - Subject ID or name
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findBySubject(subjectId, organizationId) {
    try {
      const filter = {
        organization: organizationId,
        $or: [
          { subjects: { $in: [subjectId] } },
          { 'subjects._id': subjectId },
          { 'subjects.name': { $regex: subjectId, $options: 'i' } }
        ]
      };

      return await Teacher.find(filter)
        .select('firstName lastName email subjects role organizationName yearsOfExperience status')
        .sort({ firstName: 1 })
        .exec();
    } catch (error) {
      throw AppError.internal(`Failed to find teachers by subject: ${error.message}`);
    }
  }

  /**
   * Find teachers with multiple filters
   * @param {Object} filters - Filter object (status, department, subject, search, etc.)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of teacher documents
   */
  async findWithFilters(filters, organizationId) {
    try {
      const filter = { organization: organizationId };

      if (filters.status) {
        filter.status = filters.status;
      }

      if (filters.departmentId) {
        filter.departments = filters.departmentId;
      }

      if (filters.subjectId || filters.subject) {
        const subjectFilter = filters.subjectId || filters.subject;
        filter.$or = [
          { subjects: { $in: [subjectFilter] } },
          { 'subjects._id': subjectFilter },
          { 'subjects.name': { $regex: subjectFilter, $options: 'i' } }
        ];
      }

      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: 'i' };
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { fullName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex }
          ]
        });
      }

      const selectFields = filters.select || 'firstName lastName emailAddress subjects role organizationName yearsOfExperience status';
      const sortField = filters.sortBy || 'firstName';
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;

      return await Teacher.find(filter)
        .select(selectFields)
        .sort({ [sortField]: sortOrder })
        .exec();
    } catch (error) {
      throw AppError.internal(`Failed to find teachers with filters: ${error.message}`);
    }
  }

  /**
   * Aggregate teachers using MongoDB aggregation pipeline
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @returns {Promise<Array>} - Aggregation results
   */
  async aggregate(pipeline) {
    try {
      return await Teacher.aggregate(pipeline);
    } catch (error) {
      throw AppError.internal(`Failed to aggregate teachers: ${error.message}`);
    }
  }
}

module.exports = new TeacherRepository();
