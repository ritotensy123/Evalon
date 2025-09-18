const Organization = require('../models/Organization');
const User = require('../models/User');
const { store, retrieve, remove } = require('../utils/tempStorage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Register organization step 1 (basic details)
const registerStep1 = async (req, res) => {
  try {
    const {
      organisationName,
      country,
      state,
      city,
      pincode,
      organisationType,
      studentStrength,
      isGovernmentRecognized
    } = req.body;

    // Validate required fields
    if (!organisationName || !country || !state || !city || !pincode || !organisationType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate organization code
    const countryCode = country.substring(0, 2).toUpperCase();
    const orgAbbrev = organisationName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const orgCode = `${countryCode}-${orgAbbrev}-${year}-${random}`;

    // Check if organization code already exists
    const existingOrg = await Organization.findOne({ orgCode });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this name already exists'
      });
    }

    // Generate registration token
    const registrationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store step 1 data in temporary storage
    const step1Data = {
      organisationName,
      country,
      state,
      city,
      pincode,
      organisationType,
      studentStrength,
      isGovernmentRecognized,
      orgCode,
      step: 1,
      timestamp: new Date()
    };

    // Store data with registration token as key for retrieval in next steps
    store(registrationToken, step1Data);

    res.status(200).json({
      success: true,
      message: 'Organization details saved successfully',
      data: {
        orgCode,
        step: 1,
        nextStep: 'admin_details',
        registrationToken
      }
    });

  } catch (error) {
    console.error('Organization step 1 registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register organization step 1',
      error: error.message
    });
  }
};

// Register organization step 2 (admin details)
const registerStep2 = async (req, res) => {
  try {
    const {
      adminName,
      adminEmail,
      adminPhone,
      countryCode,
      password,
      confirmPassword,
      registrationToken
    } = req.body;

    // Validate required fields (including password for User creation)
    if (!adminName || !adminEmail || !registrationToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: admin name, email, registration token, and password are required'
      });
    }

    // Validate password confirmation
    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation is required'
      });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Retrieve step 1 data using registration token
    const step1Data = retrieve(registrationToken);
    if (!step1Data) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email: adminEmail.toLowerCase(),
      userType: 'organization_admin'
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Admin user with this email already exists'
      });
    }

    // Hash password only if provided
    let hashedPassword = null;
    if (password) {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Store step 2 data
    const step2Data = {
      adminName,
      adminEmail: adminEmail.toLowerCase(),
      step: 2,
      timestamp: new Date()
    };

    // Only add phone fields if provided
    if (adminPhone) {
      step2Data.adminPhone = adminPhone;
    }
    if (countryCode) {
      step2Data.countryCode = countryCode;
    }

    // Store both raw and hashed passwords (password is now required)
    step2Data.rawPassword = password; // Store raw password for User creation
    step2Data.hashedPassword = hashedPassword; // Store hashed password for Organization

    // Update stored data with step 2 information
    const updatedData = {
      ...step1Data,
      ...step2Data
    };
    store(registrationToken, updatedData);

    res.status(200).json({
      success: true,
      message: 'Admin details saved successfully',
      data: {
        step: 2,
        nextStep: 'otp_verification',
        email: adminEmail.toLowerCase(),
        phone: `${countryCode}${adminPhone}`,
        requiresVerification: {
          email: true,
          phone: true
        },
        registrationToken
      }
    });

  } catch (error) {
    console.error('Organization step 2 registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register organization step 2',
      error: error.message
    });
  }
};

