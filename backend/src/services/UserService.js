/**
 * UserService
 * Service layer for user operations
 * Handles user CRUD operations and business logic
 */

const UserRepository = require('../repositories/UserRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const TeacherRepository = require('../repositories/TeacherRepository');
const StudentRepository = require('../repositories/StudentRepository');
const InvitationRepository = require('../repositories/InvitationRepository');
const DepartmentRepository = require('../repositories/DepartmentRepository');
const TeacherService = require('./TeacherService');
const StudentService = require('./StudentService');
const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendTemporaryCredentialsEmail, sendInvitationEmail } = require('./emailService');
const { config } = require('../config/server');
const { logger } = require('../utils/logger');

class UserService {
  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - User document
   * @throws {AppError} - If user not found or unauthorized
   */
  async getUserById(userId, organizationId = null) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    const user = await UserRepository.findById(userId, {
      populate: 'userId',
      select: '-password'
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Organization scoping check (if provided)
    if (organizationId) {
      const userOrgId = user.organizationId || 
        (user.userId?.organizationId) || 
        (user.userId?.organization);
      
      if (userOrgId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: User does not belong to this organization');
      }
    }

    return user;
  }

  /**
   * Get users by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options (role, status, search, etc.)
   * @param {Object} pagination - Pagination options (page, limit)
   * @returns {Promise<Object>} - { users, total, pagination }
   * @throws {AppError} - If organization not found
   */
  async getUsersByOrganization(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
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
    
    if (filters.role) {
      filter.userType = filters.role;
    }
    
    if (filters.status !== undefined) {
      filter.isActive = filters.status === 'active';
    }
    
    if (filters.search) {
      filter.$or = [
        { email: { $regex: filters.search, $options: 'i' } }
      ];
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
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Created user
   * @throws {AppError} - If validation fails or user already exists
   */
  async createUser(userData, organizationId) {
    // Input validation
    if (!userData.email || !userData.userType) {
      throw AppError.badRequest('Email and user type are required');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Check if user already exists
    const userTypeEmail = `${userData.email.toLowerCase()}_${userData.userType}`;
    const existingUser = await UserRepository.findOne({ userTypeEmail });
    
    if (existingUser) {
      throw AppError.conflict('User with this email and type already exists');
    }

    // Set organization ID
    userData.organizationId = organizationId;
    userData.userTypeEmail = userTypeEmail;
    userData.email = userData.email.toLowerCase();

    // Create user
    const user = await UserRepository.create(userData);

    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;

    return userObj;
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Updated user
   * @throws {AppError} - If user not found or unauthorized
   */
  async updateUser(userId, updateData, organizationId = null) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    // Get existing user
    const existingUser = await UserRepository.findById(userId);
    if (!existingUser) {
      throw AppError.notFound('User not found');
    }

    // Organization scoping check
    if (organizationId) {
      const userOrgId = existingUser.organizationId || 
        (existingUser.userId?.organizationId) || 
        (existingUser.userId?.organization);
      
      if (userOrgId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: User does not belong to this organization');
      }
    }

    // Prevent email and userType changes (these are critical fields)
    if (updateData.email || updateData.userType) {
      throw AppError.badRequest('Email and user type cannot be changed');
    }

    // Update user
    const updatedUser = await UserRepository.updateById(userId, updateData, {
      select: '-password'
    });

    if (!updatedUser) {
      throw AppError.notFound('User not found after update');
    }

    return updatedUser;
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If user not found or unauthorized
   */
  async deleteUser(userId, organizationId = null) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    // Get existing user
    const existingUser = await UserRepository.findById(userId);
    if (!existingUser) {
      throw AppError.notFound('User not found');
    }

    // Organization scoping check
    if (organizationId) {
      const userOrgId = existingUser.organizationId || 
        (existingUser.userId?.organizationId) || 
        (existingUser.userId?.organization);
      
      if (userOrgId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: User does not belong to this organization');
      }
    }

    // Delete user
    const deletedUser = await UserRepository.deleteById(userId);

    if (!deletedUser) {
      throw AppError.notFound('User not found');
    }

    return {
      success: true,
      message: 'User deleted successfully',
      userId: deletedUser._id
    };
  }

  /**
   * Create user management (teacher or student) with temporary credentials
   * @param {Object} data - User creation data
   * @param {string} organizationId - Organization ID
   * @param {string} createdBy - User ID who created this user
   * @returns {Promise<Object>} - Created user and related record
   * @throws {AppError} - If validation fails or user already exists
   */
  async createUserManagement(data, organizationId, createdBy) {
    const {
      firstName,
      lastName,
      email,
      phone,
      countryCode = '+1',
      role,
      department,
      status = 'active',
      dateOfBirth,
      // Teacher specific fields
      subjects = [],
      teacherRole = 'teacher',
      affiliationType = 'organization',
      experienceLevel,
      currentInstitution,
      yearsOfExperience,
      // Student specific fields
      gender,
      academicYear,
      grade,
      section,
      rollNumber,
      studentSubjects = []
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !organizationId) {
      throw AppError.badRequest('Missing required fields: firstName, lastName, email, role, organizationId');
    }

    // Check if user already exists
    const existingUser = await UserRepository.findOne({ 
      email: email.toLowerCase()
    });

    if (existingUser) {
      // If user exists and is pending registration, update their details
      if (existingUser.authProvider === 'pending_registration' && !existingUser.isRegistrationComplete) {
        if (process.env.NODE_ENV === 'development') {
          logger.info('[USER_SERVICE] Updating existing pending user', { email: existingUser.email });
        }
        
        // Generate temporary credentials
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
        const organization = await OrganizationRepository.findById(organizationId);
        const orgCode = organization?.orgCode || 'ORG001';

        // Update the existing user with temporary credentials
        const updateData = {
          password: hashedTempPassword,
          isActive: true,
          authProvider: 'temp_password',
          isRegistrationComplete: true,
          isEmailVerified: true,
          firstLogin: true,
          profile: {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone: phone ? `${countryCode}${phone}` : null,
            role: role,
            department
          }
        };

        const updatedUser = await UserRepository.updateById(existingUser._id, updateData);

        // Update the associated Teacher or Student record
        if (role === 'teacher' && existingUser.userId) {
          const teacherData = {
            firstName,
            lastName,
            phoneNumber: phone || '0000000000',
            countryCode,
            department,
            subjects: subjects || [],
            experienceLevel: experienceLevel || 'beginner',
            currentInstitution: currentInstitution || 'Unknown',
            yearsOfExperience: yearsOfExperience || 0,
            organizationCode: orgCode
          };
          await TeacherRepository.updateById(existingUser.userId, teacherData);
        } else if (role === 'student' && existingUser.userId) {
          const studentData = {
            fullName: `${firstName} ${lastName}`,
            phoneNumber: phone || '0000000000',
            countryCode,
            department,
            academicYear: academicYear || '2024-25',
            grade: grade || '10',
            section: section || 'A',
            organizationCode: orgCode
          };
          await StudentRepository.updateById(existingUser.userId, studentData);
        }

        // Send temporary credentials email
        const emailResult = await sendTemporaryCredentialsEmail(
          email, 
          `${firstName} ${lastName}`, 
          tempPassword, 
          role
        );
        
        if (emailResult.success) {
          logger.info('[USER_SERVICE] Temporary credentials email sent successfully', { email: email });
        } else {
          logger.error('[USER_SERVICE] Failed to send temporary credentials email', { error: emailResult.error, email: email });
        }

        return {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            userType: updatedUser.userType,
            isActive: updatedUser.isActive,
            isRegistrationComplete: updatedUser.isRegistrationComplete,
            firstLogin: updatedUser.firstLogin
          }
        };
      } else {
        // User exists and is not pending registration
        const existingUserType = existingUser.userType;
        const requestedRole = role;
        
        if (existingUserType !== requestedRole) {
          throw AppError.badRequest(
            `User with this email already exists as a ${existingUserType}. Cannot create a ${requestedRole} account with the same email.`,
            {
              existingUserType,
              requestedRole,
              suggestion: `Try using a different email or update the existing ${existingUserType} account.`
            }
          );
        } else {
          throw AppError.badRequest(
            `A ${existingUserType} account with this email already exists and has completed registration.`,
            {
              existingUserType,
              suggestion: 'Try using a different email or update the existing account.'
            }
          );
        }
      }
    }

    // Check if userTypeEmail already exists (for the specific user type)
    const existingUserTypeEmail = await UserRepository.findOne({
      userTypeEmail: `${email.toLowerCase()}_${role}`
    });

    if (existingUserTypeEmail) {
      throw AppError.badRequest(`A ${role} account with this email already exists`);
    }

    // Generate temporary credentials
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 12);
    
    // Get organization details
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }
    const orgCode = organization.orgCode || 'ORG001';

    let createdUser = null;
    let userRecord = null;

    if (role === 'teacher') {
      // Create Teacher record
      const teacherData = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        emailAddress: email.toLowerCase(),
        phoneNumber: phone || '0000000000',
        countryCode,
        employeeId: `EMP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        country: 'India',
        city: 'Unknown',
        pincode: '000000',
        subjects: subjects || [],
        teacherRole: teacherRole,
        role: teacherRole,
        affiliationType,
        experienceLevel: experienceLevel || 'beginner',
        currentInstitution: currentInstitution || 'Unknown',
        yearsOfExperience: yearsOfExperience || 0,
        organizationId,
        organization: organizationId,
        organizationCode: orgCode,
        status: status === 'active' ? 'active' : 'inactive',
        createdBy: createdBy
      };

      // Set organization validation
      if (affiliationType === 'organization') {
        teacherData.isOrganizationValid = true;
        teacherData.associationStatus = 'verified';
      } else {
        teacherData.associationStatus = 'freelance';
      }

      userRecord = await TeacherService.createTeacher(teacherData, organizationId);

      // Create User record for teacher with temporary credentials
      const userData = {
        email: email.toLowerCase(),
        password: hashedTempPassword,
        userType: 'teacher',
        userId: userRecord._id,
        userModel: 'Teacher',
        userTypeEmail: `${email.toLowerCase()}_teacher`,
        isActive: true,
        authProvider: 'temp_password',
        isRegistrationComplete: true,
        isEmailVerified: true,
        firstLogin: true,
        organizationId: organizationId,
        profile: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone ? `${countryCode}${phone}` : null,
          role: 'teacher',
          department
        }
      };

      if (process.env.NODE_ENV === 'development') {
        logger.info('[USER_SERVICE] Creating User record for teacher', {
          userType: userData.userType,
          organizationId: userData.organizationId
        });
      }

      if (!userData.organizationId) {
        throw AppError.badRequest('organizationId is required for teacher user creation');
      }
      
      createdUser = await UserRepository.create(userData);

    } else if (role === 'student') {
      // Create Student record
      const studentData = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        emailAddress: email.toLowerCase(),
        phoneNumber: phone || '0000000000',
        countryCode,
        studentId: `STU${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1990-01-01'),
        gender: gender || 'other',
        country: 'India',
        city: 'Unknown',
        pincode: '000000',
        organizationId,
        organization: organizationId,
        organizationCode: orgCode,
        academicYear: academicYear || '2024-25',
        grade: grade || '1',
        section: section || 'A',
        rollNumber: rollNumber || '001',
        subjects: studentSubjects || [],
        status: status === 'active' ? 'active' : 'inactive',
        createdBy: createdBy
      };

      // Set organization validation
      studentData.isOrganizationValid = true;
      studentData.associationStatus = 'verified';

      userRecord = await StudentService.createStudent(studentData, organizationId);

      // Create User record for student with temporary credentials
      const userData = {
        email: email.toLowerCase(),
        password: hashedTempPassword,
        userType: 'student',
        userId: userRecord._id,
        userModel: 'Student',
        userTypeEmail: `${email.toLowerCase()}_student`,
        isActive: true,
        authProvider: 'temp_password',
        isRegistrationComplete: true,
        isEmailVerified: false,
        firstLogin: true,
        organizationId: organizationId,
        profile: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          phone: phone ? `${countryCode}${phone}` : null,
          role: 'student',
          department
        }
      };

      if (process.env.NODE_ENV === 'development') {
        logger.info('[USER_SERVICE] Creating User record for student', {
          userType: userData.userType,
          organizationId: userData.organizationId
        });
      }

      if (!userData.organizationId) {
        throw AppError.badRequest('organizationId is required for student user creation');
      }
      
      createdUser = await UserRepository.create(userData);
    } else {
      throw AppError.badRequest('Invalid role. Only "teacher" and "student" are supported');
    }

    // Validate user was created successfully
    if (!createdUser.organizationId) {
      // Clean up the Teacher/Student record if user creation failed validation
      if (userRecord) {
        if (role === 'teacher') {
          await TeacherService.deleteTeacherByUserId(userRecord._id);
        } else if (role === 'student') {
          await StudentService.deleteStudentByUserId(userRecord._id);
        }
      }
      throw AppError.internal('CRITICAL: User was saved without organizationId!');
    }

    logger.info('[USER_SERVICE] User record created successfully', { userId: createdUser._id, userType: createdUser.userType });
    logger.info('[USER_SERVICE] User organizationId validated', { organizationId: createdUser.organizationId });

    // Send temporary credentials email
    const emailResult = await sendTemporaryCredentialsEmail(
      email, 
      `${firstName} ${lastName}`, 
      tempPassword, 
      role
    );
    
    if (emailResult.success) {
      console.log('📧 Temporary credentials email sent successfully');
    } else {
      console.error('❌ Failed to send temporary credentials email:', emailResult.error);
    }

    // Return success response
    return {
      user: {
        id: createdUser._id,
        email: createdUser.email,
        userType: createdUser.userType,
        isActive: createdUser.isActive,
        isRegistrationComplete: createdUser.isRegistrationComplete,
        firstLogin: createdUser.firstLogin,
        profile: createdUser.profile
      },
      userRecord: {
        id: userRecord._id,
        fullName: userRecord.fullName,
        email: userRecord.emailAddress || userRecord.email,
        status: userRecord.status
      }
    };
  }

