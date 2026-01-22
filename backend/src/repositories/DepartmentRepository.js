/**
 * DepartmentRepository
 * Repository layer for department data access
 * Handles all Department model database operations
 */

const Department = require('../models/Department');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class DepartmentRepository {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data object
   * @returns {Promise<Object>} - Created department document
   */
  async create(departmentData) {
    try {
      const department = new Department(departmentData);
      return await department.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Department validation failed', { errors: error.errors });
      }
      if (error.code === 11000) {
        throw AppError.conflict('Department with this code already exists in this organization');
      }
      throw AppError.internal(`Failed to create department: ${error.message}`);
    }
  }

  /**
   * Find department by ID
   * @param {string} id - Department ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Department document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid department ID format');
      }

      let query = Department.findById(id);

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
      throw AppError.internal(`Failed to find department: ${error.message}`);
    }
  }

  /**
   * Find a single department matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Department document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Department.findOne(filter);

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
      throw AppError.internal(`Failed to find department: ${error.message}`);
    }
  }

  /**
   * Find all departments matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of department documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Department.find(filter);

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
      throw AppError.internal(`Failed to find departments: ${error.message}`);
    }
  }

  /**
   * Update department by ID
   * @param {string} id - Department ID
   * @param {Object} updateData - Update data object
   * @param {Object} options - Update options
   * @returns {Promise<Object|null>} - Updated department document or null
   */
  async updateById(id, updateData, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid department ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const department = await Department.findByIdAndUpdate(id, updateData, updateOptions);
      return department;
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw AppError.validationError('Department validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update department: ${error.message}`);
    }
  }

  /**
   * Delete department by ID
   * @param {string} id - Department ID
   * @returns {Promise<Object|null>} - Deleted department document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid department ID format');
      }

      return await Department.findByIdAndDelete(id);
    } catch (error) {
      throw AppError.internal(`Failed to delete department: ${error.message}`);
    }
  }

  /**
   * Count departments matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching departments
   */
  async count(filter = {}) {
    try {
      return await Department.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count departments: ${error.message}`);
    }
  }

  /**
   * Find departments by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of department documents
   */
  async findByOrganization(organizationId, options = {}) {
    return this.findAll({ organizationId, ...options.filter }, options);
  }
}

module.exports = new DepartmentRepository();






