/**
 * InvitationRepository
 * Repository layer for invitation data access
 * Handles all Invitation model database operations
 */

const Invitation = require('../models/Invitation');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class InvitationRepository {
  /**
   * Create a new invitation
   * @param {Object} invitationData - Invitation data object
   * @returns {Promise<Object>} - Created invitation document
   */
  async create(invitationData) {
    try {
      const invitation = new Invitation(invitationData);
      return await invitation.save();
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('Invitation with this token already exists');
      }
      throw AppError.internal(`Failed to create invitation: ${error.message}`);
    }
  }

  /**
   * Find invitation by ID
   * @param {string} id - Invitation ID
   * @param {Object} options - Query options (populate, select, etc.)
   * @returns {Promise<Object|null>} - Invitation document or null
   */
  async findById(id, options = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid invitation ID');
      }

      let query = Invitation.findById(id);

      if (options.populate) {
        query = query.populate(options.populate);
      }

      if (options.select) {
        query = query.select(options.select);
      }

      return await query.exec();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.internal(`Failed to find invitation: ${error.message}`);
    }
  }

  /**
   * Find invitation by token
   * @param {string} token - Invitation token
   * @returns {Promise<Object|null>} - Invitation document or null
   */
  async findByToken(token) {
    try {
      return await Invitation.findByToken(token);
    } catch (error) {
      throw AppError.internal(`Failed to find invitation by token: ${error.message}`);
    }
  }

  /**
   * Find pending invitation by email and organization
   * @param {string} email - Email address
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} - Invitation document or null
   */
  async findPendingByEmail(email, organizationId) {
    try {
      return await Invitation.findPendingByEmail(email.toLowerCase(), organizationId);
    } catch (error) {
      throw AppError.internal(`Failed to find pending invitation: ${error.message}`);
    }
  }

  /**
   * Find invitations by organization
   * @param {string} organizationId - Organization ID
   * @param {string} status - Optional status filter
   * @returns {Promise<Array>} - Array of invitation documents
   */
  async findByOrganization(organizationId, status = null) {
    try {
      return await Invitation.findByOrganization(organizationId, status);
    } catch (error) {
      throw AppError.internal(`Failed to find invitations by organization: ${error.message}`);
    }
  }

  /**
   * Update invitation by ID
   * @param {string} id - Invitation ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object|null>} - Updated invitation document or null
   */
  async updateById(id, updates) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid invitation ID');
      }

      return await Invitation.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).exec();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.internal(`Failed to update invitation: ${error.message}`);
    }
  }

  /**
   * Delete invitation by ID
   * @param {string} id - Invitation ID
   * @returns {Promise<Object|null>} - Deleted invitation document or null
   */
  async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw AppError.badRequest('Invalid invitation ID');
      }

      return await Invitation.findByIdAndDelete(id).exec();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.internal(`Failed to delete invitation: ${error.message}`);
    }
  }

  /**
   * Find invitation by user ID (via email lookup)
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object|null>} - Most recent pending invitation or null
   */
  async findByUserId(userId, organizationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw AppError.badRequest('Invalid user ID');
      }

      // First get user email
      const User = require('../models/User');
      const user = await User.findById(userId).select('email').exec();
      
      if (!user) {
        return null;
      }

      // Find most recent pending invitation for this email and organization
      return await Invitation.findOne({
        email: user.email.toLowerCase(),
        organizationId,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.internal(`Failed to find invitation by user ID: ${error.message}`);
    }
  }

  /**
   * Update invitation (alias for updateById for clarity)
   * @param {string} id - Invitation ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object|null>} - Updated invitation document or null
   */
  async updateInvitation(id, updates) {
    return await this.updateById(id, updates);
  }
}

module.exports = new InvitationRepository();