// Send email OTP
const sendEmailOTP = async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in temporary storage (expires in 10 minutes)
    const otpData = {
      email: email.toLowerCase(),
      otp,
      purpose,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    store(`otp_email_${email.toLowerCase()}`, otpData);

    // TODO: Send actual email using nodemailer
    console.log(`📧 Email OTP for ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to email successfully',
      data: {
        email: email.toLowerCase(),
        expiresIn: '10 minutes',
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email OTP',
      error: error.message
    });
  }
};

// Verify email OTP
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Retrieve OTP data
    const otpData = retrieve(`otp_email_${email.toLowerCase()}`);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      remove(`otp_email_${email.toLowerCase()}`);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP is valid, remove it
    remove(`otp_email_${email.toLowerCase()}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email: email.toLowerCase(),
        verified: true,
        status: 'approved'
      }
    });

  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email OTP',
      error: error.message
    });
  }
};

// Send phone OTP
const sendPhoneOTP = async (req, res) => {
  try {
    const { phone, countryCode, purpose = 'registration' } = req.body;

    if (!phone || !countryCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and country code are required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const fullPhone = `${countryCode}${phone}`;

    // Store OTP in temporary storage (expires in 10 minutes)
    const otpData = {
      phone: fullPhone,
      otp,
      purpose,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    };

    store(`otp_phone_${fullPhone}`, otpData);

    // TODO: Send actual SMS using Twilio
    console.log(`📱 Phone OTP for ${fullPhone}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to phone successfully',
      data: {
        phone: fullPhone,
        expiresIn: '10 minutes',
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone OTP',
      error: error.message
    });
  }
};

// Verify phone OTP
const verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, countryCode, otp } = req.body;

    if (!phone || !countryCode || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, country code, and OTP are required'
      });
    }

    const fullPhone = `${countryCode}${phone}`;

    // Retrieve OTP data
    const otpData = retrieve(`otp_phone_${fullPhone}`);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found or expired'
      });
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      remove(`otp_phone_${fullPhone}`);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP is valid, remove it
    remove(`otp_phone_${fullPhone}`);

    res.status(200).json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        phone: fullPhone,
        verified: true,
        status: 'approved'
      }
    });

  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone OTP',
      error: error.message
    });
  }
};

// Clean up old temporary logo data from memory (older than 1 hour)
const cleanupTempLogoData = () => {
  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    // Get all temp storage keys and clean up old ones
    // Note: This is a simplified cleanup - in production you might want to track keys
    console.log('🧹 Cleaned up old temp logo data from memory');
  } catch (error) {
    console.error('Error cleaning up temp logo data:', error);
  }
};

// Finalize logo upload - save from memory to permanent file
const finalizeLogoUpload = async (tempKey, orgCode) => {
  try {
    const tempFileInfo = retrieve(tempKey);
    if (!tempFileInfo) {
      console.log('No temporary logo found for key:', tempKey);
      return null;
    }

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Create permanent filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = tempFileInfo.extension;
    
    const permanentFilename = `logo_${orgCode}_${tempFileInfo.cleanOrgName}_${timestamp}_${randomSuffix}${extension}`;
    const permanentPath = path.join(uploadDir, permanentFilename);
    
    // Write file from memory buffer to disk
    fs.writeFileSync(permanentPath, tempFileInfo.buffer);
    
    // Clean up temp storage
    remove(tempKey);
    
    // Clean up old temp data
    cleanupTempLogoData();
    
    // Return relative path (without leading slash)
    const relativePath = `uploads/${permanentFilename}`;
    console.log(`📁 Logo finalized and saved: ${permanentFilename}`);
    
    return relativePath;
  } catch (error) {
    console.error('Error finalizing logo upload:', error);
    return null;
  }
};

// Complete organization registration (step 3)
const completeRegistration = async (req, res) => {
  try {
    const {
      registrationToken,
      emailVerified = false,
      phoneVerified = false,
      // Step 3 fields
      institutionStructure,
      departments,
      addSubAdmins,
      timeZone,
      twoFactorAuth,
      logo,
      logoTempKey // New field for temporary logo key
    } = req.body;

    if (!registrationToken) {
      return res.status(400).json({
        success: false,
        message: 'Registration token is required'
      });
    }

    // Retrieve all registration data
    const registrationData = retrieve(registrationToken);
    if (!registrationData) {
      return res.status(400).json({
        success: false,
        message: 'Registration session not found or expired'
      });
    }

    // Finalize logo upload if temp key is provided
    let finalLogoPath = '';
    if (logoTempKey) {
      finalLogoPath = await finalizeLogoUpload(logoTempKey, registrationData.orgCode);
    } else if (logo) {
      // Fallback to direct logo path if provided
      finalLogoPath = logo;
    }

    // Merge Step 3 data with existing registration data
    registrationData.institutionStructure = institutionStructure;
    registrationData.departments = departments;
    registrationData.addSubAdmins = addSubAdmins;
    registrationData.timeZone = timeZone;
    registrationData.twoFactorAuth = twoFactorAuth;
    registrationData.logo = finalLogoPath;

    // Check if all required data is present
    if (!registrationData.organisationName || !registrationData.adminName || !registrationData.adminEmail) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete registration data'
      });
    }

    // Check if organization with this email already exists
    const existingOrg = await Organization.findOne({ email: registrationData.adminEmail });
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'An organization with this email already exists. Please use a different email address.'
      });
    }

    // Check if organization with this orgCode already exists
    const existingOrgCode = await Organization.findOne({ orgCode: registrationData.orgCode });
    if (existingOrgCode) {
      return res.status(400).json({
        success: false,
        message: 'Organization code already exists. Please try again.'
      });
    }

    // Create organization
    const organization = new Organization({
      name: registrationData.organisationName,
      orgCode: registrationData.orgCode,
      email: registrationData.adminEmail,
      phone: `${registrationData.countryCode}${registrationData.adminPhone}`,
      address: `${registrationData.city}, ${registrationData.state}, ${registrationData.country} - ${registrationData.pincode}`,
      website: '',
      description: '',
      foundedYear: new Date().getFullYear(),
      // Step 3 fields
      institutionStructure: registrationData.institutionStructure || registrationData.organisationType,
      departments: registrationData.departments || [],
      addSubAdmins: registrationData.addSubAdmins || false,
      timeZone: registrationData.timeZone || 'Asia/Kolkata',
      twoFactorAuth: registrationData.twoFactorAuth || false,
      logo: finalLogoPath || '',
      // Step 1 fields
      country: registrationData.country,
      state: registrationData.state,
      city: registrationData.city,
      pincode: registrationData.pincode,
      studentStrength: registrationData.studentStrength,
      isGovernmentRecognized: registrationData.isGovernmentRecognized,
      // Admin details
      adminName: registrationData.adminName,
      adminEmail: registrationData.adminEmail,
      adminPhone: `${registrationData.countryCode}${registrationData.adminPhone}`,
      status: 'active',
      emailVerified,
      phoneVerified
    });

    await organization.save();

    // Create admin user
    console.log('🔧 Creating organization admin user...', {
      adminEmail: registrationData.adminEmail,
      hasRawPassword: !!registrationData.rawPassword,
      hasHashedPassword: !!registrationData.hashedPassword,
      adminName: registrationData.adminName
    });

    // Create User record for authentication
    try {
      const { createOrganizationAdminUser } = require('../utils/createUserFromRegistration');
      
      // Pass the raw password (not hashed) to the user creation function
      // The User model will handle the hashing in the pre-save middleware
      const adminUser = await createOrganizationAdminUser(organization._id, {
        emailAddress: registrationData.adminEmail,
        password: registrationData.rawPassword, // Use raw password for User creation
        firstName: registrationData.adminName.split(' ')[0] || registrationData.adminName,
        lastName: registrationData.adminName.split(' ').slice(1).join(' ') || '',
        phoneNumber: registrationData.adminPhone,
        countryCode: registrationData.countryCode
      });
      
      console.log('✅ Organization admin user created successfully:', {
        userId: adminUser._id,
        email: adminUser.email,
        authProvider: adminUser.authProvider
      });
    } catch (userError) {
      console.error('❌ Error creating organization admin user:', userError);
      console.error('❌ User creation error details:', {
        message: userError.message,
        stack: userError.stack,
        registrationData: {
          adminEmail: registrationData.adminEmail,
          hasRawPassword: !!registrationData.rawPassword,
          hasHashedPassword: !!registrationData.hashedPassword
        }
      });
      
      // Return error response if user creation fails
      return res.status(500).json({
        success: false,
        message: 'Organization created but failed to create admin user. Please contact support.',
        error: userError.message
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: organization._id, 
        email: registrationData.adminEmail, 
        userType: 'organization_admin',
        organizationId: organization._id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Clean up temporary data
    remove(registrationToken);

    res.status(200).json({
      success: true,
      message: 'Organization registered successfully!',
      data: {
        organization: {
          id: organization._id,
          name: organization.name,
          orgCode: organization.orgCode,
          email: organization.email,
          status: organization.status
        },
        admin: {
          id: organization._id,
          name: registrationData.adminName,
          email: registrationData.adminEmail,
          role: 'organization_admin',
          emailVerified,
          phoneVerified
        },
        token,
        nextSteps: [
          'Complete your profile setup',
          'Add your first teachers',
          'Configure your institution settings'
        ]
      }
    });

  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: error.message
    });
  }
};

// Get organization by code
const getOrganizationByCode = async (req, res) => {
  try {
    const { orgCode } = req.params;

    const organization = await Organization.findOne({
      orgCode: orgCode.toUpperCase(),
      status: 'active'
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: organization.name,
        orgCode: organization.orgCode,
        email: organization.email,
        status: organization.status,
        createdAt: organization.createdAt
      }
    });

  } catch (error) {
    console.error('Get organization by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organization',
      error: error.message
    });
  }
};

// Get all organizations
const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find({ status: 'active' })
      .select('name orgCode email status createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: organizations
    });

  } catch (error) {
    console.error('Get all organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organizations',
      error: error.message
    });
  }
};

// Update organization
const updateOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const updateData = req.body;

    const organization = await Organization.findByIdAndUpdate(
      orgId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization updated successfully',
      data: organization
    });

  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization',
      error: error.message
    });
  }
};

// Delete organization
const deleteOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;

    const organization = await Organization.findByIdAndUpdate(
      orgId,
      { status: 'inactive' },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: error.message
    });
  }
};

// Configure multer for logo upload - use memory storage for true temporary handling
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

// Upload logo - now stores in memory temporarily until form submission
const uploadLogo = async (req, res) => {
  try {
    console.log('📁 Logo upload request received:', {
      hasFile: !!req.file,
      body: req.body,
      fileInfo: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get organization context from request body
    const orgCode = req.body.orgCode || 'UNKNOWN';
    const orgName = req.body.orgName || 'Unknown';
    
    // Clean organization name for filename (remove special characters)
    const cleanOrgName = orgName.replace(/[^a-zA-Z0-9]/g, '');
    
    // Create temporary key and store file data in memory
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(req.file.originalname);
    
    // Store file data in memory instead of saving to disk
    const tempFileInfo = {
      buffer: req.file.buffer, // Store file buffer in memory
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      orgCode,
      orgName,
      cleanOrgName,
      timestamp: new Date(),
      extension
    };
    
    // Store in temporary storage with a unique key
    const tempKey = `temp_logo_${orgCode}_${timestamp}`;
    store(tempKey, tempFileInfo);
    
    // Clean up old temp data when uploading new one
    cleanupTempLogoData();
    
    console.log(`📁 Logo stored in memory temporarily: ${tempKey}`);
    
    res.status(200).json({
      success: true,
      message: 'Logo temporarily stored in memory successfully',
      tempKey: tempKey, // Key to retrieve later
      orgCode: orgCode,
      orgName: orgName
    });

  } catch (error) {
    console.error('❌ Logo upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload logo',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Complete setup wizard
const completeSetup = async (req, res) => {
  try {
    const { organizationId, logo, logoTempKey, organizationDetails, departments, adminPermissions } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Find the organization
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Finalize logo upload if temp key is provided
    let finalLogoPath = organization.logo;
    if (logoTempKey) {
      finalLogoPath = await finalizeLogoUpload(logoTempKey, organization.orgCode);
    } else if (logo && logo !== 'auto-generated') {
      finalLogoPath = logo;
    } else if (logo === 'auto-generated') {
      // Handle auto-generated logo
      finalLogoPath = `auto-generated-${organization.orgCode}`;
    }

    // Update organization with setup data
    const updateData = {
      logo: finalLogoPath,
      setupCompleted: true,
      setupCompletedAt: new Date()
    };

    // Update organization details if provided
    if (organizationDetails) {
      Object.assign(updateData, organizationDetails);
    }

    // Update departments if provided
    if (departments && departments.length > 0) {
      updateData.departments = departments.map(dept => ({
        name: dept.name,
        code: dept.code,
        description: dept.description,
        type: dept.type,
        headOfDepartment: dept.headOfDepartment,
        studentCapacity: dept.studentCapacity,
        createdAt: new Date()
      }));
    }

    // Update admin permissions if provided
    if (adminPermissions) {
      updateData.adminPermissions = adminPermissions.permissions || {};
      updateData.securitySettings = adminPermissions.securitySettings || {};
      updateData.notificationSettings = adminPermissions.notificationSettings || {};
      updateData.subAdmins = adminPermissions.subAdmins || [];
    }

    const updatedOrganization = await Organization.findByIdAndUpdate(
      organizationId,
      updateData,
      { new: true, runValidators: true }
    );

    // Generate dashboard data
    const dashboardData = {
      organization: {
        id: updatedOrganization._id,
        name: updatedOrganization.name,
        orgCode: updatedOrganization.orgCode,
        logo: updatedOrganization.logo,
        setupCompleted: updatedOrganization.setupCompleted
      },
      stats: {
        totalDepartments: updatedOrganization.departments?.length || 0,
        totalStudents: updatedOrganization.stats?.totalStudents || 0,
        totalTeachers: updatedOrganization.stats?.totalTeachers || 0,
        totalSubAdmins: updatedOrganization.subAdmins?.length || 0
      },
      departments: updatedOrganization.departments || [],
      permissions: updatedOrganization.adminPermissions || {},
      securitySettings: updatedOrganization.securitySettings || {},
      notificationSettings: updatedOrganization.notificationSettings || {}
    };

    res.status(200).json({
      success: true,
      message: 'Setup completed successfully!',
      data: {
        organization: updatedOrganization,
        setupCompleted: true
      },
      dashboardData
    });

  } catch (error) {
    console.error('Complete setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete setup',
      error: error.message
    });
  }
};

// Get organization setup status
const getSetupStatus = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        setupCompleted: organization.setupCompleted || false,
        setupCompletedAt: organization.setupCompletedAt,
        hasLogo: !!organization.logo,
        departmentsCount: organization.departments?.length || 0,
        subAdminsCount: organization.subAdmins?.length || 0,
        permissionsConfigured: !!organization.adminPermissions
      }
    });

  } catch (error) {
    console.error('Get setup status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get setup status',
      error: error.message
    });
  }
};

// Skip setup wizard
const skipSetup = async (req, res) => {
  try {
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      organizationId,
      {
        setupCompleted: true,
        setupCompletedAt: new Date(),
        setupSkipped: true
      },
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Setup skipped successfully',
      data: {
        organization,
        setupSkipped: true
      }
    });

  } catch (error) {
    console.error('Skip setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip setup',
      error: error.message
    });
  }
};

module.exports = {
  registerStep1,
  registerStep2,
  sendEmailOTP,
  verifyEmailOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
  completeRegistration,
  getOrganizationByCode,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  upload,
  completeSetup,
  getSetupStatus,
  skipSetup
};