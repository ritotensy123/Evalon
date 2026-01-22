/**
 * OrganizationController
 * HTTP request/response handling for organization operations
 * All business logic is delegated to OrganizationService
 */

const OrganizationService = require('../services/OrganizationService');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const UserRepository = require('../repositories/UserRepository');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { store, retrieve, remove } = require('../utils/tempStorage');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateToken } = require('../middleware/auth');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

// Get registration session status
const getRegistrationSessionStatus = asyncWrapper(async (req, res) => {
  const { registrationToken } = req.query;

  if (!registrationToken) {
    return sendSuccess(res, {
      sessionValid: false,
      lastCompletedStep: 0,
      reason: 'No registration token provided'
    }, 'Session status retrieved', 200);
  }

  console.log('🔍 [SESSION STATUS] Checking registration session...');
  console.log('🔍 [SESSION STATUS] Token:', registrationToken.substring(0, 10) + '...');

  // Retrieve registration data
  const registrationData = retrieve(registrationToken);

  if (!registrationData) {
    console.log('❌ [SESSION STATUS] Session not found or expired');
    return sendSuccess(res, {
      sessionValid: false,
      lastCompletedStep: 0,
      reason: 'Registration session not found or expired'
    }, 'Session status retrieved', 200);
  }

  // Determine last completed step
  let lastCompletedStep = 0;
  if (registrationData.step) {
    lastCompletedStep = registrationData.step;
  } else if (registrationData.organisationName && !registrationData.adminName) {
    lastCompletedStep = 1;
  } else if (registrationData.adminName && registrationData.hashedPassword) {
    lastCompletedStep = 2;
  }

  console.log('✅ [SESSION STATUS] Session valid');
  console.log('✅ [SESSION STATUS] Last completed step:', lastCompletedStep);
  console.log('✅ [SESSION STATUS] Organization:', registrationData.organisationName);

  return sendSuccess(res, {
    sessionValid: true,
    lastCompletedStep: lastCompletedStep,
    organizationName: registrationData.organisationName,
    orgCode: registrationData.orgCode
  }, 'Session status retrieved', 200);
});

// Register organization step 1 (basic details)
const registerStep1 = asyncWrapper(async (req, res) => {
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
    throw AppError.badRequest('Missing required fields');
  }

  // Generate organization code
  const countryCode = country.substring(0, 2).toUpperCase();
  const orgAbbrev = organisationName.replace(/\s+/g, '').substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const orgCode = `${countryCode}-${orgAbbrev}-${year}-${random}`;

  // Check if organization code already exists
  const existingOrg = await OrganizationRepository.findOne({ orgCode });

  if (existingOrg) {
    throw AppError.badRequest('An organization with this name already exists');
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
  console.log('💾 [REGISTER STEP1] Storing registration data...');
  console.log('💾 [REGISTER STEP1] Registration token:', registrationToken);
  console.log('💾 [REGISTER STEP1] Organization:', organisationName);
  
  const stored = store(registrationToken, step1Data);
  
  if (stored) {
    console.log('✅ [REGISTER STEP1] Registration data stored successfully');
    console.log('✅ [REGISTER STEP1] Token TTL: 1 hour (3600000ms)');
  } else {
    console.error('❌ [REGISTER STEP1] Failed to store registration data');
  }

  return sendSuccess(res, {
    orgCode,
    step: 1,
    nextStep: 'admin_details',
    registrationToken
  }, 'Organization details saved successfully', 200);
});

