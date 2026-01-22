/**
 * QuestionRepository
 * Repository layer for question data access
 * Handles all Question model database operations
 */

const Question = require('../models/Question');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class QuestionRepository {
  /**
   * Create a new question
   * @param {Object} questionData - Question data object
   * @returns {Promise<Object>} - Created question document
   */
  async create(questionData) {
    try {
      const question = new Question(questionData);
      return await question.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Question validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create question: ${error.message}`);
    }
  }

  /**
   * Find question by ID
   * @param {string} id - Question ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Question document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question ID format');
      }

      let query = Question.findById(id);

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
      throw AppError.internal(`Failed to find question: ${error.message}`);
    }
  }

  /**
   * Find a single question matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Question document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Question.findOne(filter);

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
      throw AppError.internal(`Failed to find question: ${error.message}`);
    }
  }

  /**
   * Find all questions matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of question documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Question.find(filter);

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
      throw AppError.internal(`Failed to find questions: ${error.message}`);
    }
  }

  /**
   * Update question by ID
   * @param {string} id - Question ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated question document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const question = await Question.findByIdAndUpdate(id, updates, updateOptions);
      return question;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Question validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update question: ${error.message}`);
    }
  }

  /**
   * Delete question by ID
   * @param {string} id - Question ID
   * @returns {Promise<Object|null>} - Deleted question document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question ID format');
      }

      return await Question.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete question: ${error.message}`);
    }
  }

  /**
   * Delete multiple questions matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<Object>} - Delete result
   */
  async deleteMany(filter) {
    try {
      return await Question.deleteMany(filter);
    } catch (error) {
      throw AppError.internal(`Failed to delete questions: ${error.message}`);
    }
  }

  /**
   * Find questions by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of question documents
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
      throw AppError.internal(`Failed to find questions by organization: ${error.message}`);
    }
  }

  /**
   * Check if question exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if question exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await Question.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check question existence: ${error.message}`);
    }
  }

  /**
   * Count questions matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching questions
   */
  async count(filter = {}) {
    try {
      return await Question.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count questions: ${error.message}`);
    }
  }

  /**
   * Get question bank statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Question bank statistics
   */
  async getQuestionBankStats(organizationId) {
    return {
      success: false,
      message: 'TODO: getQuestionBankStats not implemented yet'
    };
  }

  /**
   * Get question statistics
   * @param {string} questionId - Question ID
   * @returns {Promise<Object>} - Question statistics
   */
  async getQuestionStatistics(questionId) {
    return {
      success: false,
      message: 'TODO: getQuestionStatistics not implemented yet'
    };
  }

  /**
   * Get questions by subject
   * @param {string} subjectId - Subject ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Questions data
   */
  async getQuestionsBySubject(subjectId, organizationId) {
    return {
      success: false,
      message: 'TODO: getQuestionsBySubject not implemented yet'
    };
  }
}

module.exports = new QuestionRepository();
