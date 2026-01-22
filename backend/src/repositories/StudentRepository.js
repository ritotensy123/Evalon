/**
 * StudentRepository
 * Repository layer for student data access
 * Handles all Student model database operations
 */

const Student = require('../models/Student');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class StudentRepository {
  /**
   * Create a new student
   * @param {Object} studentData - Student data object
   * @returns {Promise<Object>} - Created student document
   */
  async create(studentData) {
    try {
      const student = new Student(studentData);
      return await student.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('Student with this email or student ID already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Student validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create student: ${error.message}`);
    }
  }

  /**
   * Find student by ID
   * @param {string} id - Student ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Student document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid student ID format');
      }

      let query = Student.findById(id);

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
      throw AppError.internal(`Failed to find student: ${error.message}`);
    }
  }

  /**
   * Find a single student matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Student document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Student.findOne(filter);

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
      throw AppError.internal(`Failed to find student: ${error.message}`);
    }
  }

  /**
   * Find all students matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of student documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Student.find(filter);

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
      throw AppError.internal(`Failed to find students: ${error.message}`);
    }
  }

  /**
   * Update student by ID
   * @param {string} id - Student ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated student document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid student ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const student = await Student.findByIdAndUpdate(id, updates, updateOptions);
      return student;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('Student with this identifier already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Student validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update student: ${error.message}`);
    }
  }

  /**
   * Delete student by ID
   * @param {string} id - Student ID
   * @returns {Promise<Object|null>} - Deleted student document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid student ID format');
      }

      return await Student.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete student: ${error.message}`);
    }
  }

  /**
   * Find students by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of student documents
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
      throw AppError.internal(`Failed to find students by organization: ${error.message}`);
    }
  }

  /**
   * Check if student exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if student exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await Student.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check student existence: ${error.message}`);
    }
  }

  /**
   * Count students matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching students
   */
  async count(filter = {}) {
    try {
      return await Student.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count students: ${error.message}`);
    }
  }

  /**
   * Get student progress
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Student progress data
   */
  async getStudentProgress(studentId) {
    return {
      success: false,
      message: 'TODO: getStudentProgress not implemented yet'
    };
  }

  /**
   * Get student statistics
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} - Student statistics
   */
  async getStudentStatistics(studentId) {
    return {
      success: false,
      message: 'TODO: getStudentStatistics not implemented yet'
    };
  }

  /**
   * Get students by department
   * @param {string} departmentId - Department ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Students data
   */
  async getStudentsByDepartment(departmentId, organizationId) {
    return {
      success: false,
      message: 'TODO: getStudentsByDepartment not implemented yet'
    };
  }

  /**
   * Find students by user IDs
   * @param {Array} userIds - Array of user IDs
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of student documents
   */
  async findStudentsByUserIds(userIds, organizationId) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      const filter = {
        _id: { $in: userIds },
        organization: organizationId
      };

      return await this.findAll(filter, {
        select: 'firstName lastName email phoneNumber academicYear grade section rollNumber studentCode status department organization createdAt'
      });
    } catch (error) {
      throw AppError.internal(`Failed to find students by user IDs: ${error.message}`);
    }
  }

  /**
   * Aggregate students for statistics
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @returns {Promise<Array>} - Aggregation results
   */
  async aggregate(pipeline) {
    try {
      return await Student.aggregate(pipeline);
    } catch (error) {
      throw AppError.internal(`Failed to aggregate students: ${error.message}`);
    }
  }

  /**
   * Find and update student by ID with populate
   * @param {string} id - Student ID
   * @param {Object} updates - Update data
   * @param {Object} options - Update and populate options
   * @returns {Promise<Object|null>} - Updated student document or null
   */
  async findByIdAndUpdate(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid student ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true
      };

      // Remove populate from updateOptions
      const { populate, ...restOptions } = options;
      Object.assign(updateOptions, restOptions);

      let student = await Student.findByIdAndUpdate(id, updates, updateOptions);

      if (student && populate) {
        if (Array.isArray(populate)) {
          for (const pop of populate) {
            student = await student.populate(pop);
          }
        } else {
          student = await student.populate(populate);
        }
      }

      return student;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('Student with this identifier already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Student validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update student: ${error.message}`);
    }
  }
}

module.exports = new StudentRepository();
