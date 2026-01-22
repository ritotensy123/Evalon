# Registration System - Complete Overview

## Table of Contents
1. [Overview](#overview)
2. [Organization Registration](#organization-registration)
3. [Teacher Registration](#teacher-registration)
4. [Student Registration](#student-registration)
5. [Common Components](#common-components)
6. [Data Flow](#data-flow)
7. [Security Features](#security-features)
8. [API Endpoints](#api-endpoints)

---

## Overview

The Evalon platform supports three types of registration:
- **Organization Registration**: For institutions to register and create their admin account
- **Teacher Registration**: For teachers to join an organization
- **Student Registration**: For students to join an organization

All registration flows use a multi-step process with temporary storage for session management.

---

## Organization Registration

### Flow Overview
Organization registration is a **3-step process** with email and phone OTP verification:

1. **Step 1**: Organization Basic Details
2. **Step 2**: Admin Details + OTP Verification
3. **Step 3**: Setup Preferences & Complete Registration

### Step 1: Organization Details

**Frontend Component**: `Step1OrganisationDetails`
**Backend Endpoint**: `POST /api/organizations/register/step1`

**Data Collected**:
- Organisation Name
- Country, State, City, Pincode
- Organisation Type
- Student Strength
- Government Recognition Status

**Backend Processing**:
- Generates unique organization code: `{COUNTRY_CODE}-{ORG_ABBREV}-{YEAR}-{RANDOM}`
  - Example: `IN-TES-2025-JDQ`
- Creates registration token for session management
- Stores data in temporary storage (expires in 1 hour)
- Validates organization code uniqueness

**Response**:
```json
{
  "success": true,
  "data": {
    "orgCode": "IN-TES-2025-JDQ",
    "step": 1,
    "nextStep": "admin_details",
    "registrationToken": "19b9iovfab4mfbagtus"
  }
}
```

### Step 2: Admin Details & OTP Verification

**Frontend Component**: `Step2AdminDetails`
**Backend Endpoint**: `POST /api/organizations/register/step2`

**Data Collected**:
- Admin Name
- Admin Email
- Admin Phone (with country code)
- Password & Confirm Password

**Backend Processing**:
- Validates password match
- Checks if admin email already exists
- Hashes password using bcrypt (12 salt rounds)
- Stores admin details in temporary storage
- Merges with Step 1 data

**OTP Verification Flow**:

#### Email OTP
- **Send OTP**: `POST /api/organizations/auth/send-email-otp`
  - Generates 6-digit OTP
  - Stores in temp storage (expires in 10 minutes)
  - Sends email (TODO: Implement actual email sending)
  
- **Verify OTP**: `POST /api/organizations/register/verify-email-otp`
  - Validates OTP against stored value
  - Checks expiration
  - Marks email as verified

#### Phone OTP
- **Send OTP**: `POST /api/organizations/auth/send-phone-otp`
  - Generates 6-digit OTP
  - Stores in temp storage (expires in 10 minutes)
  - Sends SMS (TODO: Implement actual SMS sending via Twilio)
  
- **Verify OTP**: `POST /api/organizations/register/verify-phone-otp`
  - Validates OTP against stored value
  - Checks expiration
  - Marks phone as verified

**Response**:
```json
{
  "success": true,
  "data": {
    "step": 2,
    "nextStep": "otp_verification",
    "email": "admin@example.com",
    "phone": "+919876543210",
    "requiresVerification": {
      "email": true,
      "phone": true
    },
    "registrationToken": "19b9iovfab4mfbagtus"
  }
}
```

### Step 3: Setup Preferences & Complete Registration

**Frontend Component**: `Step3SetupPreferences`
**Backend Endpoint**: `POST /api/organizations/register/step3`

**Data Collected**:
- Institution Structure (single/multi)
- Departments (array)
- Sub-admins preference
- Time Zone
- Two-Factor Authentication preference
- Logo (optional, via file upload)

**Logo Upload**:
- **Endpoint**: `POST /api/organizations/upload/logo`
- Stores logo in memory temporarily
- Returns `logoTempKey` for finalization
- Finalized during Step 3 completion
- Max size: 5MB
- Formats: JPEG, JPG, PNG, GIF

**Backend Processing**:
1. Retrieves all registration data from temp storage
2. Finalizes logo upload (if provided)
3. Validates completeness of data
4. Checks for duplicate organizations
5. Creates Organization document
6. Creates Organization Admin User:
   - Creates User record with `userType: 'organization_admin'`
   - Links to Organization document
   - Sets up authentication
7. Generates JWT token
8. Cleans up temporary data

**Response**:
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Test University",
      "orgCode": "IN-TES-2025-JDQ",
      "email": "admin@example.com",
      "status": "active"
    },
    "admin": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "John Doe",
      "email": "admin@example.com",
      "role": "organization_admin",
      "emailVerified": true,
      "phoneVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "nextSteps": [
      "Complete your profile setup",
      "Add your first teachers",
      "Configure your institution settings"
    ]
  }
}
```

### Files Involved

**Backend**:
- `backend/src/controllers/organizationController.js` - Main controller
- `backend/src/services/OrganizationService.js` - Business logic
- `backend/src/repositories/OrganizationRepository.js` - Data access
- `backend/src/models/Organization.js` - Organization model
- `backend/src/models/User.js` - User model
- `backend/src/utils/tempStorage.js` - Temporary session storage
- `backend/src/utils/createUserFromRegistration.js` - User creation utility
- `backend/src/routes/organizationRoutes.js` - Route definitions

**Frontend**:
- `frontend/src/pages/onboarding/OrganisationRegistration.js` - Main registration page
- `frontend/src/components/registration/OrganisationForm/Step1OrganisationDetails.js`
- `frontend/src/components/registration/OrganisationForm/Step2AdminDetails.js`
- `frontend/src/components/registration/OrganisationForm/Step3SetupPreferences.js`
- `frontend/src/services/api.js` - API service layer

---

## Teacher Registration

### Flow Overview
Teacher registration is a **4-step process**:

1. **Step 1**: Basic Details (Name, Contact, Location)
2. **Step 2**: Professional Details (Subjects, Role, Experience)
3. **Step 3**: Organization Link (Verify organization code)
4. **Step 4**: Security Verification (Email/Phone OTP, Password)

### Step 1: Basic Details

**Data Collected**:
- Full Name
- Phone Number (with country code)
- Email Address
- Country, City, Pincode

**Backend Endpoint**: `POST /api/teachers/register/step1`

### Step 2: Professional Details

**Data Collected**:
- Subjects (array)
- Role
- Affiliation Type (organization/freelance)
- Experience Level
- Current Institution
- Years of Experience

**Backend Endpoint**: `POST /api/teachers/register/step2`

### Step 3: Organization Link

**Data Collected**:
- Organization Code
- Organization Name (auto-filled after verification)
- Association Status

**Backend Processing**:
- Validates organization code
- Verifies organization exists
- Checks if teacher can join organization

**Backend Endpoint**: `POST /api/teachers/register/step3`

### Step 4: Security Verification

**Data Collected**:
- Email OTP (verification)
- Phone OTP (verification)
- Password & Confirm Password

**Backend Processing**:
- Verifies email and phone OTPs
- Hashes password
- Creates Teacher document
- Creates User record with `userType: 'teacher'`
- Links to Organization

**Backend Endpoint**: `POST /api/teachers/register/step4`

### Files Involved

**Backend**:
- `backend/src/controllers/teacherController.js`
- `backend/src/services/TeacherService.js`
- `backend/src/routes/teacherRoutes.js`

**Frontend**:
- `frontend/src/pages/onboarding/TeacherRegistration.js`
- `frontend/src/components/registration/TeacherForm/Step1BasicDetails.js`
- `frontend/src/components/registration/TeacherForm/Step2ProfessionalDetails.js`
- `frontend/src/components/registration/TeacherForm/Step3OrganizationLink.js`
- `frontend/src/components/registration/TeacherForm/Step4SecurityVerification.js`

---

## Student Registration

### Flow Overview
Student registration is a **4-step process**:

1. **Step 1**: Basic Details (Name, Contact, DOB, Gender, Location)
2. **Step 2**: Organization Verification (Link to organization)
3. **Step 3**: Security Verification (Email/Phone OTP, Password)
4. **Step 4**: Auto Mapping (Department, Batch, Year)

### Step 1: Basic Details

**Data Collected**:
- Full Name
- Phone Number (with country code)
- Email Address
- Date of Birth
- Gender
- Country, City, Pincode

**Backend Endpoint**: `POST /api/students/register/step1`

### Step 2: Organization Verification

**Data Collected**:
- Registration Type (organization/standalone)
- Organization Code
- Organization Name (auto-filled)
- Student Verification Status
- Current Institution (if standalone)
- Academic Level

**Backend Processing**:
- Validates organization code
- Verifies student can join organization
- May require organization admin approval

**Backend Endpoint**: `POST /api/students/register/step2`

### Step 3: Security Verification

**Data Collected**:
- Email OTP (verification)
- Phone OTP (verification)
- Password & Confirm Password

**Backend Processing**:
- Verifies email and phone OTPs
- Hashes password
- Creates Student document
- Creates User record with `userType: 'student'`
- Links to Organization

**Backend Endpoint**: `POST /api/students/register/step3`

### Step 4: Auto Mapping

**Data Collected**:
- Department
- Batch
- Year
- Auto-mapping preference

**Backend Processing**:
- Maps student to department
- Assigns to batch and year
- Completes registration

**Backend Endpoint**: `POST /api/students/register/step4`

### Files Involved

**Backend**:
- `backend/src/controllers/studentController.js`
- `backend/src/services/StudentService.js`
- `backend/src/routes/studentRoutes.js`

**Frontend**:
- `frontend/src/pages/onboarding/StudentRegistration.js`
- `frontend/src/components/registration/StudentForm/Step1BasicDetails.js`
- `frontend/src/components/registration/StudentForm/Step2OrganizationVerification.js`
- `frontend/src/components/registration/StudentForm/Step3SecurityVerification.js`
- `frontend/src/components/registration/StudentForm/Step4AutoMapping.js`

---

## Common Components

### Temporary Storage System

**File**: `backend/src/utils/tempStorage.js`

**Purpose**: Stores registration session data temporarily during multi-step registration.

**Features**:
- In-memory storage using Map
- TTL (Time To Live) support (default: 1 hour)
- Automatic cleanup of expired data
- Cleanup runs every 5 minutes

**Methods**:
- `store(key, data, ttl)` - Store data with expiration
- `retrieve(key)` - Retrieve data (returns null if expired)
- `update(key, newData, ttl)` - Update existing data
- `remove(key)` - Remove data immediately
- `cleanup()` - Manual cleanup of expired entries

**Usage**:
```javascript
const { store, retrieve, remove } = require('../utils/tempStorage');

// Store registration data
store(registrationToken, {
  step1Data: {...},
  step2Data: {...}
});

// Retrieve later
const data = retrieve(registrationToken);

// Clean up after completion
remove(registrationToken);
```

**Note**: In production, this should be replaced with Redis or a proper database.

### User Creation Utility

**File**: `backend/src/utils/createUserFromRegistration.js`

**Purpose**: Creates User records from registration data.

**Functions**:
- `createUserFromRegistration(userData)` - Generic user creation
- `createOrganizationAdminUser(organizationId, adminData)` - Organization admin creation
- `createTeacherUser(teacherId, teacherData)` - Teacher user creation
- `createStudentUser(studentId, studentData)` - Student user creation

**User Model Structure**:
```javascript
{
  email: String (lowercase, unique per userType),
  password: String (hashed with bcrypt),
  userType: 'organization_admin' | 'sub_admin' | 'teacher' | 'student',
  userId: ObjectId (reference to specific model),
  userModel: 'Organization' | 'Teacher' | 'Student',
  userTypeEmail: String (unique: email_userType),
  authProvider: 'local' | 'google' | 'temp_password' | 'pending_registration',
  isEmailVerified: Boolean,
  phoneVerified: Boolean,
  isRegistrationComplete: Boolean,
  isActive: Boolean
}
```

### OTP System

**OTP Generation**:
- 6-digit numeric OTP
- Stored in temp storage with 10-minute expiration
- Key format: `otp_email_{email}` or `otp_phone_{phone}`

**OTP Verification**:
- Validates OTP against stored value
- Checks expiration
- Removes OTP after successful verification
- Prevents reuse

**Implementation Status**:
- ✅ OTP generation and storage
- ✅ OTP verification logic
- ⚠️ Email sending (TODO)
- ⚠️ SMS sending (TODO - Twilio integration needed)

---

## Data Flow

### Organization Registration Flow

```
Frontend                    Backend                    Database
   |                           |                           |
   |-- Step 1 Data ----------->|                           |
   |                           |-- Generate Org Code ----->|
   |                           |-- Store in Temp Storage   |
   |<-- Registration Token ----|                           |
   |                           |                           |
   |-- Step 2 Data + Token --->|                           |
   |                           |-- Validate & Hash Password|
   |                           |-- Store in Temp Storage   |
   |<-- Step 2 Response ------|                           |
   |                           |                           |
   |-- Send Email OTP -------->|                           |
   |                           |-- Generate & Store OTP   |
   |<-- OTP Sent --------------|                           |
   |                           |                           |
   |-- Verify Email OTP ------>|                           |
   |                           |-- Validate OTP           |
   |<-- Email Verified --------|                           |
   |                           |                           |
   |-- Send Phone OTP -------->|                           |
   |                           |-- Generate & Store OTP   |
   |<-- OTP Sent --------------|                           |
   |                           |                           |
   |-- Verify Phone OTP ------>|                           |
   |                           |-- Validate OTP           |
   |<-- Phone Verified --------|                           |
   |                           |                           |
   |-- Step 3 Data + Token --->|                           |
   |                           |-- Retrieve All Data       |
   |                           |-- Create Organization --->|
   |                           |-- Create Admin User ----->|
   |                           |-- Generate JWT Token      |
   |                           |-- Clean Temp Storage      |
   |<-- Success + Token -------|                           |
   |                           |                           |
```

### Session Management

1. **Registration Token**: Generated in Step 1, used throughout registration
2. **Temporary Storage**: All step data stored with registration token as key
3. **Expiration**: 1 hour default TTL
4. **Cleanup**: Automatic cleanup after successful registration or expiration

---

## Security Features

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters, password confirmation required
- **Storage**: Only hashed passwords stored, never plain text

### OTP Security
- **Generation**: Cryptographically random 6-digit OTP
- **Expiration**: 10 minutes
- **Single Use**: OTP removed after verification
- **Storage**: Separate keys for email and phone OTPs

### Session Security
- **Token Generation**: Random alphanumeric tokens
- **Expiration**: 1 hour default TTL
- **Validation**: Token validated at each step
- **Cleanup**: Automatic cleanup of expired sessions

### Data Validation
- **Input Validation**: All fields validated before processing
- **Email Validation**: Format validation and uniqueness check
- **Organization Code**: Uniqueness validation
- **Duplicate Prevention**: Checks for existing users/organizations

### Authentication
- **JWT Tokens**: Generated upon successful registration
- **Token Versioning**: Token version tracking for invalidation
- **User Type**: Role-based access control

---

## API Endpoints

### Organization Registration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/organizations/register/step1` | Step 1: Organization details | No |
| POST | `/api/organizations/register/step2` | Step 2: Admin details | No |
| POST | `/api/organizations/auth/send-email-otp` | Send email OTP | No |
| POST | `/api/organizations/register/verify-email-otp` | Verify email OTP | No |
| POST | `/api/organizations/auth/send-phone-otp` | Send phone OTP | No |
| POST | `/api/organizations/register/verify-phone-otp` | Verify phone OTP | No |
| POST | `/api/organizations/register/step3` | Step 3: Complete registration | No |
| POST | `/api/organizations/upload/logo` | Upload organization logo | No |
| GET | `/api/organizations/code/:orgCode` | Get organization by code | No |

### Teacher Registration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/teachers/register/step1` | Step 1: Basic details | No |
| POST | `/api/teachers/register/step2` | Step 2: Professional details | No |
| POST | `/api/teachers/register/step3` | Step 3: Organization link | No |
| POST | `/api/teachers/register/step4` | Step 4: Security verification | No |
| POST | `/api/teachers/register` | Legacy single-step registration | No |

### Student Registration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/students/register/step1` | Step 1: Basic details | No |
| POST | `/api/students/register/step2` | Step 2: Organization verification | No |
| POST | `/api/students/register/step3` | Step 3: Security verification | No |
| POST | `/api/students/register/step4` | Step 4: Auto mapping | No |

---

## Error Handling

### Common Error Responses

**Validation Error**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

**Session Expired**:
```json
{
  "success": false,
  "message": "Registration session not found or expired"
}
```

**Duplicate Entry**:
```json
{
  "success": false,
  "message": "Admin user with this email already exists"
}
```

**Invalid OTP**:
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

---

## Frontend State Management

### Registration State Structure

```javascript
{
  activeStep: 0-2 (Organization) | 0-3 (Teacher/Student),
  registrationToken: String,
  formData: {
    // Step-specific data
  },
  formErrors: {
    // Field-specific errors
  },
  isSubmitting: Boolean,
  emailVerified: Boolean,
  phoneVerified: Boolean
}
```

### Navigation Flow

1. **Step Navigation**: Controlled by `activeStep` state
2. **Validation**: Per-step validation before proceeding
3. **Back Navigation**: Allowed with data preservation
4. **Session Persistence**: Registration token stored in component state
5. **Success Handling**: Redirects to dashboard with JWT token

---

## Production Considerations

### Temporary Storage
- **Current**: In-memory Map (lost on server restart)
- **Recommended**: Redis or MongoDB with TTL indexes
- **Benefits**: Persistence, scalability, distributed systems support

### Email/SMS Integration
- **Current**: OTP generation only (not sent)
- **Required**: 
  - Email: Nodemailer or SendGrid integration
  - SMS: Twilio or similar service integration
- **Configuration**: Environment variables for API keys

### Rate Limiting
- **Recommended**: Implement rate limiting on OTP endpoints
- **Prevents**: OTP spam and abuse
- **Implementation**: Express rate limiter middleware

### Logging
- **Current**: Basic logging implemented
- **Recommended**: Structured logging with PII sanitization
- **Tools**: Winston, Pino, or similar

### Monitoring
- **Recommended**: Track registration completion rates
- **Metrics**: Step abandonment, OTP verification rates, errors
- **Tools**: Application monitoring (e.g., New Relic, Datadog)

---

## Testing

### Test Files
- `backend/scripts/debug/test-registration-flow.js` - Registration flow testing
- `backend/scripts/debug/investigate-registrations.js` - Registration investigation

### Manual Testing Checklist
- [ ] Organization registration complete flow
- [ ] Email OTP generation and verification
- [ ] Phone OTP generation and verification
- [ ] Logo upload and finalization
- [ ] Session expiration handling
- [ ] Duplicate prevention
- [ ] Error handling and validation
- [ ] Teacher registration flow
- [ ] Student registration flow

---

## Summary

The registration system is a comprehensive multi-step process that:

1. **Collects data incrementally** across multiple steps
2. **Validates at each step** before proceeding
3. **Uses temporary storage** for session management
4. **Implements OTP verification** for email and phone
5. **Creates user accounts** with proper authentication
6. **Generates JWT tokens** for immediate access
7. **Handles errors gracefully** with clear messages
8. **Supports three user types**: Organization Admin, Teacher, Student

The system is designed to be secure, user-friendly, and scalable, with clear separation of concerns between frontend, backend controllers, services, and repositories.





