/**
 * OrganizationRepository
 * Repository layer for organization data access
 * Handles all Organization model database operations
 */

const Organization = require('../models/Organization');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class OrganizationRepository {
  /**
   * Create a new organization
   * @param {Object} orgData - Organization data object
   * @returns {Promise<Object>} - Created organization document
   */
  async create(orgData) {
    try {
      const organization = new Organization(orgData);
      return await organization.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('Organization with this code or email already exists');
      }
      throw AppError.internal(`Failed to create organization: ${error.message}`);
    }
  }

  /**
   * Find organization by ID
   * @param {string} id - Organization ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Organization document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      let query = Organization.findById(id);

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
      throw AppError.internal(`Failed to find organization: ${error.message}`);
    }
  }

  /**
   * Find a single organization matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Organization document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = Organization.findOne(filter);

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
      throw AppError.internal(`Failed to find organization: ${error.message}`);
    }
  }

  /**
   * Find all organizations matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of organization documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = Organization.find(filter);

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
      throw AppError.internal(`Failed to find organizations: ${error.message}`);
    }
  }

  /**
   * Update organization by ID
   * @param {string} id - Organization ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated organization document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const organization = await Organization.findByIdAndUpdate(id, updates, updateOptions);
      return organization;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('Organization with this identifier already exists');
      }
      throw AppError.internal(`Failed to update organization: ${error.message}`);
    }
  }

  /**
   * Delete organization by ID
   * @param {string} id - Organization ID
   * @returns {Promise<Object|null>} - Deleted organization document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      return await Organization.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete organization: ${error.message}`);
    }
  }

  /**
   * Find organizations by filter (no organization scoping as Organization is root entity)
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of organization documents
   */
  async findByOrganization(organizationId, options = {}) {
    // Organization is root entity, so this method returns the organization itself
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      return await this.findById(organizationId, options);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find organization: ${error.message}`);
    }
  }

  /**
   * Check if organization exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if organization exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await Organization.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check organization existence: ${error.message}`);
    }
  }

  /**
   * Count organizations matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching organizations
   */
  async count(filter = {}) {
    try {
      return await Organization.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count organizations: ${error.message}`);
    }
  }

  /**
   * Get organization statistics
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization statistics
   */
  async getOrganizationStats(organizationId) {
    return {
      success: false,
      message: 'TODO: getOrganizationStats not implemented yet'
    };
  }

  /**
   * Get organization users count
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - User count data
   */
  async getOrganizationUserCount(organizationId) {
    return {
      success: false,
      message: 'TODO: getOrganizationUserCount not implemented yet'
    };
  }

  /**
   * Get organization setup status
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Setup status data
   */
  async getOrganizationSetupStatus(organizationId) {
    return {
      success: false,
      message: 'TODO: getOrganizationSetupStatus not implemented yet'
    };
  }
}

module.exports = new OrganizationRepository();
