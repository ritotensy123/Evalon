const User = require('../models/User');
const Organization = require('../models/Organization');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

/**
 * Create a User record from existing registration data
 * This function should be called after successful registration
 */
const createUserFromRegistration = async (userData) => {
  try {
    const { email, password, userType, userId, userModel, profile } = userData;
    
    console.log('🔧 Creating user from registration:', {
      email: email.toLowerCase(),
      userType,
      hasPassword: !!password,
      userId
    });
    
    // Check if user already exists for this email and user type
    const userTypeEmail = `${email.toLowerCase()}_${userType}`;
    const existingUser = await User.findOne({ userTypeEmail });
    if (existingUser) {
      throw new Error(`User already exists with this email as ${userType}`);
    }
    
    // Create user record
    const user = await User.createFromRegistration({
      email: email.toLowerCase(),
      password,
      userType,
      userId,
      userModel,
      profile
    });
    
    console.log(`✅ User created successfully: ${user.email} (${user.userType})`, {
      userId: user._id,
      authProvider: user.authProvider,
      hasPassword: !!user.password
    });
    return user;
    
  } catch (error) {
    console.error('❌ Error creating user from registration:', error);
    throw error;
  }
};

/**
 * Create User record for Organization Admin
 */
const createOrganizationAdminUser = async (organizationId, adminData) => {
  try {
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    console.log('🔧 Creating organization admin user:', {
      organizationId,
      email: adminData.emailAddress,
      hasPassword: !!adminData.password,
      firstName: adminData.firstName
    });
    
    const userData = {
      email: adminData.emailAddress,
      password: adminData.password,
      userType: 'organization_admin',
      userId: organizationId,
      userModel: 'Organization',
      profile: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        fullName: `${adminData.firstName} ${adminData.lastName}`,
        phoneNumber: adminData.phoneNumber,
        countryCode: adminData.countryCode
      }
    };
    
    const user = await createUserFromRegistration(userData);
    
    console.log('✅ Organization admin user created successfully:', {
      userId: user._id,
      email: user.email,
      userType: user.userType,
      authProvider: user.authProvider
    });
    
    return user;
    
  } catch (error) {
    console.error('❌ Error creating organization admin user:', error);
    throw error;
  }
};

/**
 * Create User record for Teacher
 */
const createTeacherUser = async (teacherId, teacherData) => {
  try {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    const userData = {
      email: teacherData.emailAddress,
      password: teacherData.password,
      userType: 'teacher',
      userId: teacherId,
      userModel: 'Teacher',
      profile: {
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        fullName: `${teacherData.firstName} ${teacherData.lastName}`,
        phoneNumber: teacherData.phoneNumber,
        countryCode: teacherData.countryCode
      }
    };
    
    return await createUserFromRegistration(userData);
    
  } catch (error) {
    console.error('❌ Error creating teacher user:', error);
    throw error;
  }
};

/**
 * Create User record for Student
 */
const createStudentUser = async (studentId, studentData) => {
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    const userData = {
      email: studentData.emailAddress,
      password: studentData.password,
      userType: 'student',
      userId: studentId,
      userModel: 'Student',
      profile: {
        firstName: studentData.fullName?.split(' ')[0] || '',
        lastName: studentData.fullName?.split(' ').slice(1).join(' ') || '',
        fullName: studentData.fullName,
        phoneNumber: studentData.phoneNumber,
        countryCode: studentData.countryCode
      }
    };
    
    return await createUserFromRegistration(userData);
    
  } catch (error) {
    console.error('❌ Error creating student user:', error);
    throw error;
  }
};

/**
 * Create Sub Admin User (for future use)
 */
const createSubAdminUser = async (subAdminId, subAdminData) => {
  try {
    const userData = {
      email: subAdminData.emailAddress,
      password: subAdminData.password,
      userType: 'sub_admin',
      userId: subAdminId,
      userModel: 'Organization', // Sub admins are typically linked to organizations
      profile: {
        firstName: subAdminData.firstName,
        lastName: subAdminData.lastName,
        fullName: `${subAdminData.firstName} ${subAdminData.lastName}`,
        phoneNumber: subAdminData.phoneNumber,
        countryCode: subAdminData.countryCode
      }
    };
    
    return await createUserFromRegistration(userData);
    
  } catch (error) {
    console.error('❌ Error creating sub admin user:', error);
    throw error;
  }
};

module.exports = {
  createUserFromRegistration,
  createOrganizationAdminUser,
  createTeacherUser,
  createStudentUser,
  createSubAdminUser
};
