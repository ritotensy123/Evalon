# Organization Registration API Documentation

## Overview
This API provides a comprehensive organization registration system with multi-step verification including email and phone OTP verification.

## Base URL
```
http://localhost:5001/api/organizations
```

## Registration Flow

### Step 1: Organization Details
**Endpoint:** `POST /register/step1`

**Description:** Register basic organization information and generate a unique organization code.

**Request Body:**
```json
{
  "organisationName": "Test University",
  "country": "india",
  "state": "maharashtra", 
  "city": "Mumbai",
  "pincode": "400001",
  "organisationType": "university",
  "studentStrength": "1000",
  "isGovernmentRecognized": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization details saved successfully",
  "data": {
    "orgCode": "IN-TES-2025-JDQ",
    "step": 1,
    "nextStep": "admin_details",
    "registrationToken": "19b9iovfab4mfbagtus"
  }
}
```

### Step 2: Admin Details
**Endpoint:** `POST /register/step2`

**Description:** Register admin user details with password hashing.

**Request Body:**
```json
{
  "adminName": "John Doe",
  "adminEmail": "john.doe@testuniversity.edu",
  "adminPhone": "9876543210",
  "countryCode": "+91",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "registrationToken": "19b9iovfab4mfbagtus"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin details saved successfully",
  "data": {
    "step": 2,
    "nextStep": "otp_verification",
    "email": "john.doe@testuniversity.edu",
    "phone": "+919876543210",
    "requiresVerification": {
      "email": true,
      "phone": true
    },
    "registrationToken": "19b9iovfab4mfbagtus"
  }
}
```

### Step 3: OTP Verification

#### Send Email OTP
**Endpoint:** `POST /auth/send-email-otp`

**Request Body:**
```json
{
  "email": "john.doe@testuniversity.edu",
  "purpose": "registration"
}
```

#### Verify Email OTP
**Endpoint:** `POST /register/verify-email-otp`

**Request Body:**
```json
{
  "email": "john.doe@testuniversity.edu",
  "otp": "123456"
}
```

#### Send Phone OTP
**Endpoint:** `POST /auth/send-phone-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "purpose": "registration"
}
```

#### Verify Phone OTP
**Endpoint:** `POST /register/verify-phone-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "countryCode": "+91",
  "otp": "123456"
}
```

### Step 4: Setup Preferences & Complete Registration
**Endpoint:** `POST /register/step3`

**Description:** Complete registration with organization preferences and create the final organization and admin records.

**Request Body:**
```json
{
  "institutionStructure": "multi",
  "departments": ["Computer Science", "Mathematics", "Physics"],
  "addSubAdmins": false,
  "timeZone": "UTC+05:30",
  "twoFactorAuth": true,
  "logo": "base64_encoded_image_or_file_path",
  "registrationToken": "19b9iovfab4mfbagtus"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Organization registered successfully!",
  "data": {
    "organization": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Test University",
      "orgCode": "IN-TES-2025-JDQ",
      "email": "john.doe@testuniversity.edu",
      "status": "active"
    },
    "admin": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "John Doe",
      "email": "john.doe@testuniversity.edu",
      "role": "admin",
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

## Utility Endpoints

### Get Registration Status
**Endpoint:** `GET /register/status?registrationToken={token}`

**Description:** Check the current status of a registration session.

**Response:**
```json
{
  "success": true,
  "data": {
    "step1Completed": true,
    "step2Completed": true,
    "emailVerified": false,
    "phoneVerified": false,
    "currentStep": 3,
    "orgCode": "IN-TES-2025-JDQ"
  }
}
```

### Check Organization Code
**Endpoint:** `GET /check-code/{orgCode}`

**Description:** Check if an organization code is available.

**Response:**
```json
{
  "success": true,
  "exists": false,
  "message": "Organization code is available"
}
```

### Get Organization by Code
**Endpoint:** `GET /code/{orgCode}`

**Description:** Retrieve organization details by organization code.

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Test University",
    "orgCode": "IN-TES-2025-JDQ",
    "email": "john.doe@testuniversity.edu",
    "status": "active",
    "createdAt": "2025-09-08T15:34:02.000Z"
  }
}
```

### Clear Registration Session
**Endpoint:** `DELETE /register/session`

**Description:** Clear the current registration session data.

## File Upload

### Upload Organization Logo
**Endpoint:** `POST /upload/logo`

**Description:** Upload organization logo (max 2MB, PNG/JPG only).

**Request:** Multipart form data with `logo` field

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "filename": "logo_1234567890.png",
    "originalName": "university_logo.png",
    "size": 1024000,
    "mimetype": "image/png",
    "url": "/uploads/logo_1234567890.png"
  }
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "organisationName",
      "message": "Organisation Name Is Required"
    }
  ]
}
```

### Session Expired
```json
{
  "success": false,
  "message": "Registration session not found or expired"
}
```

### Duplicate Organization
```json
{
  "success": false,
  "message": "An organization with this name already exists"
}
```

## Organization Code Format
Organization codes follow the format: `{COUNTRY_CODE}-{ORG_ABBREV}-{YEAR}-{RANDOM}`

Example: `IN-TES-2025-JDQ`
- `IN`: India (first 2 letters of country)
- `TES`: Test (first 3 letters of organization name)
- `2025`: Current year
- `JDQ`: Random 3-character alphanumeric string

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
2. **JWT Authentication**: Admin tokens are generated upon successful registration
3. **OTP Verification**: Email and phone verification required before completion
4. **Session Management**: Temporary storage with automatic expiration (30 minutes)
5. **Input Validation**: Comprehensive validation using express-validator
6. **Rate Limiting**: API rate limiting to prevent abuse

## Frontend Integration

The frontend should:
1. Store the `registrationToken` from Step 1 response
2. Include the token in all subsequent requests
3. Handle OTP verification flows
4. Display appropriate error messages
5. Show registration progress using the status endpoint

## Testing

Use the provided test endpoints to verify:
- Server health: `GET /health`
- Registration flow: Follow the step-by-step process
- OTP functionality: Test with valid email/phone numbers
- File uploads: Test logo upload functionality

## Notes

- Registration tokens expire after 30 minutes
- Phone OTP requires verified Twilio numbers for trial accounts
- All timestamps are in ISO 8601 format
- Organization codes are unique and auto-generated
- Session data is stored in memory (use Redis for production)

