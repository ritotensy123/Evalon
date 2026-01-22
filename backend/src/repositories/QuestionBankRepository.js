/**
 * QuestionBankRepository
 * Repository layer for question bank data access
 * Handles all QuestionBank model database operations
 */

const QuestionBank = require('../models/QuestionBank');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class QuestionBankRepository {
  /**
   * Create a new question bank
   * @param {Object} questionBankData - Question bank data object
   * @returns {Promise<Object>} - Created question bank document
   */
  async create(questionBankData) {
    try {
      const questionBank = new QuestionBank(questionBankData);
      return await questionBank.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Question bank validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create question bank: ${error.message}`);
    }
  }

  /**
   * Find question bank by ID
   * @param {string} id - Question bank ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Question bank document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question bank ID format');
      }

      let query = QuestionBank.findById(id);

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
      throw AppError.internal(`Failed to find question bank: ${error.message}`);
    }
  }

  /**
   * Find a single question bank matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Question bank document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = QuestionBank.findOne(filter);

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
      throw AppError.internal(`Failed to find question bank: ${error.message}`);
    }
  }

  /**
   * Find all question banks matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of question bank documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = QuestionBank.find(filter);

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
        query = query.limit(options.limit);
      }

      if (options.skip) {
        query = query.skip(options.skip);
      }

      return await query.exec();
    } catch (error) {
      throw AppError.internal(`Failed to find question banks: ${error.message}`);
    }
  }

  /**
   * Update question bank by ID
   * @param {string} id - Question bank ID
   * @param {Object} updateData - Update data object
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} - Updated question bank document or null
   */
  async updateById(id, updateData, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question bank ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const questionBank = await QuestionBank.findByIdAndUpdate(id, updateData, updateOptions);
      return questionBank;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Question bank validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update question bank: ${error.message}`);
    }
  }

  /**
   * Delete question bank by ID
   * @param {string} id - Question bank ID
   * @returns {Promise<Object|null>} - Deleted question bank document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid question bank ID format');
      }

      return await QuestionBank.findByIdAndDelete(id);
    } catch (error) {
      throw AppError.internal(`Failed to delete question bank: ${error.message}`);
    }
  }

  /**
   * Count question banks matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching question banks
   */
  async count(filter = {}) {
    try {
      return await QuestionBank.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count question banks: ${error.message}`);
    }
  }

  /**
   * Find question banks by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of question bank documents
   */
  async findByOrganization(organizationId, options = {}) {
    return this.findAll({ organizationId, ...options.filter }, options);
  }
}

module.exports = new QuestionBankRepository();