  /**
   * Delete user management (with related teacher/student records)
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If user not found or unauthorized
   */
  async deleteUserManagement(userId, organizationId) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    // Try to find user by ID first
    let user = await UserRepository.findById(userId, {
      populate: 'userId',
      select: '-password'
    });

    // If not found, it might be a Teacher/Student ID - try to find User by userId field
    if (!user) {
      user = await UserRepository.findOne({
        userId: userId,
        organizationId: organizationId
      }, {
        populate: 'userId',
        select: '-password'
      });
    }

    // If still not found, it might be a Teacher/Student ID without a User record
    // Try to delete the Teacher/Student directly
    if (!user) {
      // Check if it's a Teacher ID
      const teacher = await TeacherRepository.findById(userId);
      if (teacher) {
        const teacherOrgId = teacher.organization?._id?.toString() || teacher.organization?.toString();
        if (teacherOrgId === organizationId.toString()) {
          await TeacherService.deleteTeacherByUserId(userId);
          logger.info('[USER_SERVICE] Deleted teacher record (no User record found)', { teacherId: userId });
          return {
            success: true,
            message: 'Teacher permanently deleted successfully'
          };
        }
      }

      // Check if it's a Student ID
      const student = await StudentRepository.findById(userId);
      if (student) {
        const studentOrgId = student.organization?._id?.toString() || student.organization?.toString();
        if (studentOrgId === organizationId.toString()) {
          await StudentService.deleteStudentByUserId(userId);
          logger.info('[USER_SERVICE] Deleted student record (no User record found)', { studentId: userId });
          return {
            success: true,
            message: 'Student permanently deleted successfully'
          };
        }
      }

      // If neither Teacher nor Student found, throw error
      throw AppError.notFound('User not found');
    }

