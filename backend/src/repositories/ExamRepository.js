/**
 * ExamRepository
 * Repository layer for exam data access
 * Handles all Exam model database operations
 */

const Exam = require('../models/Exam');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class ExamRepository {
  /**
   * Create a new exam
   * @param {Object} examData - Exam data object
   * @returns {Promise<Object>} - Created exam document
   */
  async create(examData) {
    try {
      const exam = new Exam(examData);
      return await exam.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Exam validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create exam: ${error.message}`);
    }
  }

  /**
   * Find exam by ID
   * @param {string} id - Exam ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Exam document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam ID format');
      }

      let query = Exam.findById(id);

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
      throw AppError.internal(`Failed to find exam: ${error.message}`);
    }
  }

  /**
   * Find a single exam matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Exam document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Exam.findOne(filter);

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
      throw AppError.internal(`Failed to find exam: ${error.message}`);
    }
  }

  /**
   * Find all exams matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of exam documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Exam.find(filter);

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
      throw AppError.internal(`Failed to find exams: ${error.message}`);
    }
  }

  /**
   * Update exam by ID
   * @param {string} id - Exam ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated exam document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const exam = await Exam.findByIdAndUpdate(id, updates, updateOptions);
      return exam;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Exam validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update exam: ${error.message}`);
    }
  }

  /**
   * Delete exam by ID
   * @param {string} id - Exam ID
   * @returns {Promise<Object|null>} - Deleted exam document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam ID format');
      }

      return await Exam.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete exam: ${error.message}`);
    }
  }

  /**
   * Find exams by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of exam documents
   */
  async findByOrganization(organizationId, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      const filter = { organizationId };
      return await this.findAll(filter, options);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find exams by organization: ${error.message}`);
    }
  }

  /**
   * Check if exam exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if exam exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await Exam.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check exam existence: ${error.message}`);
    }
  }

  /**
   * Count exams matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching exams
   */
  async count(filter = {}) {
    try {
      return await Exam.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count exams: ${error.message}`);
    }
  }

  /**
   * Get exam analytics
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} - Exam analytics data
   */
  async getExamAnalytics(examId) {
    return {
      success: false,
      message: 'TODO: getExamAnalytics not implemented yet'
    };
  }

  /**
   * Get exam statistics
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} - Exam statistics
   */
  async getExamStatistics(examId) {
    return {
      success: false,
      message: 'TODO: getExamStatistics not implemented yet'
    };
  }

  /**
   * Get exams by teacher
   * @param {string} teacherId - Teacher ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Exams data
   */
  async getExamsByTeacher(teacherId, organizationId) {
    return {
      success: false,
      message: 'TODO: getExamsByTeacher not implemented yet'
    };
  }

  /**
   * Get exams by student
   * @param {string} studentId - Student ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Exams data
   */
  async getExamsByStudent(studentId, organizationId) {
    return {
      success: false,
      message: 'TODO: getExamsByStudent not implemented yet'
    };
  }
}

module.exports = new ExamRepository();
