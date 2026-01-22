/**
 * AuthService
 * Service layer for authentication operations
 * Handles user authentication, token verification, and credential validation
 */

const UserRepository = require('../repositories/UserRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const { generateToken, verifyToken } = require('../utils/authUtils');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} userType - User type (teacher, student, etc.)
   * @returns {Promise<Object>} - { user, token, dashboard, organization }
   * @throws {AppError} - If authentication fails
   */
  async login(email, password, userType) {
    // Input validation
    if (!email || !password || !userType) {
      throw AppError.badRequest('Email, password, and user type are required');
    }

    // Find user by email and type
    const userTypeEmail = `${email.toLowerCase()}_${userType}`;
    const user = await UserRepository.findOne(
      { userTypeEmail },
      { populate: 'userId' }
    );

    if (!user) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Check if account is active
    if (!user.isActive) {
      throw AppError.unauthorized('Account is deactivated. Please contact support.');
    }

    // Check email verification (skip for admin-created users with temporary passwords)
    if (!user.isEmailVerified && user.authProvider !== 'temp_password' && !user.firstLogin) {
      throw AppError.unauthorized('Please verify your email before logging in.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    // Update last login
    await UserRepository.updateById(user._id, { lastLogin: new Date() });

    // Generate JWT token
    const token = generateToken(user._id, user.userType, user.tokenVersion || 0);

    // Build dashboard data based on user type
    let dashboardData = {};
    let organizationData = {};

    if (user.userId) {
      // Get organization data
      if (user.userType === 'organization_admin') {
        const organization = await OrganizationRepository.findById(user.userId);
        if (organization) {
          organizationData = {
            id: organization._id,
            name: organization.name,
            orgCode: organization.orgCode,
            code: organization.orgCode, // Keep for backward compatibility
            email: organization.email,
            phone: organization.phone,
            address: organization.address,
            logo: organization.logo || null, // CRITICAL: Include logo
            departments: organization.departments || [],
            setupCompleted: organization.setupCompleted || false,
            createdAt: organization.createdAt
          };
          dashboardData = {
            organizationId: organization._id,
            organizationName: organization.name,
            role: 'Organization Admin'
          };
        }
      } else if (user.userId.organizationId || user.userId.organization) {
        const orgId = user.userId.organizationId || user.userId.organization;
        const organization = await OrganizationRepository.findById(orgId);
        if (organization) {
          organizationData = {
            id: organization._id,
            name: organization.name,
            orgCode: organization.orgCode,
            code: organization.orgCode, // Keep for backward compatibility
            logo: organization.logo || null // CRITICAL: Include logo
          };
        }

        // Build dashboard data based on user type
        switch (user.userType) {
          case 'sub_admin':
            dashboardData = {
              organizationId: orgId,
              organizationName: organization?.name,
              role: 'Sub Admin'
            };
            break;
          case 'teacher':
            dashboardData = {
              teacherId: user.userId._id,
              organizationId: orgId,
              organizationName: organization?.name,
              subjects: user.userId.subjects || [],
              role: 'Teacher'
            };
            break;
          case 'student':
            dashboardData = {
              studentId: user.userId._id,
              organizationId: orgId,
              organizationName: organization?.name,
              academicLevel: user.userId.academicLevel,
              grade: user.userId.grade,
              role: 'Student'
            };
            break;
        }
      }
    }

    return {
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        firstLogin: user.firstLogin,
        organizationId: user.userType === 'organization_admin' 
          ? organizationData.id 
          : (user.userId?.organizationId || user.userId?.organization)
      },
      token,
      dashboard: dashboardData,
      organization: organizationData
    };
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} - { valid: boolean, decoded: object|null, user: object|null }
   */
  async verifyToken(token) {
    if (!token) {
      throw AppError.badRequest('Token is required');
    }

    const { decoded, error } = verifyToken(token);

    if (error) {
      return {
        valid: false,
        decoded: null,
        user: null,
        error: error.message
      };
    }

    // Fetch user to verify token version matches
    const user = await UserRepository.findById(decoded.userId, {
      select: '-password'
    });

    if (!user) {
      return {
        valid: false,
        decoded: null,
        user: null,
        error: 'User not found'
      };
    }

    // Check if account is active
    if (!user.isActive) {
      return {
        valid: false,
        decoded: null,
        user: null,
        error: 'Account is deactivated'
      };
    }

    // Verify token version matches (for revocation support)
    if (decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return {
        valid: false,
        decoded: null,
        user: null,
        error: 'Token has been revoked'
      };
    }

    return {
      valid: true,
      decoded,
      user: {
        id: user._id,
        email: user.email,
        userType: user.userType,
        organizationId: user.organizationId
      },
      error: null
    };
  }

  /**
   * Validate user credentials without authentication
   * @param {string} email - User email
   * @param {string} userType - User type
   * @returns {Promise<Object>} - { exists: boolean, isActive: boolean, isEmailVerified: boolean }
   */
  async validateCredentials(email, userType) {
    if (!email || !userType) {
      throw AppError.badRequest('Email and user type are required');
    }

    const userTypeEmail = `${email.toLowerCase()}_${userType}`;
    const user = await UserRepository.findOne({ userTypeEmail });

    if (!user) {
      return {
        exists: false,
        isActive: false,
        isEmailVerified: false
      };
    }

    return {
      exists: true,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified
    };
  }
}

module.exports = new AuthService();
