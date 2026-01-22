const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Organization = require('../models/Organization');
const crypto = require('crypto');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants');
const { logger } = require('../utils/logger');

// Generate CSV template for teacher bulk upload
const generateTeacherTemplate = async (req, res) => {
  try {
    const department = req.query.department || 'template';
    
    // CSV headers for teacher template
    const headers = [
      'firstName',
      'lastName', 
      'email',
      'phone',
      'countryCode',
      'subjects',
      'experienceLevel',
      'yearsOfExperience',
      'qualification',
      'specialization',
      'address',
      'city',
      'state',
      'pincode',
      'country'
    ];

    // Create sample data row
    const sampleData = [
      'John',
      'Doe',
      'john.doe@example.com',
      '9876543210',
      '+91',
      'Mathematics,Physics',
      'Senior',
      '5',
      'M.Sc Mathematics',
      'Applied Mathematics',
      '123 Main Street',
      'Mumbai',
      'Maharashtra',
      '400001',
      'India'
    ];

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      sampleData.join(','),
      // Add empty rows for user to fill
      ...Array(4).fill(','.repeat(headers.length - 1))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="teacher_bulk_upload_template_${department}.csv"`);
    res.send(csvContent);

  } catch (error) {
    logger.error('Template generation error', { error: error.message, stack: error.stack });
    sendError(res, error, 'Failed to generate template', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Bulk create teachers from CSV data
const bulkCreateTeachers = async (req, res) => {
  try {
    const { department, teachers } = req.body;
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Get organization info from the requesting user
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser) {
      return sendError(res, new Error('Requesting user not found'), 'Requesting user not found', HTTP_STATUS.NOT_FOUND);
    }

    const organization = await Organization.findById(requestingUser.organizationId);
    if (!organization) {
      return sendError(res, new Error('Organization not found'), 'Organization not found', HTTP_STATUS.NOT_FOUND);
    }

    // Process each teacher
    for (const teacherData of teachers) {
      try {
        // Generate temporary password
        const tempPassword = generateTempPassword();
        
        // Create user account
        const user = new User({
          email: teacherData.email,
          password: tempPassword, // Will be hashed by pre-save middleware
          userType: 'teacher',
          firstLogin: true,
          authProvider: 'temp_password',
          isEmailVerified: true,
          organizationId: requestingUser.organizationId,
          organizationCode: organization.code,
          organizationName: organization.name
        });

        await user.save();

        // Create teacher profile
        const teacher = new Teacher({
          userId: user._id,
          firstName: teacherData.firstName,
          lastName: teacherData.lastName,
          email: teacherData.email,
          phone: teacherData.phone,
          countryCode: teacherData.countryCode || '+91',
          subjects: teacherData.subjects ? teacherData.subjects.split(',').map(s => s.trim()) : [],
          experienceLevel: teacherData.experienceLevel || 'Beginner',
          yearsOfExperience: parseInt(teacherData.yearsOfExperience) || 0,
          qualification: teacherData.qualification || '',
          specialization: teacherData.specialization || '',
          address: teacherData.address || '',
          city: teacherData.city || '',
          state: teacherData.state || '',
          pincode: teacherData.pincode || '',
          country: teacherData.country || 'India',
          department: department,
          affiliationType: 'employee',
          role: 'teacher',
          organizationId: requestingUser.organizationId,
          organizationCode: organization.code,
          organizationName: organization.name,
          isOrganizationValid: true,
          associationStatus: 'active'
        });

        await teacher.save();

        // Send email notification (you can implement this later)
        // await sendTeacherWelcomeEmail(teacherData.email, tempPassword);

        results.push({
          email: teacherData.email,
          tempPassword: tempPassword,
          success: true,
          message: 'Teacher created successfully',
          userId: user._id,
          teacherId: teacher._id
        });

        successCount++;

      } catch (error) {
        logger.error(`Error creating teacher`, { email: teacherData.email, error: error.message });
        
        results.push({
          email: teacherData.email,
          tempPassword: null,
          success: false,
          message: error.message || 'Failed to create teacher',
          userId: null,
          teacherId: null
        });

        failureCount++;
      }
    }

    sendSuccess(res, {
      successCount,
      failureCount,
      results
    }, `Bulk teacher creation completed. ${successCount} successful, ${failureCount} failed.`, HTTP_STATUS.OK);

  } catch (error) {
    logger.error('Bulk teacher creation error', { error: error.message, stack: error.stack });
    sendError(res, error, 'Failed to create teachers', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

// Generate temporary password
const generateTempPassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  generateTeacherTemplate,
  bulkCreateTeachers
};
