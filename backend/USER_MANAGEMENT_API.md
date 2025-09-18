# User Management API Documentation

## Overview
The User Management API provides comprehensive functionality for managing users, roles, permissions, and activities within an organization.

## Base URL
```
/api/user-management
/api/user-activity
/api/user-permissions
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## User Management Endpoints

### 1. Get All Users
**GET** `/api/user-management/organization/:organizationId/users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (admin, sub_admin, teacher, student)
- `status` (optional): Filter by status (active, pending, inactive, suspended)
- `search` (optional): Search term for name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 50,
      "limit": 10
    }
  }
}
```

### 2. Get User by ID
**GET** `/api/user-management/users/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "teacher",
    "department": "Mathematics",
    "status": "active",
    "lastLogin": "2024-01-17T10:30:00Z",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Create User
**POST** `/api/user-management/users`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "countryCode": "+1",
  "role": "teacher",
  "department": "Mathematics",
  "status": "active",
  "password": "securePassword123",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St",
  "emergencyContact": "Jane Doe",
  "emergencyPhone": "0987654321",
  "notes": "Additional notes",
  "organizationId": "org_id"
}
```

### 4. Update User
**PUT** `/api/user-management/users/:userId`

**Request Body:** (Same as create, but all fields optional)

### 5. Delete User (Deactivate)
**DELETE** `/api/user-management/users/:userId`

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### 6. Bulk Create Users
**POST** `/api/user-management/users/bulk`

**Request Body:**
```json
{
  "users": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "teacher",
      "department": "Mathematics"
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "role": "student",
      "department": "Grade 10A"
    }
  ],
  "organizationId": "org_id"
}
```

### 7. Send Invitation
**POST** `/api/user-management/invitations`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "teacher",
  "department": "Science",
  "customMessage": "Welcome to our organization!",
  "expiryDays": 7,
  "organizationId": "org_id"
}
```

### 8. Get Invitation
**GET** `/api/user-management/invitations/:token`

### 9. Accept Invitation
**POST** `/api/user-management/invitations/:token/accept`

**Request Body:**
```json
{
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "1234567890",
  "countryCode": "+1"
}
```

### 10. Get User Statistics
**GET** `/api/user-management/organization/:organizationId/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "active": 1100,
    "pending": 50,
    "inactive": 100,
    "teachers": 45,
    "students": 1200,
    "admins": 5
  }
}
```

### 11. Update User Role
**PUT** `/api/user-management/users/:userId/role`

**Request Body:**
```json
{
  "role": "sub_admin",
  "department": "Administration"
}
```

---

## User Activity Endpoints

### 1. Track User Activity
**POST** `/api/user-activity/users/:userId/activity`

**Request Body:**
```json
{
  "activity": "Viewed dashboard",
  "deviceInfo": "Desktop - Chrome",
  "location": "Office"
}
```

### 2. Get User Activity Log
**GET** `/api/user-activity/users/:userId/activity`

**Query Parameters:**
- `limit` (optional): Number of activities (default: 50)
- `offset` (optional): Skip activities (default: 0)

### 3. Get Online Users
**GET** `/api/user-activity/organization/:organizationId/online-users`

**Query Parameters:**
- `limit` (optional): Maximum users to return (default: 100)

### 4. Get User Session
**GET** `/api/user-activity/users/:userId/session`

### 5. Update User Session
**PUT** `/api/user-activity/users/:userId/session`

**Request Body:**
```json
{
  "deviceInfo": "Mobile - Safari",
  "location": "Home",
  "sessionDuration": 120
}
```

---

## User Permission Endpoints

