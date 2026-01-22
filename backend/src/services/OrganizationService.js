/**
 * OrganizationService
 * Service layer for organization operations
 * Handles organization CRUD operations and business logic
 */

const OrganizationRepository = require('../repositories/OrganizationRepository');
const UserRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');

class OrganizationService {
  /**
   * Get organization by ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization document
   * @throws {AppError} - If organization not found
   */
  async getOrganizationById(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const organization = await OrganizationRepository.findById(organizationId);

    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    return organization;
  }

  /**
   * Register a new organization
   * @param {Object} orgData - Organization data
   * @returns {Promise<Object>} - Created organization
   * @throws {AppError} - If validation fails or organization already exists
   */
  async registerOrganization(orgData) {
    // Input validation
    if (!orgData.name || !orgData.email || !orgData.orgCode) {
      throw AppError.badRequest('Organization name, email, and code are required');
    }

    // Check if organization with same code exists
    const existingOrg = await OrganizationRepository.findOne({ orgCode: orgData.orgCode });
    if (existingOrg) {
      throw AppError.conflict('Organization with this code already exists');
    }

    // Check if organization with same email exists
    const existingEmail = await OrganizationRepository.findOne({ email: orgData.email.toLowerCase() });
    if (existingEmail) {
      throw AppError.conflict('Organization with this email already exists');
    }

    // Normalize email
    orgData.email = orgData.email.toLowerCase();

    // Create organization
    const organization = await OrganizationRepository.create(orgData);

    return organization;
  }

  /**
   * Update organization
   * @param {string} organizationId - Organization ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated organization
   * @throws {AppError} - If organization not found
   */
  async updateOrganization(organizationId, updateData) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Check if organization exists
    const existingOrg = await OrganizationRepository.findById(organizationId);
    if (!existingOrg) {
      throw AppError.notFound('Organization not found');
    }

    // Prevent orgCode changes (critical identifier)
    if (updateData.orgCode && updateData.orgCode !== existingOrg.orgCode) {
      throw AppError.badRequest('Organization code cannot be changed');
    }

    // Normalize email if provided
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
      
      // Check if new email conflicts with existing organization
      const emailConflict = await OrganizationRepository.findOne({
        email: updateData.email,
        _id: { $ne: organizationId }
      });
      
      if (emailConflict) {
        throw AppError.conflict('Organization with this email already exists');
      }
    }

    // Handle address object merge safely
    if (updateData.address && typeof updateData.address === 'object') {
      // Merge address object with existing address
      updateData.address = {
        ...(existingOrg.address || {}),
        ...updateData.address
      };
    }

    // Update organization
    const updatedOrg = await OrganizationRepository.updateById(organizationId, updateData);

    if (!updatedOrg) {
      throw AppError.notFound('Organization not found after update');
    }

    return updatedOrg;
  }

  /**
   * Get organization users
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - { users, total, pagination }
   * @throws {AppError} - If organization not found
   */
  async getOrganizationUsers(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Build filter
    const filter = { organizationId };
    
    if (filters.userType) {
      filter.userType = filters.userType;
    }
    
    if (filters.status !== undefined) {
      filter.isActive = filters.status === 'active';
    }

    // Calculate pagination
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users
    const users = await UserRepository.findAll(filter, {
      populate: 'userId',
      select: '-password',
      sort: { createdAt: -1 },
      limit,
      skip
    });

    // Get total count
    const total = await UserRepository.count(filter);

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
  }

  /**
   * Get organization by code
   * @param {string} orgCode - Organization code
   * @returns {Promise<Object>} - Organization document
   * @throws {AppError} - If organization not found
   */
  async getOrganizationByCode(orgCode) {
    if (!orgCode) {
      throw AppError.badRequest('Organization code is required');
    }

    const organization = await OrganizationRepository.findOne({
      orgCode: orgCode.toUpperCase(),
      status: 'active'
    });

    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    return organization;
  }

  /**
   * Get all active organizations
   * @param {Object} options - Query options (select, sort, etc.)
   * @returns {Promise<Array>} - Array of organization documents
   */
  async getAllOrganizations(options = {}) {
    const queryOptions = {
      select: options.select || 'name orgCode email status createdAt',
      sort: options.sort || { createdAt: -1 },
      ...options
    };

    return await OrganizationRepository.findAll(
      { status: 'active' },
      queryOptions
    );
  }

  /**
   * Delete organization (soft delete by setting status to inactive)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Updated organization
   * @throws {AppError} - If organization not found
   */
  async deleteOrganization(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const organization = await OrganizationRepository.updateById(
      organizationId,
      { status: 'inactive' },
      { new: true }
    );

    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    return organization;
  }

  /**
   * Complete organization setup wizard
   * @param {string} organizationId - Organization ID
   * @param {Object} setupData - Setup data (logo, organizationDetails, departments, adminPermissions)
   * @param {string} logoTempKey - Temporary logo key (optional)
   * @returns {Promise<Object>} - Updated organization and dashboard data
   * @throws {AppError} - If organization not found or validation fails
   */
  async completeSetup(organizationId, setupData, logoTempKey = null) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Find the organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Build update data
    const updateData = {
      setupCompleted: true,
      setupCompletedAt: new Date()
    };

    // Handle logo (finalLogoPath is already calculated in controller)
    if (setupData.logo) {
      updateData.logo = setupData.logo;
    }

    // Update organization details if provided
    if (setupData.organizationDetails) {
      Object.assign(updateData, setupData.organizationDetails);
    }

    // Update departments if provided
    if (setupData.departments && setupData.departments.length > 0) {
      updateData.departments = setupData.departments.map(dept => {
        return typeof dept === 'string' ? dept : dept.name || dept;
      });
    }

    // Update admin permissions if provided
    if (setupData.adminPermissions) {
      updateData.adminPermissions = setupData.adminPermissions.permissions || {};
      updateData.securitySettings = setupData.adminPermissions.securitySettings || {};
      updateData.notificationSettings = setupData.adminPermissions.notificationSettings || {};
      updateData.subAdmins = setupData.adminPermissions.subAdmins || [];
    }

    // Update organization
    const updatedOrganization = await OrganizationRepository.updateById(
      organizationId,
      updateData,
      { new: true, runValidators: true }
    );

    // Update the organization admin user's firstLogin status
    await UserRepository.findOneAndUpdate(
      {
        userType: 'organization_admin',
        userId: organizationId,
        userModel: 'Organization'
      },
      {
        firstLogin: false,
        setupCompleted: true
      },
      { new: true }
    );

    return updatedOrganization;
  }

  /**
   * Get organization setup status
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Setup status data
   * @throws {AppError} - If organization not found
   */
  async getSetupStatus(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    return {
      setupCompleted: organization.setupCompleted || false,
      setupCompletedAt: organization.setupCompletedAt,
      hasLogo: !!organization.logo,
      departmentsCount: organization.departments?.length || 0,
      subAdminsCount: organization.subAdmins?.length || 0,
      permissionsConfigured: !!organization.adminPermissions
    };
  }

  /**
   * Skip setup wizard (PHASE 5: Skip should NOT prevent resuming later)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Updated organization
   * @throws {AppError} - If organization not found
   */
  async skipSetup(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // PHASE 5: Skip only marks as skipped, does NOT set setupCompleted=true
    // This allows resuming setup later
    const organization = await OrganizationRepository.updateById(
      organizationId,
      {
        setupSkipped: true,
        setupSkippedAt: new Date()
        // NOTE: setupCompleted remains false to allow resuming
      },
      { new: true }
    );

    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    return organization;
  }
}

module.exports = new OrganizationService();
