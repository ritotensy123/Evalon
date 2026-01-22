/**
 * UserRepository
 * Repository layer for user data access
 * Handles all User model database operations
 */

const User = require('../models/User');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data object
   * @returns {Promise<Object>} - Created user document
   */
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('User with this email or identifier already exists');
      }
      throw AppError.internal(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - User document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid user ID format');
      }

      let query = User.findById(id);

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
      throw AppError.internal(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Find a single user matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - User document or null
   */
  async findOne(filter, options = {}) {
    try {
      let query = User.findOne(filter);

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
      throw AppError.internal(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Find all users matching filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} options - Query options (populate, select, sort, limit, skip, etc.)
   * @returns {Promise<Array>} - Array of user documents
   */
  async findAll(filter = {}, options = {}) {
    try {
      let query = User.find(filter);

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
      throw AppError.internal(`Failed to find users: ${error.message}`);
    }
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated user document or null
   */
  async updateById(id, updates, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid user ID format');
      }

      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const user = await User.findByIdAndUpdate(id, updates, updateOptions);
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('User with this identifier already exists');
      }
      throw AppError.internal(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Find and update user by filter
   * @param {Object} filter - MongoDB filter object
   * @param {Object} updates - Update data object
   * @param {Object} options - Update options (new, runValidators, etc.)
   * @returns {Promise<Object|null>} - Updated user document or null
   */
  async findOneAndUpdate(filter, updates, options = {}) {
    try {
      const updateOptions = {
        new: options.new !== undefined ? options.new : true,
        runValidators: options.runValidators !== undefined ? options.runValidators : true,
        ...options
      };

      const user = await User.findOneAndUpdate(filter, updates, updateOptions);
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.code === 11000) {
        throw AppError.conflict('User with this identifier already exists');
      }
      throw AppError.internal(`Failed to find and update user: ${error.message}`);
    }
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - Deleted user document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid user ID format');
      }

      return await User.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Find users by organization ID
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of user documents
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
      throw AppError.internal(`Failed to find users by organization: ${error.message}`);
    }
  }

  /**
   * Check if user exists matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<boolean>} - True if user exists, false otherwise
   */
  async exists(filter) {
    try {
      const count = await User.countDocuments(filter);
      return count > 0;
    } catch (error) {
      throw AppError.internal(`Failed to check user existence: ${error.message}`);
    }
  }

  /**
   * Count users matching filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching users
   */
  async count(filter = {}) {
    try {
      return await User.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count users: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User statistics
   */
  async getUserStats(userId) {
    return {
      success: false,
      message: 'TODO: getUserStats not implemented yet'
    };
  }

  /**
   * Get user activity log
   * @param {string} userId - User ID
   * @param {Object} filters - Activity filters
   * @returns {Promise<Object>} - User activity data
   */
  async getUserActivity(userId, filters = {}) {
    return {
      success: false,
      message: 'TODO: getUserActivity not implemented yet'
    };
  }

  /**
   * Get user permissions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User permissions
   */
  async getUserPermissions(userId) {
    return {
      success: false,
      message: 'TODO: getUserPermissions not implemented yet'
    };
  }

  /**
   * Search users with filter, pagination, and sorting
   * @param {Object} filter - MongoDB filter object
   * @param {Object} pagination - Pagination options (page, limit)
   * @param {Object} sorting - Sorting options (field, order)
   * @returns {Promise<Object>} - { users, total, pagination }
   */
  async searchUsers(filter = {}, pagination = { page: 1, limit: 10 }, sorting = { field: 'createdAt', order: -1 }) {
    try {
      const page = parseInt(pagination.page) || 1;
      const limit = parseInt(pagination.limit) || 10;
      const skip = (page - 1) * limit;

      const sortObj = {};
      sortObj[sorting.field] = sorting.order === 'asc' ? 1 : -1;

      const users = await User.find(filter)
        .select('-password')
        .sort(sortObj)
        .limit(limit)
        .skip(skip)
        .exec();

      const total = await User.countDocuments(filter);

      return {
        users,
        total,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw AppError.internal(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Find users by role within organization
   * @param {string} role - User role/type
   * @param {string} organizationId - Organization ID
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - { users, total, pagination }
   */
  async findUsersByRole(role, organizationId, pagination = { page: 1, limit: 10 }) {
    try {
      const filter = {
        $or: [
          { organizationId, userType: role },
          { userType: 'organization_admin', userId: organizationId }
        ]
      };

      return await this.searchUsers(filter, pagination);
    } catch (error) {
      throw AppError.internal(`Failed to find users by role: ${error.message}`);
    }
  }

  /**
   * Search users across multiple fields
   * @param {string} keyword - Search keyword
   * @param {Array} fields - Fields to search in
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of matching users
   */
  async searchAcrossFields(keyword, fields = ['email', 'profile.firstName', 'profile.lastName'], organizationId = null) {
    try {
      const searchRegex = { $regex: keyword, $options: 'i' };
      const searchConditions = fields.map(field => ({ [field]: searchRegex }));

      const filter = {
        $or: searchConditions
      };

      if (organizationId) {
        filter.$and = [
          {
            $or: [
              { organizationId },
              { userType: 'organization_admin', userId: organizationId }
            ]
          }
        ];
      }

      return await User.find(filter)
        .select('-password')
        .limit(100)
        .exec();
    } catch (error) {
      throw AppError.internal(`Failed to search across fields: ${error.message}`);
    }
  }

  /**
   * Count users created between two dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} additionalFilter - Additional filter conditions
   * @returns {Promise<number>} - Count of users created in the date range
   */
  async countUsersCreatedBetween(startDate, endDate, additionalFilter = {}) {
    try {
      const filter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        ...additionalFilter
      };

      return await User.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count users created between dates: ${error.message}`);
    }
  }

  /**
   * Find user by email within organization
   * @param {string} email - User email
   * @param {string} organizationId - Organization ID (optional)
   * @returns {Promise<Object|null>} - User document or null
   */
  async findByEmail(email, organizationId = null) {
    try {
      const filter = { email: email.toLowerCase() };
      
      if (organizationId) {
        filter.$or = [
          { organizationId },
          { userType: 'organization_admin', userId: organizationId }
        ];
      }

      return await User.findOne(filter).exec();
    } catch (error) {
      throw AppError.internal(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by phone number within organization
   * @param {string} phone - Phone number
   * @param {string} organizationId - Organization ID (optional)
   * @returns {Promise<Object|null>} - User document or null
   */
  async findByPhone(phone, organizationId = null) {
    try {
      const filter = { 'profile.phone': phone };
      
      if (organizationId) {
        filter.$or = [
          { organizationId },
          { userType: 'organization_admin', userId: organizationId }
        ];
      }

      return await User.findOne(filter).exec();
    } catch (error) {
      throw AppError.internal(`Failed to find user by phone: ${error.message}`);
    }
  }

  /**
   * Create multiple users
   * @param {Array} usersData - Array of user data objects
   * @returns {Promise<Array>} - Array of created user documents
   */
  async createMany(usersData) {
    try {
      const users = usersData.map(userData => new User(userData));
      return await User.insertMany(users, { ordered: false });
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('One or more users already exist');
      }
      throw AppError.internal(`Failed to create users: ${error.message}`);
    }
  }

  /**
   * Find multiple users by IDs
   * @param {Array} userIds - Array of user IDs
   * @param {Object} options - Query options (select, populate, etc.)
   * @returns {Promise<Array>} - Array of user documents
   */
  async findManyByIds(userIds, options = {}) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return [];
      }

      // Validate all IDs are valid ObjectIds
      const validIds = userIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        return [];
      }

      let query = User.find({ _id: { $in: validIds } });

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.populate) {
        query = query.populate(options.populate);
      }

      return await query.exec();
    } catch (error) {
      throw AppError.internal(`Failed to find users by IDs: ${error.message}`);
    }
  }

  /**
   * Update multiple users
   * @param {Array} updates - Array of { userId, updates } objects
   * @returns {Promise<Array>} - Array of update results
   */
  async updateMany(updates) {
    try {
      const results = [];
      
      for (const { userId, updates: updateData } of updates) {
        try {
          if (!mongoose.Types.ObjectId.isValid(userId)) {
            results.push({ userId, success: false, error: 'Invalid user ID' });
            continue;
          }

          const updated = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
          );

          if (!updated) {
            results.push({ userId, success: false, error: 'User not found' });
          } else {
            results.push({ userId, success: true, user: updated });
          }
        } catch (error) {
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw AppError.internal(`Failed to update multiple users: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();
