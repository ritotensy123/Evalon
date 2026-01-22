/**
 * OtpRepository
 * Repository layer for OTP data access
 * Handles all OTP model database operations
 */

const OTP = require('../models/OTP');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class OtpRepository {
  /**
   * Create a new OTP
   * @param {Object} otpData - OTP data object
   * @returns {Promise<Object>} - Created OTP document
   */
  async create(otpData) {
    try {
      const otp = new OTP(otpData);
      return await otp.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('OTP with this identifier already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('OTP validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to create OTP: ${error.message}`);
    }
  }

  /**
   * Find OTP by ID
   * @param {string} id - OTP ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - OTP document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid OTP ID format');
      }

      let query = OTP.findById(id);

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
      throw AppError.internal(`Failed to find OTP: ${error.message}`);
    }
  }

  /**
   * Find a single OTP matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - OTP document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = OTP.findOne(filter);

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
      throw AppError.internal(`Failed to find OTP: ${error.message}`);
    }
  }

  /**
   * Find all OTPs matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of OTP documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = OTP.find(filter);

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
      throw AppError.internal(`Failed to find OTPs: ${error.message}`);
    }
  }

  /**
   * Update OTP by ID
   * @param {string} id - OTP ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated OTP document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid OTP ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const otp = await OTP.findByIdAndUpdate(id, updates, updateOptions);
      return otp;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('OTP with this identifier already exists');
      }
      if (error.name === 'ValidationError') {
        throw AppError.validationError('OTP validation failed', { errors: error.errors });
      }
      throw AppError.internal(`Failed to update OTP: ${error.message}`);
    }
  }

  /**
   * Delete OTP by ID
   * @param {string} id - OTP ID
   * @returns {Promise<Object|null>} - Deleted OTP document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid OTP ID format');
      }

      return await OTP.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete OTP: ${error.message}`);
    }
  }

  /**
   * Delete OTPs matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<Object>} - Delete result
   */
  async deleteMany(filter) {
    try {
      return await OTP.deleteMany(filter);
    } catch (error) {
      throw AppError.internal(`Failed to delete OTPs: ${error.message}`);
    }
  }

  /**
   * Find OTP by email and type
   * @param {string} email - Email address
   * @param {string} type - OTP type ('email' or 'phone')
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object|null>} - OTP document or null
   */
  async findByEmail(email, type = 'email', purpose = null) {
    try {
      const filter = { email: email.toLowerCase(), type };
      if (purpose) {
        filter.purpose = purpose;
      }
      return await this.findOne(filter);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find OTP by email: ${error.message}`);
    }
  }

  /**
   * Find OTP by phone and type
   * @param {string} phone - Phone number
   * @param {string} type - OTP type ('email' or 'phone')
   * @param {string} purpose - OTP purpose
   * @returns {Promise<Object|null>} - OTP document or null
   */
  async findByPhone(phone, type = 'phone', purpose = null) {
    try {
      const filter = { phone, type };
      if (purpose) {
        filter.purpose = purpose;
      }
      return await this.findOne(filter);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find OTP by phone: ${error.message}`);
    }
  }

  /**
   * Find valid (non-expired, non-verified) OTP
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<Object|null>} - Valid OTP document or null
   */
  async findValidOTP(filter) {
    try {
      const query = {
        ...filter,
        verified: false,
        expiresAt: { $gt: new Date() }
      };
      return await this.findOne(query);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find valid OTP: ${error.message}`);
    }
  }

  /**
   * Count OTPs matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching OTPs
   */
  async count(filter = {}) {
    try {
      return await OTP.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count OTPs: ${error.message}`);
    }
  }

  /**
   * Check if OTP exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if OTP exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await OTP.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check OTP existence: ${error.message}`);
    }
  }
}

module.exports = new OtpRepository();