### 1. Get User Permissions
**GET** `/api/user-permissions/users/:userId/permissions`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "role": "teacher",
    "permissions": {
      "userManagement": { "read": false, "write": false, "delete": false },
      "studentManagement": { "read": true, "write": true, "delete": false },
      "examManagement": { "read": true, "write": true, "delete": false }
    }
  }
}
```

### 2. Check User Permission
**GET** `/api/user-permissions/users/:userId/permissions/check?resource=userManagement&action=read`

### 3. Get All Role Permissions
**GET** `/api/user-permissions/roles/permissions`

### 4. Update Role Permissions (Admin Only)
**PUT** `/api/user-permissions/roles/permissions`

**Request Body:**
```json
{
  "role": "teacher",
  "permissions": {
    "userManagement": { "read": true, "write": false, "delete": false }
  }
}
```

### 5. Get Users by Role
**GET** `/api/user-permissions/organization/:organizationId/users/by-role?role=teacher`

### 6. Get Role Distribution
**GET** `/api/user-permissions/organization/:organizationId/role-distribution`

**Response:**
```json
{
  "success": true,
  "data": {
    "distribution": [
      { "_id": "student", "count": 1200, "active": 1100 },
      { "_id": "teacher", "count": 45, "active": 42 },
      { "_id": "admin", "count": 3, "active": 3 },
      { "_id": "sub_admin", "count": 2, "active": 2 }
    ],
    "total": 1250
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Models

### User Management Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique),
  password: String (required for email auth),
  phone: String,
  countryCode: String (default: "+1"),
  role: String (enum: admin, sub_admin, teacher, student),
  department: String,
  organizationId: ObjectId (required),
  status: String (enum: active, pending, inactive, suspended),
  authProvider: String (enum: email, google, invitation),
  emailVerified: Boolean (default: false),
  phoneVerified: Boolean (default: false),
  lastLogin: Date,
  loginCount: Number (default: 0),
  dateOfBirth: Date,
  address: String,
  emergencyContact: String,
  emergencyPhone: String,
  notes: String,
  profile: Object,
  lastActivity: Date,
  sessionDuration: Number,
  deviceInfo: String,
  location: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Role Permissions
```javascript
{
  admin: {
    userManagement: { read: true, write: true, delete: true },
    organizationSettings: { read: true, write: true, delete: true },
    studentManagement: { read: true, write: true, delete: true },
    teacherManagement: { read: true, write: true, delete: true },
    examManagement: { read: true, write: true, delete: true },
    reports: { read: true, write: true, delete: true },
    systemSettings: { read: true, write: true, delete: true },
    roleManagement: { read: true, write: true, delete: true }
  },
  sub_admin: {
    userManagement: { read: true, write: true, delete: false },
    organizationSettings: { read: true, write: false, delete: false },
    studentManagement: { read: true, write: true, delete: true },
    teacherManagement: { read: true, write: true, delete: false },
    examManagement: { read: true, write: true, delete: true },
    reports: { read: true, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: true, write: false, delete: false }
  },
  teacher: {
    userManagement: { read: false, write: false, delete: false },
    organizationSettings: { read: false, write: false, delete: false },
    studentManagement: { read: true, write: true, delete: false },
    teacherManagement: { read: false, write: false, delete: false },
    examManagement: { read: true, write: true, delete: false },
    reports: { read: true, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: false, write: false, delete: false }
  },
  student: {
    userManagement: { read: false, write: false, delete: false },
    organizationSettings: { read: false, write: false, delete: false },
    studentManagement: { read: false, write: false, delete: false },
    teacherManagement: { read: false, write: false, delete: false },
    examManagement: { read: true, write: false, delete: false },
    reports: { read: false, write: false, delete: false },
    systemSettings: { read: false, write: false, delete: false },
    roleManagement: { read: false, write: false, delete: false }
  }
}
```

---

## Usage Examples

### Frontend Integration

```javascript
// Get all users
const response = await fetch('/api/user-management/organization/org123/users?page=1&limit=10', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Create new user
const newUser = await fetch('/api/user-management/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'teacher',
    department: 'Mathematics',
    organizationId: 'org123'
  })
});

// Check user permissions
const permissions = await fetch('/api/user-permissions/users/user123/permissions/check?resource=userManagement&action=write', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

This comprehensive API provides all the functionality needed for the user management system with proper authentication, authorization, and error handling.