    // Organization scoping check
    if (organizationId) {
      const userOrgId = user.organizationId || 
        (user.userId?.organizationId) || 
        (user.userId?.organization);
      
      if (userOrgId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: User does not belong to this organization');
      }
    }

    // Delete related Teacher/Student record if exists
    if (user.userType === 'teacher' && user.userId) {
      await TeacherService.deleteTeacherByUserId(user.userId);
      logger.info('[USER_SERVICE] Deleted related teacher record', { userId: user.userId });
    } else if (user.userType === 'student' && user.userId) {
      await StudentService.deleteStudentByUserId(user.userId);
      logger.info('[USER_SERVICE] Deleted related student record', { userId: user.userId });
    }

    // Delete the user record
    await this.deleteUser(user._id, organizationId);
    logger.info('[USER_SERVICE] Permanently deleted user', { userId: user._id });

    return {
      success: true,
      message: 'User permanently deleted successfully'
    };
  }

  /**
   * Toggle user status (activate/suspend)
   * @param {string} userId - User ID
   * @param {string} organizationId - Organization ID
   * @param {string} action - 'activate' or 'suspend'
   * @returns {Promise<Object>} - Updated user
   * @throws {AppError} - If user not found or invalid action
   */
  async toggleUserStatus(userId, organizationId, action) {
    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    if (!action || !['suspend', 'activate'].includes(action)) {
      throw AppError.badRequest('Invalid action. Must be "suspend" or "activate"');
    }

    const isActive = action === 'activate';
    
    // Get user to verify organization match
    const user = await this.getUserById(userId, organizationId);

    // Update user status
    const updatedUser = await this.updateUser(userId, { isActive }, organizationId);

    const statusText = isActive ? 'activated' : 'suspended';
    logger.info(`[USER_SERVICE] User ${statusText}`, { userId, status });

    return {
      _id: updatedUser._id,
      email: updatedUser.email,
      isActive: updatedUser.isActive,
      status: updatedUser.isActive ? 'active' : 'inactive'
    };
  }

  /**
   * Get all user managements for an organization with filtering, pagination, and data transformation
   * @param {Object} filters - Filter options (page, limit, role, status, search, departmentId, userType)
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - { users, pagination }
   * @throws {AppError} - If organization not found or validation fails
   */
  async getAllUserManagements(filters, organizationId) {
    const { page = 1, limit = 10, role, status, search, departmentId, userType } = filters;

    // Validate organization
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Get all users for this organization - both org admins and regular users
    let organizationUsers = await UserRepository.findAll({
      $or: [
        { organizationId: organizationId }, // Regular users (teachers, students)
        { userType: 'organization_admin', userId: organizationId } // Organization admin users
      ]
    }, {
      select: '-password',
      sort: { createdAt: -1 }
    });

    // Handle department hierarchy and fetch teachers/students
    if (departmentId && userType === 'teacher') {
      // Get the current department and its hierarchy
      const currentDepartment = await DepartmentRepository.findById(departmentId);
      
      if (!currentDepartment) {
        throw AppError.notFound('Department not found');
      }

      // Get all parent departments in the hierarchy
      const hierarchyPath = await currentDepartment.getHierarchyPath();
      const parentDepartmentIds = hierarchyPath.map(dept => dept.id);
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('[USER_SERVICE] Department hierarchy for teacher assignment', {
          currentDepartment: currentDepartment.name,
          hierarchyPath: hierarchyPath.map(h => ({ name: h.name, id: h.id })),
          parentDepartmentIds
        });
      }

      // Fetch teachers from current department AND all parent departments
      const teachersInDepartment = await TeacherRepository.findAll({
        organization: organizationId,
        departments: { $in: parentDepartmentIds }
      }, {
        select: 'firstName lastName email phoneNumber subjects role organizationName yearsOfExperience status departments organization createdAt'
      });

      // Convert Teacher model entries to User-like format for consistency
      const teacherUsers = teachersInDepartment.map(teacher => ({
        _id: teacher._id,
        email: teacher.email,
        userType: 'teacher',
        userId: teacher._id,
        isActive: teacher.status === 'active',
        organizationId: teacher.organization,
        profile: {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phoneNumber,
          department: teacher.departments
        },
        createdAt: teacher.createdAt,
        teacherData: {
          subjects: teacher.subjects,
          yearsOfExperience: teacher.yearsOfExperience,
          role: teacher.role,
          organizationName: teacher.organizationName
        }
      }));

      organizationUsers = [...organizationUsers, ...teacherUsers];
      
    } else if (departmentId && userType === 'student') {
      // Get department hierarchy for student assignment
      const currentDepartment = await DepartmentRepository.findById(departmentId);
      let parentDepartmentIds = [departmentId]; // Include current department
      
      if (currentDepartment) {
        const hierarchyPath = await currentDepartment.getHierarchyPath();
        
        if (process.env.NODE_ENV === 'development') {
          logger.info('[USER_SERVICE] Department hierarchy for student assignment', {
            currentDepartment: currentDepartment.name,
            hierarchyPath: hierarchyPath.map(dept => ({ name: dept.name, id: dept.id })),
            parentDepartmentIds: hierarchyPath.map(dept => dept.id)
          });
        }
        
        parentDepartmentIds = hierarchyPath.map(dept => dept.id);
      }

      // Fetch students from current department AND all parent departments (hierarchical)
      const studentsInDepartment = await StudentRepository.findAll({
        organization: organizationId,
        department: { $in: parentDepartmentIds }
      }, {
        select: 'firstName lastName email phoneNumber academicYear grade section rollNumber studentCode status department organization createdAt'
      });

      // Convert Student model entries to User-like format for consistency
      const studentUsers = studentsInDepartment.map(student => ({
        _id: student._id,
        email: student.email,
        userType: 'student',
        userId: student._id,
        isActive: student.status === 'active',
        organizationId: student.organization,
        profile: {
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phoneNumber,
          department: student.department
        },
        createdAt: student.createdAt,
        studentData: {
          academicYear: student.academicYear,
          grade: student.grade,
          section: student.section,
          rollNumber: student.rollNumber,
          studentCode: student.studentCode
        }
      }));

      organizationUsers = [...organizationUsers, ...studentUsers];
      
    } else if (!departmentId) {
      // Fetch ALL teachers and students from organization (no department filter)
      const allTeachers = await TeacherRepository.findAll({
        organization: organizationId
      }, {
        select: 'firstName lastName email phoneNumber subjects role organizationName yearsOfExperience status departments organization createdAt'
      });

      const allStudents = await StudentRepository.findAll({
        organization: organizationId
      }, {
        select: 'firstName lastName email phoneNumber academicYear grade section rollNumber studentCode status department organization createdAt'
      });

      // Convert teachers
      const teacherUsers = allTeachers.map(teacher => ({
        _id: teacher._id,
        email: teacher.email,
        userType: 'teacher',
        userId: teacher._id,
        isActive: teacher.status === 'active',
        organizationId: teacher.organization,
        profile: {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phoneNumber,
          department: teacher.departments
        },
        createdAt: teacher.createdAt,
        teacherData: {
          subjects: teacher.subjects,
          yearsOfExperience: teacher.yearsOfExperience,
          role: teacher.role,
          organizationName: teacher.organizationName
        }
      }));

      // Convert students
      const studentUsers = allStudents.map(student => ({
        _id: student._id,
        email: student.email,
        userType: 'student',
        userId: student._id,
        isActive: student.status === 'active',
        organizationId: student.organization,
        profile: {
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phoneNumber,
          department: student.department
        },
        createdAt: student.createdAt,
        studentData: {
          academicYear: student.academicYear,
          grade: student.grade,
          section: student.section,
          rollNumber: student.rollNumber,
          studentCode: student.studentCode
        }
      }));

      organizationUsers = [...organizationUsers, ...teacherUsers, ...studentUsers];
    }

    // Apply filters
    if (role && role !== 'all') {
      organizationUsers = organizationUsers.filter(user => user.userType === role);
    }
    
    if (userType && userType !== 'all') {
      organizationUsers = organizationUsers.filter(user => user.userType === userType);
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        organizationUsers = organizationUsers.filter(user => user.isActive);
      } else if (status === 'inactive') {
        organizationUsers = organizationUsers.filter(user => !user.isActive);
      }
    }
    
    if (search) {
      organizationUsers = organizationUsers.filter(user => 
        (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(search.toLowerCase())) ||
        (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(search.toLowerCase())) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const total = organizationUsers.length;
    const skip = (page - 1) * limit;
    const paginatedUsers = organizationUsers.slice(skip, skip + parseInt(limit));

    // Fetch complete user data including Teacher/Student details
    const formattedUsers = await Promise.all(paginatedUsers.map(async (user) => {
      let additionalData = {};
      
      // If user already has teacherData (from direct Teacher model fetch), use it
      if (user.teacherData) {
        additionalData = {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          department: user.profile?.department || '',
          subjects: user.teacherData.subjects || [],
          experienceLevel: user.teacherData.experienceLevel || '',
          yearsOfExperience: user.teacherData.yearsOfExperience || '',
          qualification: user.teacherData.qualification || '',
          specialization: user.teacherData.specialization || '',
          address: user.teacherData.address || '',
          dateOfBirth: user.teacherData.dateOfBirth || '',
          emergencyContact: user.teacherData.emergencyContact || '',
          notes: user.teacherData.notes || ''
        };
      } else if (user.studentData) {
        // If user already has studentData (from direct Student model fetch), use it
        additionalData = {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          department: user.profile?.department || '',
          academicYear: user.studentData.academicYear || '',
          grade: user.studentData.grade || '',
          section: user.studentData.section || '',
          rollNumber: user.studentData.rollNumber || '',
          studentCode: user.studentData.studentCode || '',
          address: user.studentData.address || '',
          dateOfBirth: user.studentData.dateOfBirth || '',
          emergencyContact: user.studentData.emergencyContact || '',
          parentName: user.studentData.parentName || '',
          parentPhone: user.studentData.parentPhone || '',
          notes: user.studentData.notes || ''
        };
      } else if (user.userType === 'teacher' && user.userId) {
        try {
          const teacher = await TeacherRepository.findById(user.userId);
          if (teacher) {
            additionalData = {
              firstName: teacher.fullName?.split(' ')[0] || teacher.firstName || '',
              lastName: teacher.fullName?.split(' ').slice(1).join(' ') || teacher.lastName || '',
              phone: teacher.phoneNumber || '',
              department: teacher.department || teacher.departments || '',
              subjects: teacher.subjects || [],
              experienceLevel: teacher.experienceLevel || '',
              yearsOfExperience: teacher.yearsOfExperience || '',
              qualification: teacher.qualification || '',
              specialization: teacher.specialization || '',
              address: teacher.address || '',
              dateOfBirth: teacher.dateOfBirth || '',
              emergencyContact: teacher.emergencyContact || '',
              notes: teacher.notes || ''
            };
          }
        } catch (error) {
          logger.error('[USER_SERVICE] Error fetching teacher data', { error: error.message });
        }
      } else if (user.userType === 'student' && user.userId) {
        try {
          const student = await StudentRepository.findById(user.userId);
          if (student) {
            additionalData = {
              firstName: student.fullName?.split(' ')[0] || student.firstName || '',
              lastName: student.fullName?.split(' ').slice(1).join(' ') || student.lastName || '',
              phone: student.phoneNumber || '',
              department: student.department || '',
              academicYear: student.academicYear || '',
              grade: student.grade || '',
              section: student.section || '',
              rollNumber: student.rollNumber || '',
              studentCode: student.studentCode || '',
              address: student.address || '',
              dateOfBirth: student.dateOfBirth || '',
              emergencyContact: student.emergencyContact || '',
              parentName: student.parentName || '',
              parentPhone: student.parentPhone || '',
              notes: student.notes || ''
            };
          }
        } catch (error) {
          logger.error('[USER_SERVICE] Error fetching student data', { error: error.message });
        }
      } else if (user.userType === 'organization_admin') {
        // For organization admin, use profile data if available
        additionalData = {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          phone: user.profile?.phone || '',
          department: 'Administration',
          address: user.profile?.address || '',
          notes: user.profile?.notes || ''
        };
      }

      const firstName = additionalData.firstName || user.profile?.firstName || '';
      const lastName = additionalData.lastName || user.profile?.lastName || '';
      
      return {
        _id: user._id,
        firstName,
        lastName,
        fullName: firstName && lastName ? `${firstName} ${lastName}` : '',
        email: user.email,
        emailAddress: user.email,
        phone: additionalData.phone || '',
        userType: user.userType,
        status: user.isActive ? 'active' : 'inactive',
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        department: additionalData.department || user.profile?.department || '',
        isEmailVerified: user.isEmailVerified || false,
        phoneVerified: user.phoneVerified || false,
        // Teacher specific fields
        subjects: additionalData.subjects || [],
        experienceLevel: additionalData.experienceLevel || '',
        yearsOfExperience: additionalData.yearsOfExperience || '',
        qualification: additionalData.qualification || '',
        specialization: additionalData.specialization || '',
        // Student specific fields
        academicYear: additionalData.academicYear || '',
        grade: additionalData.grade || '',
        section: additionalData.section || '',
        rollNumber: additionalData.rollNumber || '',
        studentCode: additionalData.studentCode || '',
        parentName: additionalData.parentName || '',
        parentPhone: additionalData.parentPhone || '',
        // Common fields
        address: additionalData.address || '',
        dateOfBirth: additionalData.dateOfBirth || '',
        emergencyContact: additionalData.emergencyContact || '',
        notes: additionalData.notes || ''
      };
    }));

    return {
      users: formattedUsers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    };
  }

  /**
   * Get user statistics for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - User statistics
   * @throws {AppError} - If organization not found
   */
  async getUserStatistics(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Get all users for this organization - use the same logic as getAllUserManagements
    let organizationUsers = await UserRepository.findAll({
      $or: [
        { organizationId: organizationId }, // Regular users (teachers, students)
        { userType: 'organization_admin', userId: organizationId } // Organization admin users
      ]
    });

    // Also fetch teachers and students from their respective models (same logic as getAllUserManagements)
    const allTeachers = await TeacherRepository.findAll({
      organization: organizationId
    }, {
      select: 'firstName lastName email phoneNumber subjects role organizationName yearsOfExperience status departments organization createdAt'
    });

    const allStudents = await StudentRepository.findAll({
      organization: organizationId
    }, {
      select: 'firstName lastName email phoneNumber academicYear grade section rollNumber studentCode status department organization createdAt'
    });

    // Convert teachers to User-like format
    const teacherUsers = allTeachers.map(teacher => ({
      _id: teacher._id,
      email: teacher.email,
      userType: 'teacher',
      userId: teacher._id,
      isActive: teacher.status === 'active',
      organizationId: teacher.organization,
      profile: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phoneNumber,
        department: teacher.departments
      },
      createdAt: teacher.createdAt,
      teacherData: {
        subjects: teacher.subjects,
        yearsOfExperience: teacher.yearsOfExperience,
        role: teacher.role,
        organizationName: teacher.organizationName
      }
    }));

    // Convert students to User-like format
    const studentUsers = allStudents.map(student => ({
      _id: student._id,
      email: student.email,
      userType: 'student',
      userId: student._id,
      isActive: student.status === 'active',
      organizationId: student.organization,
      profile: {
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phoneNumber,
        department: student.department
      },
      createdAt: student.createdAt,
      studentData: {
        academicYear: student.academicYear,
        grade: student.grade,
        section: student.section,
        rollNumber: student.rollNumber,
        studentCode: student.studentCode
      }
    }));

    // Combine all users
    organizationUsers = [...organizationUsers, ...teacherUsers, ...studentUsers];

    if (process.env.NODE_ENV === 'development') {
      logger.info('[USER_SERVICE] User Management Stats - Found users', {
        totalUsers: organizationUsers.length,
        users: organizationUsers.map(u => ({
          id: u._id,
          email: u.email,
          userType: u.userType,
          isActive: u.isActive,
          organizationId: u.organizationId
        }))
      });
    }

    // Calculate stats
    const stats = {
      total: organizationUsers.length,
      active: organizationUsers.filter(u => u.isActive).length,
      pending: 0, // No pending status in current User model
      inactive: organizationUsers.filter(u => !u.isActive).length,
      suspended: 0, // No suspended status in current User model
      teachers: organizationUsers.filter(u => u.userType === 'teacher').length,
      students: organizationUsers.filter(u => u.userType === 'student').length,
      admins: organizationUsers.filter(u => u.userType === 'organization_admin').length,
      emailVerified: organizationUsers.filter(u => u.isEmailVerified).length,
      phoneVerified: 0 // No phone verification in current User model
    };

    if (process.env.NODE_ENV === 'development') {
      logger.info('[USER_SERVICE] User Management Stats - Calculated stats', { stats });
    }

    return stats;
  }

  /**
   * Bulk create users (teachers/students) from array
   * @param {Array} rows - Array of user data objects
   * @param {string} organizationId - Organization ID
   * @param {string} createdBy - User ID who created these users
   * @returns {Promise<Object>} - { successful, failed, total, successCount, failureCount }
   * @throws {AppError} - If validation fails
   */
  async bulkCreateUsers(rows, organizationId, createdBy) {
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      throw AppError.badRequest('No users provided for bulk creation');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    const orgCode = organization.orgCode || 'ORG001';

    const results = {
      successful: [],
      failed: [],
      total: rows.length
    };

    for (const userData of rows) {
      try {
        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.userType) {
          results.failed.push({
            email: userData.email || 'unknown',
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await UserRepository.findByEmail(userData.email.toLowerCase(), organizationId);

        if (existingUser) {
          results.failed.push({
            email: userData.email,
            error: 'User already exists'
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).substring(2, 15);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create user based on userType
        let createdUser;
        let createdProfile;
        
        if (userData.userType === 'teacher') {
          // Create Teacher profile
          const teacherData = {
            fullName: `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailAddress: userData.email.toLowerCase(),
            phoneNumber: userData.phone || '',
            countryCode: '+91',
            country: 'India',
            city: 'Mumbai',
            pincode: '400001',
            department: userData.department || '',
            organizationId: organizationId,
            organization: organizationId,
            organizationCode: orgCode,
            status: 'active',
            subjects: [],
            role: 'teacher',
            affiliationType: 'organization',
            experienceLevel: 'beginner',
            yearsOfExperience: 0,
            qualification: '',
            specialization: '',
            address: '',
            dateOfBirth: new Date('1990-01-01'),
            emergencyContact: '',
            notes: '',
            createdBy: createdBy
          };
          
          createdProfile = await TeacherService.createTeacher(teacherData, organizationId);
          
          // Create User account
          const userDataObj = {
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            userType: 'teacher',
            userId: createdProfile._id,
            organizationId: organizationId,
            userTypeEmail: `${userData.email.toLowerCase()}_${userData.userType}`,
            userModel: 'Teacher',
            authProvider: 'temp_password',
            isRegistrationComplete: true,
            isActive: true,
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || '',
              department: userData.department || ''
            },
            emailVerified: false,
            phoneVerified: false,
            firstLogin: true
          };
          
          createdUser = await UserRepository.create(userDataObj);
          
        } else if (userData.userType === 'student') {
          // Create Student profile
          const studentData = {
            fullName: `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailAddress: userData.email.toLowerCase(),
            phoneNumber: userData.phone || '',
            countryCode: '+91',
            dateOfBirth: new Date('2000-01-01'),
            gender: 'other',
            country: 'India',
            city: 'Mumbai',
            pincode: '400001',
            organizationId: organizationId,
            organization: organizationId,
            organizationCode: orgCode,
            status: 'active',
            studentId: `STU${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            address: '',
            emergencyContact: '',
            parentGuardianName: '',
            parentGuardianPhone: '',
            parentGuardianEmail: '',
            notes: '',
            grade: userData.grade || 'Grade 10',
            section: userData.section || 'A',
            rollNumber: userData.rollNumber || `STU${Date.now()}`,
            academicYear: userData.academicYear || '2024-2025',
            subjects: [],
            createdBy: createdBy
          };
          
          createdProfile = await StudentService.createStudent(studentData, organizationId);
          
          // Create User account
          const userDataObj = {
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            userType: 'student',
            userId: createdProfile._id,
            organizationId: organizationId,
            userTypeEmail: `${userData.email.toLowerCase()}_${userData.userType}`,
            userModel: 'Student',
            authProvider: 'temp_password',
            isRegistrationComplete: true,
            isActive: true,
            profile: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              phone: userData.phone || '',
              department: userData.department || ''
            },
            emailVerified: false,
            phoneVerified: false,
            firstLogin: true
          };
          
          createdUser = await UserRepository.create(userDataObj);
        } else {
          results.failed.push({
            email: userData.email,
            error: 'Invalid user type. Must be teacher or student.'
          });
          continue;
        }
        
        // Send email notification if requested
        if (userData.sendEmailNotification) {
          try {
            await sendTemporaryCredentialsEmail(
              userData.email,
              userData.firstName,
              tempPassword,
              userData.userType
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the user creation if email fails
          }
        }
        
        results.successful.push({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          userType: userData.userType,
          tempPassword: tempPassword,
          userId: createdUser._id,
          profileId: createdProfile._id
        });

      } catch (error) {
        results.failed.push({
          email: userData.email || 'unknown',
          error: error.message
        });
      }
    }

    return {
      results: [...results.successful, ...results.failed],
      successCount: results.successful.length,
      failureCount: results.failed.length,
      total: results.total
    };
  }

  /**
   * Bulk update users with validation and role-change handling
   * @param {Object} payload - Update payload with users array
   * @param {string} organizationId - Organization ID
   * @param {string} updatedBy - User ID who performed the update
   * @returns {Promise<Object>} - { successCount, failedCount, failedRows }
   * @throws {AppError} - If validation fails
   */
  async bulkUpdateUsers(payload, organizationId, updatedBy) {
    if (!payload || !payload.users || !Array.isArray(payload.users) || payload.users.length === 0) {
      throw AppError.badRequest('Users array is required for bulk update');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Define allowed and rejected fields
    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'status', 'department', 'grade', 'section', 'class', 'division'];
    const rejectedFields = ['password', 'createdAt', 'updatedAt', '_id', 'organizationId', 'userId', 'userTypeEmail', 'userModel', 'authProvider'];

    const results = {
      successful: [],
      failed: [],
      total: payload.users.length
    };

    for (const updateEntry of payload.users) {
      try {
        // Validate required fields
        if (!updateEntry.userId) {
          results.failed.push({
            userId: updateEntry.userId || 'unknown',
            reason: 'User ID is required'
          });
          continue;
        }

        if (!updateEntry.fields || typeof updateEntry.fields !== 'object') {
          results.failed.push({
            userId: updateEntry.userId,
            reason: 'Fields object is required'
          });
          continue;
        }

        // Get user
        const user = await UserRepository.findById(updateEntry.userId);
        if (!user) {
          results.failed.push({
            userId: updateEntry.userId,
            reason: 'User not found'
          });
          continue;
        }

        // Organization scoping check
        const userOrgId = user.organizationId?.toString() || 
          (user.userType === 'organization_admin' ? user.userId?.toString() : null);
        
        if (userOrgId !== organizationId.toString()) {
          results.failed.push({
            userId: updateEntry.userId,
            reason: 'User does not belong to this organization'
          });
          continue;
        }

        // Validate and filter fields
        const updates = {};
        const rejectedUpdates = [];

        for (const [key, value] of Object.entries(updateEntry.fields)) {
          if (rejectedFields.includes(key)) {
            rejectedUpdates.push(key);
            continue;
          }

          if (allowedFields.includes(key)) {
            updates[key] = value;
          } else {
            rejectedUpdates.push(key);
          }
        }

        if (rejectedUpdates.length > 0) {
          results.failed.push({
            userId: updateEntry.userId,
            reason: `Invalid fields: ${rejectedUpdates.join(', ')}`
          });
          continue;
        }

        // Check email uniqueness if email is being updated
        if (updates.email && updates.email !== user.email) {
          const existingUser = await UserRepository.findByEmail(updates.email.toLowerCase(), organizationId);
          if (existingUser && existingUser._id.toString() !== updateEntry.userId) {
            results.failed.push({
              userId: updateEntry.userId,
              reason: 'Email already exists in this organization'
            });
            continue;
          }
        }

        // Check phone uniqueness if phone is being updated
        if (updates.phone) {
          const existingUser = await UserRepository.findByPhone(updates.phone, organizationId);
          if (existingUser && existingUser._id.toString() !== updateEntry.userId) {
            results.failed.push({
              userId: updateEntry.userId,
              reason: 'Phone number already exists in this organization'
            });
            continue;
          }
        }

        // Handle role change
        const oldRole = user.userType;
        const newRole = updates.role || oldRole;
        const isRoleChange = oldRole !== newRole;

        if (isRoleChange) {
          // Handle Teacher → Student transition
          if (oldRole === 'teacher' && newRole === 'student') {
            // Delete teacher record
            await TeacherService.deleteTeacherByUserId(user.userId);
            
            // Create student record
            const studentData = {
              fullName: `${updates.firstName || user.profile?.firstName || ''} ${updates.lastName || user.profile?.lastName || ''}`,
              firstName: updates.firstName || user.profile?.firstName || '',
              lastName: updates.lastName || user.profile?.lastName || '',
              emailAddress: updates.email || user.email,
              phoneNumber: updates.phone || user.profile?.phone || '',
              countryCode: '+91',
              dateOfBirth: new Date('2000-01-01'),
              gender: 'other',
              country: 'India',
              city: 'Mumbai',
              pincode: '400001',
              status: updates.status === 'active' ? 'active' : (user.isActive ? 'active' : 'inactive'),
              studentId: `STU${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
              grade: updates.grade || updates.class || 'Grade 10',
              section: updates.section || updates.division || 'A',
              rollNumber: `STU${Date.now()}`,
              academicYear: '2024-2025',
              subjects: []
            };
            
            const newStudent = await StudentService.createStudent(studentData, organizationId);
            updates.userId = newStudent._id;
            updates.userModel = 'Student';
            updates.userTypeEmail = `${(updates.email || user.email).toLowerCase()}_student`;
          }
          // Handle Student → Teacher transition
          else if (oldRole === 'student' && newRole === 'teacher') {
            // Delete student record
            await StudentService.deleteStudentByUserId(user.userId);
            
            // Create teacher record
            const teacherData = {
              fullName: `${updates.firstName || user.profile?.firstName || ''} ${updates.lastName || user.profile?.lastName || ''}`,
              firstName: updates.firstName || user.profile?.firstName || '',
              lastName: updates.lastName || user.profile?.lastName || '',
              emailAddress: updates.email || user.email,
              phoneNumber: updates.phone || user.profile?.phone || '',
              countryCode: '+91',
              country: 'India',
              city: 'Mumbai',
              pincode: '400001',
              department: updates.department || '',
              status: updates.status === 'active' ? 'active' : (user.isActive ? 'active' : 'inactive'),
              subjects: [],
              role: 'teacher',
              affiliationType: 'organization',
              experienceLevel: 'beginner',
              yearsOfExperience: 0
            };
            
            const newTeacher = await TeacherService.createTeacher(teacherData, organizationId);
            updates.userId = newTeacher._id;
            updates.userModel = 'Teacher';
            updates.userTypeEmail = `${(updates.email || user.email).toLowerCase()}_teacher`;
          }
          // Handle Admin/Coordinator transitions (preserve original behavior - just update userType)
          else {
            // For admin/coordinator role changes, just update the userType
            updates.userType = newRole;
          }
        }

        // Prepare user update object
        const userUpdates = {};

        // Map field updates to user model structure
        if (updates.firstName || updates.lastName) {
          userUpdates.profile = {
            ...user.profile,
            firstName: updates.firstName || user.profile?.firstName,
            lastName: updates.lastName || user.profile?.lastName
          };
        }

        if (updates.email) {
          userUpdates.email = updates.email.toLowerCase();
        }

        if (updates.phone) {
          if (!userUpdates.profile) {
            userUpdates.profile = { ...user.profile };
          }
          userUpdates.profile.phone = updates.phone;
        }

        if (updates.department) {
          if (!userUpdates.profile) {
            userUpdates.profile = { ...user.profile };
          }
          userUpdates.profile.department = updates.department;
        }

        if (updates.status !== undefined) {
          userUpdates.isActive = updates.status === 'active';
        }

        // Add role change updates
        if (updates.userId) {
          userUpdates.userId = updates.userId;
        }
        if (updates.userModel) {
          userUpdates.userModel = updates.userModel;
        }
        if (updates.userTypeEmail) {
          userUpdates.userTypeEmail = updates.userTypeEmail;
        }
        if (updates.userType) {
          userUpdates.userType = updates.userType;
        }

        // Update user
        const updatedUser = await UserRepository.updateById(updateEntry.userId, userUpdates);

        // Update teacher/student profile if applicable
        if (user.userId && !isRoleChange) {
          if (user.userType === 'teacher') {
            const teacherUpdates = {};
            if (updates.firstName) teacherUpdates.firstName = updates.firstName;
            if (updates.lastName) teacherUpdates.lastName = updates.lastName;
            if (updates.email) teacherUpdates.emailAddress = updates.email.toLowerCase();
            if (updates.phone) teacherUpdates.phoneNumber = updates.phone;
            if (updates.department) teacherUpdates.department = updates.department;
            if (updates.status !== undefined) {
              teacherUpdates.status = updates.status === 'active' ? 'active' : 'inactive';
            }

            if (Object.keys(teacherUpdates).length > 0) {
              await TeacherService.updateTeacherByUserId(user.userId, teacherUpdates);
            }
          } else if (user.userType === 'student') {
            const studentUpdates = {};
            if (updates.firstName) studentUpdates.firstName = updates.firstName;
            if (updates.lastName) studentUpdates.lastName = updates.lastName;
            if (updates.email) studentUpdates.emailAddress = updates.email.toLowerCase();
            if (updates.phone) studentUpdates.phoneNumber = updates.phone;
            if (updates.grade || updates.class) studentUpdates.grade = updates.grade || updates.class;
            if (updates.section || updates.division) studentUpdates.section = updates.section || updates.division;
            if (updates.status !== undefined) {
              studentUpdates.status = updates.status === 'active' ? 'active' : 'inactive';
            }

            if (Object.keys(studentUpdates).length > 0) {
              await StudentService.updateStudentByUserId(user.userId, studentUpdates);
            }
          }
        }

        results.successful.push({
          userId: updateEntry.userId,
          email: updatedUser.email,
          userType: updatedUser.userType
        });

      } catch (error) {
        results.failed.push({
          userId: updateEntry.userId || 'unknown',
          reason: error.message
        });
      }
    }

    return {
      successCount: results.successful.length,
      failedCount: results.failed.length,
      failedRows: results.failed
    };
  }

  /**
   * Invite multiple users via email
   * @param {Array} inviteList - Array of user invitation data
   * @param {string} organizationId - Organization ID
   * @param {string} createdBy - User ID who sent the invitations
   * @returns {Promise<Object>} - { successCount, failedCount, failed }
   * @throws {AppError} - If validation fails
   */
  async inviteUsers(inviteList, organizationId, createdBy) {
    if (!inviteList || !Array.isArray(inviteList) || inviteList.length === 0) {
      throw AppError.badRequest('Users array is required for invitations');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    const validRoles = ['teacher', 'student', 'sub_admin', 'admin', 'coordinator'];
    const results = {
      successful: [],
      failed: [],
      total: inviteList.length
    };

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (const inviteData of inviteList) {
      try {
        // Validate required fields
        if (!inviteData.email) {
          results.failed.push({
            email: inviteData.email || 'unknown',
            reason: 'Email is required'
          });
          continue;
        }

        if (!inviteData.role) {
          results.failed.push({
            email: inviteData.email,
            reason: 'Role is required'
          });
          continue;
        }

        // Validate email format
        if (!emailRegex.test(inviteData.email)) {
          results.failed.push({
            email: inviteData.email,
            reason: 'Invalid email format'
          });
          continue;
        }

        // Validate role
        if (!validRoles.includes(inviteData.role)) {
          results.failed.push({
            email: inviteData.email,
            reason: `Invalid role. Must be one of: ${validRoles.join(', ')}`
          });
          continue;
        }

        const email = inviteData.email.toLowerCase();

        // Check if user already exists
        const existingUser = await UserRepository.findByEmail(email, organizationId);
        if (existingUser) {
          results.failed.push({
            email: inviteData.email,
            reason: 'User already registered'
          });
          continue;
        }

        // Check if there's already a pending invitation
        const existingInvitation = await InvitationRepository.findPendingByEmail(email, organizationId);
        if (existingInvitation) {
          // Update existing invitation instead of creating a new one
          const updatedInvitation = await InvitationRepository.updateById(existingInvitation._id, {
            role: inviteData.role,
            metadata: {
              firstName: inviteData.firstName || inviteData.name?.split(' ')[0] || '',
              lastName: inviteData.lastName || inviteData.name?.split(' ').slice(1).join(' ') || '',
              department: inviteData.department || '',
              phone: inviteData.phone || '',
              customMessage: inviteData.customMessage || ''
            },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          });

          // Send invitation email
          const invitationLink = `${config.FRONTEND_URL}/invite/${updatedInvitation.token}`;
          try {
            await sendInvitationEmail(
              email,
              invitationLink,
              inviteData.role,
              organization.name
            );
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the invitation if email fails
          }

          results.successful.push({
            email: inviteData.email,
            role: inviteData.role,
            token: updatedInvitation.token
          });
          continue;
        }

        // Create new invitation
        const invitationData = {
          email: email,
          organizationId: organizationId,
          invitedBy: createdBy,
          role: inviteData.role,
          metadata: {
            firstName: inviteData.firstName || inviteData.name?.split(' ')[0] || '',
            lastName: inviteData.lastName || inviteData.name?.split(' ').slice(1).join(' ') || '',
            department: inviteData.department || '',
            phone: inviteData.phone || '',
            customMessage: inviteData.customMessage || ''
          },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        const invitation = await InvitationRepository.create(invitationData);

        // Send invitation email
        const invitationLink = `${config.FRONTEND_URL}/invite/${invitation.token}`;
        try {
          await sendInvitationEmail(
            email,
            invitationLink,
            inviteData.role,
            organization.name
          );
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't fail the invitation if email fails
        }

        results.successful.push({
          email: inviteData.email,
          role: inviteData.role,
          token: invitation.token
        });

      } catch (error) {
        results.failed.push({
          email: inviteData.email || 'unknown',
          reason: error.message
        });
      }
    }

    return {
      successful: results.successful,
      errors: results.failed,
      successCount: results.successful.length,
      failedCount: results.failed.length,
      total: results.total
    };
  }

  /**
   * Resend invitation for a user
   * @param {string} userId - User ID (or invitationId if finding by invitation)
   * @param {string} organizationId - Organization ID
   * @param {string} requestedBy - User ID who requested the resend
   * @param {boolean} useInvitationId - If true, userId is treated as invitationId
   * @returns {Promise<Object>} - { email, status: "resent", invitationLink }
   * @throws {AppError} - If validation fails
   */
  async resendInvitation(userId, organizationId, requestedBy, useInvitationId = false) {
    if (!userId) {
      throw AppError.badRequest('User ID or Invitation ID is required');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    let invitation;

    if (useInvitationId) {
      // Find by invitation ID (preserving original behavior)
      invitation = await InvitationRepository.findById(userId);
      if (!invitation) {
        throw AppError.notFound('Invitation not found');
      }

      // Organization scoping check
      if (invitation.organizationId.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Invitation does not belong to this organization');
      }
    } else {
      // Find by user ID (new approach)
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found');
      }

      // Organization scoping check
      const userOrgId = user.organizationId?.toString() || 
        (user.userType === 'organization_admin' ? user.userId?.toString() : null);
      
      if (userOrgId !== organizationId.toString()) {
        throw AppError.forbidden('User does not belong to this organization');
      }

      // Check if user already has verified email and is active
      if (user.isEmailVerified && user.isActive) {
        throw AppError.badRequest('User already has verified email and is active');
      }

      // Find existing pending invitation by email
      invitation = await InvitationRepository.findPendingByEmail(user.email, organizationId);
    }

    // If no invitation found and we're using userId, create a new one
    if (!invitation && !useInvitationId) {
      const user = await UserRepository.findById(userId);
      
      // Create new invitation
      const invitationData = {
        email: user.email.toLowerCase(),
        organizationId: organizationId,
        invitedBy: requestedBy,
        role: user.userType || 'student', // Default role
        metadata: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          department: user.profile?.department || ''
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      invitation = await InvitationRepository.create(invitationData);
    } else if (!invitation) {
      throw AppError.notFound('Invitation not found');
    }

    // Check if invitation is pending
    if (invitation.status !== 'pending') {
      throw AppError.badRequest('Can only resend pending invitations');
    }

    // Extend expiry date (preserve original behavior)
    const updatedInvitation = await InvitationRepository.updateInvitation(invitation._id, {
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Send invitation email
    const invitationLink = `${config.FRONTEND_URL}/invite/${updatedInvitation.token}`;
    try {
      await sendInvitationEmail(
        updatedInvitation.email,
        invitationLink,
        updatedInvitation.role,
        organization.name
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the resend if email fails, but log it
    }

    return {
      email: updatedInvitation.email,
      status: 'resent',
      invitationLink: invitationLink
    };
  }

  /**
   * Get invited users for an organization
   * @param {string} organizationId - Organization ID
   * @param {string} status - Optional status filter ('all', 'pending', 'accepted', 'expired', 'cancelled')
   * @returns {Promise<Object>} - { invitations: [...], total: number }
   * @throws {AppError} - If validation fails
   */
  async getInvitedUsers(organizationId, status = 'all') {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Validate organization
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Get invitations by organization (preserve exact structure from model)
    const statusFilter = status === 'all' ? null : status;
    const invitations = await InvitationRepository.findByOrganization(organizationId, statusFilter);

    // Return invitations as-is to preserve exact structure (model already populates invitedBy)
    return {
      invitations: invitations,
      total: invitations.length
    };
  }
}

module.exports = new UserService();