// Register organization step 2 (admin details)
const registerStep2 = asyncWrapper(async (req, res) => {
  console.log('📝 [REGISTER STEP2] Received request to save admin details');
  console.log('📝 [REGISTER STEP2] Request body keys:', Object.keys(req.body));
  
  const {
    adminName,
    adminEmail,
    adminPhone,
    countryCode,
    password,
    confirmPassword,
    registrationToken
  } = req.body;

  // Validate required fields
  // Note: registerStep2 is called when saving admin details before proceeding to step 3
  // Password is required here as it's needed for user creation
  if (!adminName || !adminEmail || !registrationToken) {
    console.error('❌ [REGISTER STEP2] Missing required fields');
    console.error('❌ [REGISTER STEP2] adminName:', !!adminName);
    console.error('❌ [REGISTER STEP2] adminEmail:', !!adminEmail);
    console.error('❌ [REGISTER STEP2] registrationToken:', !!registrationToken);
    throw AppError.badRequest('Missing required fields: admin name, email, and registration token are required');
  }
  
  console.log('✅ [REGISTER STEP2] All required fields present');
  console.log('✅ [REGISTER STEP2] Admin email:', adminEmail);

  // Password is required when saving admin details (before final registration)
  if (!password) {
    throw AppError.badRequest('Password is required');
  }
  if (!confirmPassword) {
    throw AppError.badRequest('Password confirmation is required');
  }
  if (password !== confirmPassword) {
    throw AppError.badRequest('Passwords do not match');
  }

  // RULE 5: Backend safety - Reject step 2 if step 1 was not completed
  console.log('🔍 [REGISTER STEP2] Attempting to retrieve registration data...');
  console.log('🔍 [REGISTER STEP2] Registration token received:', registrationToken ? registrationToken.substring(0, 10) + '...' : 'NULL');
  
  const step1Data = retrieve(registrationToken);
  
  if (!step1Data) {
    console.error('❌ [REGISTER STEP2] Registration session not found or expired');
    console.error('❌ [REGISTER STEP2] Token:', registrationToken);
    throw AppError.badRequest('Registration session not found or expired. Please start registration from step 1 again.');
  }
  
  // Validate that step 1 was actually completed
  if (!step1Data.organisationName || !step1Data.orgCode) {
    console.error('❌ [REGISTER STEP2] Step 1 not completed - missing organization data');
    throw AppError.badRequest('Step 1 not completed. Please complete organization details first.');
  }
  
  console.log('✅ [REGISTER STEP2] Registration data retrieved successfully');
  console.log('✅ [REGISTER STEP2] Organization:', step1Data.organisationName);
  console.log('✅ [REGISTER STEP2] Step 1 validated - proceeding with step 2');

  // Check if user already exists
  const existingUser = await UserRepository.findOne({
    email: adminEmail.toLowerCase(),
    userType: 'organization_admin'
  });

  if (existingUser) {
    throw AppError.badRequest('Admin user with this email already exists');
  }

  // Hash password (required at this step)
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

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

  // SECURITY: Only store the hashed password, never the raw password
  // The User model will accept the pre-hashed password with proper handling
  step2Data.hashedPassword = hashedPassword;

  // Update stored data with step 2 information
  const updatedData = {
    ...step1Data,
    ...step2Data
  };
  store(registrationToken, updatedData);

  return sendSuccess(res, {
    step: 2,
    nextStep: 'otp_verification',
    email: adminEmail.toLowerCase(),
    phone: (adminPhone && countryCode) ? `${countryCode}${adminPhone}` : null,
    requiresVerification: {
      email: true,
      phone: false // Phone verification removed
    },
    registrationToken
  }, 'Admin details saved successfully', 200);
});

// Send email OTP
const sendEmailOTP = asyncWrapper(async (req, res) => {
  const { email, purpose = 'registration' } = req.body;

  if (!email) {
    throw AppError.badRequest('Email is required');
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
  // SECURITY: OTP codes must never be logged

  return sendSuccess(res, {
    email: email.toLowerCase(),
    expiresIn: '10 minutes',
    status: 'pending'
  }, 'OTP sent to email successfully', 200);
});

// Verify email OTP
const verifyEmailOTP = asyncWrapper(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw AppError.badRequest('Email and OTP are required');
  }

  // Retrieve OTP data
  const otpData = retrieve(`otp_email_${email.toLowerCase()}`);
  
  if (!otpData) {
    throw AppError.badRequest('OTP not found or expired');
  }

  // Check if OTP is expired
  if (new Date() > otpData.expiresAt) {
    remove(`otp_email_${email.toLowerCase()}`);
    throw AppError.badRequest('OTP has expired');
  }

  // Verify OTP
  if (otpData.otp !== otp) {
    throw AppError.badRequest('Invalid OTP');
  }

  // OTP is valid, remove it
  remove(`otp_email_${email.toLowerCase()}`);

  return sendSuccess(res, {
    email: email.toLowerCase(),
    verified: true,
    status: 'approved'
  }, 'Email verified successfully', 200);
});

