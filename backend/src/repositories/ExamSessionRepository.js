/**
 * ExamSessionRepository
 * Repository layer for exam session data access
 * Handles all ExamSession model database operations
 */

const ExamSession = require('../models/ExamSession');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class ExamSessionRepository {
  /**
   * Create a new exam session
   * @param {Object} sessionData - Exam session data object
   * @returns {Promise<Object>} - Created exam session document
   */
  async create(sessionData) {
    try {
      const session = new ExamSession(sessionData);
      return await session.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Exam session validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create exam session: ${error.message}`);
    }
  }

  /**
   * Find exam session by ID
   * @param {string} id - Exam session ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Exam session document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam session ID format');
      }

      let query = ExamSession.findById(id);

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
      throw AppError.internal(`Failed to find exam session: ${error.message}`);
    }
  }

  /**
   * Find a single exam session matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Exam session document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = ExamSession.findOne(filter);

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
      throw AppError.internal(`Failed to find exam session: ${error.message}`);
    }
  }

  /**
   * Find all exam sessions matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of exam session documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = ExamSession.find(filter);

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
      throw AppError.internal(`Failed to find exam sessions: ${error.message}`);
    }
  }

  /**
   * Update exam session by ID
   * @param {string} id - Exam session ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated exam session document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam session ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const session = await ExamSession.findByIdAndUpdate(id, updates, updateOptions);
      return session;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Exam session validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update exam session: ${error.message}`);
    }
  }

  /**
   * Delete exam session by ID
   * @param {string} id - Exam session ID
   * @returns {Promise<Object|null>} - Deleted exam session document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid exam session ID format');
      }

      return await ExamSession.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete exam session: ${error.message}`);
    }
  }

  /**
   * Find exam sessions by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of exam session documents
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
      throw AppError.internal(`Failed to find exam sessions by organization: ${error.message}`);
    }
  }

  /**
   * Check if exam session exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if exam session exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await ExamSession.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check exam session existence: ${error.message}`);
    }
  }

  /**
   * Count exam sessions matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching exam sessions
   */
  async count(filter = {}) {
    try {
      return await ExamSession.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count exam sessions: ${error.message}`);
    }
  }

  /**
   * Get session activity
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session activity data
   */
  async getSessionActivity(sessionId) {
    return {
      success: false,
      message: 'TODO: getSessionActivity not implemented yet'
    };
  }

  /**
   * Get session results
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session results data
   */
  async getSessionResults(sessionId) {
    return {
      success: false,
      message: 'TODO: getSessionResults not implemented yet'
    };
  }

  /**
   * Get sessions by exam
   * @param {string} examId - Exam ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Sessions data
   */
  async getSessionsByExam(examId, organizationId) {
    return {
      success: false,
      message: 'TODO: getSessionsByExam not implemented yet'
    };
  }

  /**
   * Get sessions by student
   * @param {string} studentId - Student ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Sessions data
   */
  async getSessionsByStudent(studentId, organizationId) {
    return {
      success: false,
      message: 'TODO: getSessionsByStudent not implemented yet'
    };
  }
}

module.exports = new ExamSessionRepository();