// Send phone OTP
const sendPhoneOTP = asyncWrapper(async (req, res) => {
  const { phone, countryCode, purpose = 'registration' } = req.body;

  if (!phone || !countryCode) {
    throw AppError.badRequest('Phone number and country code are required');
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
  // SECURITY: OTP codes must never be logged

  return sendSuccess(res, {
    phone: fullPhone,
    expiresIn: '10 minutes',
    status: 'pending'
  }, 'OTP sent to phone successfully', 200);
});

// Verify phone OTP
const verifyPhoneOTP = asyncWrapper(async (req, res) => {
  const { phone, countryCode, otp } = req.body;

  if (!phone || !countryCode || !otp) {
    throw AppError.badRequest('Phone number, country code, and OTP are required');
  }

  const fullPhone = `${countryCode}${phone}`;

  // Retrieve OTP data
  const otpData = retrieve(`otp_phone_${fullPhone}`);
  
  if (!otpData) {
    throw AppError.badRequest('OTP not found or expired');
  }

  // Check if OTP is expired
  if (new Date() > otpData.expiresAt) {
    remove(`otp_phone_${fullPhone}`);
    throw AppError.badRequest('OTP has expired');
  }

  // Verify OTP
  if (otpData.otp !== otp) {
    throw AppError.badRequest('Invalid OTP');
  }

  // OTP is valid, remove it
  remove(`otp_phone_${fullPhone}`);

  return sendSuccess(res, {
    phone: fullPhone,
    verified: true,
    status: 'approved'
  }, 'Phone verified successfully', 200);
});

// Clean up old temporary logo data from memory (older than 1 hour)
const cleanupTempLogoData = () => {
  try {
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
    
    // Get all temp storage keys and clean up old ones
    // Note: This is a simplified cleanup - in production you might want to track keys
    logger.info('🧹 Cleaned up old temp logo data from memory');
  } catch (error) {
    logger.error('Error cleaning up temp logo data', { error: error.message, stack: error.stack });
  }
};

// Finalize logo upload - save from memory to permanent file
const finalizeLogoUpload = async (tempKey, orgCode) => {
  try {
    const tempFileInfo = retrieve(tempKey);
    if (!tempFileInfo) {
      logger.warn('No temporary logo found for key', { tempKey });
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
    logger.info('📁 Logo finalized and saved', { filename: permanentFilename, orgCode });
    
    return relativePath;
  } catch (error) {
    logger.error('Error finalizing logo upload', { error: error.message, stack: error.stack, tempKey, orgCode });
    return null;
  }
};

// Complete organization registration (step 3)
const completeRegistration = asyncWrapper(async (req, res) => {
  const {
    registrationToken,
    emailVerified = false,
    phoneVerified = false, // Phone verification removed - always false
    // Step 3 fields
    institutionStructure,
    departments,
    addSubAdmins,
    timeZone,
    twoFactorAuth,
    logo // Base64 logo string
  } = req.body;

  if (!registrationToken) {
    throw AppError.badRequest('Registration token is required');
  }

  // Retrieve all registration data
  const registrationData = retrieve(registrationToken);
  if (!registrationData) {
    throw AppError.badRequest('Registration session not found or expired');
  }

  // Validate and use base64 logo string directly
  let finalLogo = null;
  if (logo) {
    // Validate base64 string
    if (typeof logo === 'string' && logo.startsWith('data:image/')) {
      finalLogo = logo;
    } else {
      logger.warn('Invalid logo format provided, ignoring', { logoType: typeof logo });
    }
  }

  // Merge Step 3 data with existing registration data
  registrationData.institutionStructure = institutionStructure;
  registrationData.departments = departments;
  registrationData.addSubAdmins = addSubAdmins;
  registrationData.timeZone = timeZone;
  registrationData.twoFactorAuth = twoFactorAuth;
  registrationData.logo = finalLogo;

  // Check if all required data is present
  if (!registrationData.organisationName || !registrationData.adminName || !registrationData.adminEmail) {
    throw AppError.badRequest('Incomplete registration data');
  }

  // Password is required for final registration
  if (!registrationData.hashedPassword) {
    throw AppError.badRequest('Password is required to complete registration');
  }

  // Check if organization with this email already exists
  const existingOrg = await OrganizationRepository.findOne({ email: registrationData.adminEmail });
  if (existingOrg) {
    throw AppError.badRequest('An organization with this email already exists. Please use a different email address.');
  }

  // Check if organization with this orgCode already exists
  const existingOrgCode = await OrganizationRepository.findOne({ orgCode: registrationData.orgCode });
  if (existingOrgCode) {
    throw AppError.badRequest('Organization code already exists. Please try again.');
  }

  // Prepare organization data
  const orgData = {
    name: registrationData.organisationName,
    orgCode: registrationData.orgCode,
    email: registrationData.adminEmail,
    phone: (registrationData.adminPhone && registrationData.countryCode) 
      ? `${registrationData.countryCode}${registrationData.adminPhone}` 
      : '',
    address: {
      country: registrationData.country || '',
      state: registrationData.state || '',
      city: registrationData.city || '',
      postalCode: registrationData.pincode || '',
      street: '' // Street address not collected during registration
    },
    website: '',
    description: '',
    foundedYear: new Date().getFullYear(),
    // Step 3 fields
    institutionStructure: registrationData.institutionStructure || registrationData.organisationType,
    departments: registrationData.departments || [],
    addSubAdmins: registrationData.addSubAdmins || false,
    timeZone: registrationData.timeZone || 'Asia/Kolkata',
    twoFactorAuth: registrationData.twoFactorAuth || false,
    logo: finalLogo || null,
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
    adminPhone: (registrationData.adminPhone && registrationData.countryCode) 
      ? `${registrationData.countryCode}${registrationData.adminPhone}` 
      : '',
    status: 'active',
    emailVerified,
    phoneVerified: false // Phone verification removed
  };

  // Create organization using service
  const organization = await OrganizationService.registerOrganization(orgData);

  // Create admin user
  // SECURITY: User creation logs sanitized - no PII
  logger.info('🔧 Creating organization admin user...', { organizationId: organization._id });

  // Create User record for authentication
  let adminUser;
  try {
    const { createOrganizationAdminUser } = require('../utils/createUserFromRegistration');
    
    // SECURITY: Pass the pre-hashed password - User model detects bcrypt hashes and skips re-hashing
    adminUser = await createOrganizationAdminUser(organization._id, {
      emailAddress: registrationData.adminEmail,
      password: registrationData.hashedPassword, // Already hashed - User model will detect this
      firstName: registrationData.adminName.split(' ')[0] || registrationData.adminName,
      lastName: registrationData.adminName.split(' ').slice(1).join(' ') || '',
      phoneNumber: registrationData.adminPhone || '', // Phone is optional
      countryCode: registrationData.countryCode || ''
    });
    
    logger.info('✅ Organization admin user created successfully', {
      userId: adminUser._id,
      authProvider: adminUser.authProvider,
      organizationId: organization._id
    });
  } catch (userError) {
    logger.error('❌ Error creating organization admin user', {
      error: userError.message,
      stack: userError.stack,
      organizationId: organization._id
    });
    
    // Throw error if user creation fails - this will be caught by asyncWrapper and errorHandler
    throw AppError.internal('Organization created but failed to create admin user. Please contact support.', userError.message);
  }

  // Generate JWT token (using adminUser._id, not organization._id)
  const token = generateToken(adminUser._id, 'organization_admin', adminUser.tokenVersion || 0);

  // Clean up temporary data
  remove(registrationToken);

  return sendSuccess(res, {
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
  }, 'Organization registered successfully!', 200);
});

// Get organization by code
const getOrganizationByCode = asyncWrapper(async (req, res) => {
  const { orgCode } = req.params;

  const organization = await OrganizationService.getOrganizationByCode(orgCode);

  return sendSuccess(res, {
    name: organization.name,
    orgCode: organization.orgCode,
    email: organization.email,
    status: organization.status,
    createdAt: organization.createdAt
  }, 'OK', 200);
});

// Get organization by ID
const getOrganizationById = asyncWrapper(async (req, res) => {
  const { orgId } = req.params;

  const organization = await OrganizationService.getOrganizationById(orgId);

  return sendSuccess(res, organization, 'Organization retrieved successfully', 200);
});

// Get all organizations
const getAllOrganizations = asyncWrapper(async (req, res) => {
  const organizations = await OrganizationService.getAllOrganizations();

  return sendSuccess(res, organizations, 'OK', 200);
});

// Update organization
const updateOrganization = asyncWrapper(async (req, res) => {
  const { orgId } = req.params;
  const updateData = req.body;

  const organization = await OrganizationService.updateOrganization(orgId, updateData);

  return sendSuccess(res, organization, 'Organization updated successfully', 200);
});

// Delete organization
const deleteOrganization = asyncWrapper(async (req, res) => {
  const { orgId } = req.params;

  await OrganizationService.deleteOrganization(orgId);

  return sendSuccess(res, null, 'Organization deleted successfully', 200);
});

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
const uploadLogo = asyncWrapper(async (req, res) => {
  logger.info('📁 Logo upload request received', {
    hasFile: !!req.file,
    fileInfo: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null
  });

  if (!req.file) {
    logger.warn('❌ No file uploaded');
    throw AppError.badRequest('No file uploaded');
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
  
  logger.info('📁 Logo stored in memory temporarily', { tempKey, orgCode });
  
  return sendSuccess(res, {
    tempKey: tempKey, // Key to retrieve later
    orgCode: orgCode,
    orgName: orgName
  }, 'Logo temporarily stored in memory successfully', 200);
});

// Complete setup wizard
const completeSetup = asyncWrapper(async (req, res) => {
  const { organizationId, logo, logoTempKey, organizationDetails, departments, adminPermissions } = req.body;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  // Get organization to access orgCode
  const organization = await OrganizationService.getOrganizationById(organizationId);

  // Handle logo - accept base64 string directly
  let finalLogo = organization.logo;
  if (logo) {
    // Validate base64 string
    if (typeof logo === 'string' && logo.startsWith('data:image/')) {
      finalLogo = logo;
    } else if (logo === 'auto-generated') {
      // Handle auto-generated logo (legacy)
      finalLogo = `auto-generated-${organization.orgCode}`;
    } else if (logo && logo !== 'auto-generated') {
      // Legacy: file path
      finalLogo = logo;
    }
  }
  
  // Legacy: Support temp key for backward compatibility
  if (logoTempKey && !finalLogo) {
    finalLogo = await finalizeLogoUpload(logoTempKey, organization.orgCode);
  }

  // Prepare setup data
  const setupData = {
    logo: finalLogo,
    organizationDetails,
    departments,
    adminPermissions
  };

  // Complete setup via service
  const updatedOrganization = await OrganizationService.completeSetup(
    organizationId,
    setupData,
    logoTempKey
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

  return sendSuccess(res, {
    organization: updatedOrganization,
    setupCompleted: true,
    firstLogin: false,
    dashboardData
  }, 'Setup completed successfully!', 200);
});

// Get organization setup status
const getSetupStatus = asyncWrapper(async (req, res) => {
  const { organizationId } = req.params;

  const setupStatus = await OrganizationService.getSetupStatus(organizationId);

  return sendSuccess(res, setupStatus, 'OK', 200);
});

// Skip setup wizard
const skipSetup = asyncWrapper(async (req, res) => {
  const { organizationId } = req.body;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const organization = await OrganizationService.skipSetup(organizationId);

  return sendSuccess(res, {
    organization,
    setupSkipped: true
  }, 'Setup skipped successfully', 200);
});

module.exports = {
  getRegistrationSessionStatus,
  registerStep1,
  registerStep2,
  sendEmailOTP,
  verifyEmailOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
  completeRegistration,
  getOrganizationByCode,
  getOrganizationById,
  getAllOrganizations,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  upload,
  completeSetup,
  getSetupStatus,
  skipSetup
};