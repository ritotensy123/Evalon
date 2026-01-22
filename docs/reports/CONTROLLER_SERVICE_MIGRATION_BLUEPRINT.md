# CONTROLLER → SERVICE → REPOSITORY MIGRATION BLUEPRINT
## Phase 2 - Task 2.4: Complete Migration Architecture Plan

**Date:** Generated during refactor planning  
**Status:** ✅ BLUEPRINT COMPLETE - NO CODE MODIFICATIONS  
**Scope:** Complete controller-to-service-to-repository migration mapping  
**Mode:** SAFE MODE (Planning Only)

---

## EXECUTIVE SUMMARY

This blueprint provides a comprehensive migration plan for refactoring the Evalon backend from a controller-centric architecture to a clean architecture pattern with clear separation of concerns:

- **Controllers:** Handle HTTP requests/responses only
- **Services:** Contain business logic and orchestration
- **Repositories:** Handle data access and persistence

**Total Controllers Analyzed:** 17  
**Total Controller Methods:** 150+  
**Total Services Required:** 7 (existing) + 10 (new)  
**Total Repositories Required:** 7 (existing) + 8 (new)

---

## PART A: ARCHITECTURE OVERVIEW

### A.1 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                         │
│  - HTTP Request/Response handling                            │
│  - Input validation (basic)                                 │
│  - Response formatting (using apiResponse utilities)         │
│  - Error handling (using asyncWrapper)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                            │
│  - Business logic                                            │
│  - Business rules validation                                 │
│  - Cross-entity operations                                   │
│  - Transaction management                                     │
│  - External service integration                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   REPOSITORY LAYER                          │
│  - Data access (Mongoose queries)                            │
│  - Data persistence                                          │
│  - Query optimization                                        │
│  - Data transformation                                       │
└─────────────────────────────────────────────────────────────┘
```

### A.2 Naming Conventions

#### Service Methods (camelCase)
- `createUser()`
- `getUserById()`
- `updateUser()`
- `deleteUser()`
- `getAllUsers()`
- `findUsersByOrganization()`

#### Repository Methods (Standard CRUD + Query)
- `create(data)` - Create single entity
- `findById(id, options)` - Find by ID
- `findOne(filter, options)` - Find single entity
- `findAll(filter, options)` - Find multiple entities
- `updateOne(id, data)` - Update single entity
- `deleteOne(id)` - Delete single entity
- `count(filter)` - Count entities
- `exists(filter)` - Check existence

### A.3 Standard Error Flow

```javascript
// In Service Layer
if (!user) {
  throw AppError.notFound('User not found');
}

// In Controller Layer
try {
  const result = await userService.getUserById(userId);
  return sendSuccess(res, result, 'User retrieved successfully');
} catch (error) {
  // Error automatically caught by asyncWrapper and passed to errorHandler
  throw error; // Re-throw to let errorHandler process it
}
```

### A.4 Standard Response Flow

```javascript
// Success Response
sendSuccess(res, data, message, statusCode);

// Paginated Response
sendPaginated(res, items, total, page, limit, message);

// Error Response (handled by errorHandler middleware)
// Controllers should throw AppError instances
throw AppError.badRequest('Invalid input');
```

---

## PART B: CONTROLLER METHOD MAPPING

### B.1 AuthController → AuthService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `login()` | `authenticateUser(email, password, userType)` | `UserRepository.findOne()`, `UserRepository.updateOne()` | P1 |
| `getProfile()` | `getUserProfile(userId)` | `UserRepository.findById()` | P1 |
| `updateProfile()` | `updateUserProfile(userId, profileData)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P1 |
| `changePassword()` | `changeUserPassword(userId, oldPassword, newPassword)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P1 |
| `logout()` | `logoutUser(userId)` | `UserRepository.updateOne()` | P2 |
| `verifyToken()` | `verifyUserToken(token)` | `UserRepository.findById()` | P2 |
| `googleSignIn()` | `authenticateWithGoogle(credential)` | `UserRepository.findOne()`, `UserRepository.create()`, `UserRepository.updateOne()` | P2 |
| `completeFirstTimeLogin()` | `completeFirstTimeLogin(userId, password, profileData)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P1 |
| `sendEmailVerification()` | `sendEmailVerification(userId)` | `UserRepository.findById()` | P2 |
| `verifyEmailWithOTP()` | `verifyEmailWithOTP(userId, otpCode)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P2 |

**Service Method Definitions:**

```javascript
// AuthService.js

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} userType - User type (teacher, student, etc.)
 * @returns {Object} - { user, token, dashboard, organization }
 * @throws {AppError} - If authentication fails
 */
async authenticateUser(email, password, userType) {
  // 1. Validate input
  // 2. Find user by email and type (UserRepository.findOne)
  // 3. Check if user exists
  // 4. Check if account is active
  // 5. Check email verification
  // 6. Verify password
  // 7. Update last login (UserRepository.updateOne)
  // 8. Generate JWT token
  // 9. Populate user data
  // 10. Return user, token, dashboard, organization data
}

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Object} - User profile data
 * @throws {AppError} - If user not found
 */
async getUserProfile(userId) {
  // 1. Find user by ID (UserRepository.findById)
  // 2. Check if user exists
  // 3. Populate related data
  // 4. Return profile
}
```

---

### B.2 UserManagementController → UserService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `getAllUserManagements()` | `getAllUsers(organizationId, filters, pagination)` | `UserRepository.findAll()`, `TeacherRepository.findAll()`, `StudentRepository.findAll()` | P1 |
| `getUserManagementById()` | `getUserById(userId, organizationId)` | `UserRepository.findById()` | P1 |
| `createUserManagement()` | `createUser(userData, organizationId)` | `UserRepository.create()`, `TeacherRepository.create()` or `StudentRepository.create()` | P1 |
| `updateUserManagement()` | `updateUser(userId, userData, organizationId)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P1 |
| `deleteUserManagement()` | `deleteUser(userId, organizationId)` | `UserRepository.findById()`, `UserRepository.deleteOne()` | P1 |
| `toggleUserStatus()` | `toggleUserStatus(userId, organizationId)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P1 |
| `bulkCreateUserManagements()` | `bulkCreateUsers(usersData, organizationId)` | `UserRepository.create()` (bulk), `TeacherRepository.create()` or `StudentRepository.create()` | P2 |
| `sendInvitation()` | `sendUserInvitation(invitationData, organizationId)` | `InvitationRepository.create()`, `UserRepository.findOne()` | P2 |
| `getInvitation()` | `getInvitationById(invitationId, organizationId)` | `InvitationRepository.findById()` | P2 |
| `acceptInvitation()` | `acceptInvitation(invitationId, userData)` | `InvitationRepository.findById()`, `UserRepository.create()`, `InvitationRepository.updateOne()` | P2 |
| `getInvitations()` | `getInvitations(organizationId, filters)` | `InvitationRepository.findAll()` | P2 |
| `cancelInvitation()` | `cancelInvitation(invitationId, organizationId)` | `InvitationRepository.findById()`, `InvitationRepository.deleteOne()` | P2 |
| `resendInvitation()` | `resendInvitation(invitationId, organizationId)` | `InvitationRepository.findById()`, `InvitationRepository.updateOne()` | P2 |
| `bulkSendInvitations()` | `bulkSendInvitations(invitationsData, organizationId)` | `InvitationRepository.create()` (bulk) | P3 |
| `getUserManagementStats()` | `getUserStatistics(organizationId)` | `UserRepository.count()`, `UserRepository.aggregate()` | P2 |
| `updateUserManagementRole()` | `updateUserRole(userId, role, organizationId)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P2 |
| `updateUserRole()` | `updateUserRole(userId, role, organizationId)` | `UserRepository.findById()`, `UserRepository.updateOne()` | P2 |
| `bulkUpdateUserRoles()` | `bulkUpdateUserRoles(userIds, role, organizationId)` | `UserRepository.updateOne()` (bulk) | P3 |
| `getRoleDistribution()` | `getRoleDistribution(organizationId)` | `UserRepository.aggregate()` | P2 |
| `getRecentActivity()` | `getRecentUserActivity(organizationId, limit)` | `UserRepository.findAll()` | P2 |
| `getUsersByRole()` | `getUsersByRole(role, organizationId, filters)` | `UserRepository.findAll()` | P2 |
| `getRegistrationDetails()` | `getRegistrationDetails(registrationToken)` | `UserRepository.findOne()` | P2 |
| `completeRegistration()` | `completeUserRegistration(registrationToken, userData)` | `UserRepository.findOne()`, `UserRepository.updateOne()` | P2 |
| `validateOrganizationCode()` | `validateOrganizationCode(orgCode)` | `OrganizationRepository.findOne()` | P2 |
| `bulkDeleteUserManagements()` | `bulkDeleteUsers(userIds, organizationId)` | `UserRepository.deleteOne()` (bulk) | P3 |
| `bulkToggleUserManagementStatus()` | `bulkToggleUserStatus(userIds, status, organizationId)` | `UserRepository.updateOne()` (bulk) | P3 |
| `removeUserFromDepartment()` | `removeUserFromDepartment(userId, departmentId, organizationId)` | `UserRepository.findById()`, `TeacherRepository.updateOne()` or `StudentRepository.updateOne()` | P2 |

**Service Method Definitions:**

```javascript
// UserService.js

/**
 * Get all users for an organization with filtering and pagination
 * @param {string} organizationId - Organization ID
 * @param {Object} filters - { role, status, search, departmentId, userType }
 * @param {Object} pagination - { page, limit }
 * @returns {Object} - { users, pagination }
 * @throws {AppError} - If organization not found
 */
async getAllUsers(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
  // 1. Validate organization exists (OrganizationRepository.findById)
  // 2. Build query filters
  // 3. Get teachers and students (TeacherRepository.findAll, StudentRepository.findAll)
  // 4. Get users (UserRepository.findAll)
  // 5. Format and combine results
  // 6. Apply pagination
  // 7. Return formatted users with pagination
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} organizationId - Organization ID
 * @returns {Object} - Created user
 * @throws {AppError} - If validation fails or user already exists
 */
async createUser(userData, organizationId) {
  // 1. Validate organization exists
  // 2. Validate user data
  // 3. Check if user already exists (UserRepository.findOne)
  // 4. Create teacher or student record (TeacherRepository.create or StudentRepository.create)
  // 5. Create user record (UserRepository.create)
  // 6. Send welcome email (if needed)
  // 7. Return created user
}
```

---

### B.3 ExamController → ExamService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createExam()` | `createExam(examData, userId, organizationId)` | `ExamRepository.create()` | P1 |
| `getExams()` | `getExams(organizationId, filters, pagination)` | `ExamRepository.findAll()`, `ExamRepository.count()` | P1 |
| `getExamById()` | `getExamById(examId, organizationId)` | `ExamRepository.findById()` | P1 |
| `updateExamStatus()` | `updateExamStatus(examId, status, organizationId)` | `ExamRepository.findById()`, `ExamRepository.updateOne()` | P1 |
| `updateExam()` | `updateExam(examId, examData, organizationId)` | `ExamRepository.findById()`, `ExamRepository.updateOne()` | P1 |
| `deleteExam()` | `deleteExam(examId, organizationId)` | `ExamRepository.findById()`, `ExamRepository.deleteOne()` | P1 |
| `assignQuestionBankToExam()` | `assignQuestionBankToExam(examId, questionBankId, organizationId)` | `ExamRepository.findById()`, `QuestionBankRepository.findById()`, `ExamRepository.updateOne()` | P1 |
| `getExamQuestions()` | `getExamQuestions(examId, organizationId)` | `ExamRepository.findById()`, `QuestionRepository.findAll()` | P1 |
| `removeQuestionBankFromExam()` | `removeQuestionBankFromExam(examId, questionBankId, organizationId)` | `ExamRepository.findById()`, `ExamRepository.updateOne()` | P1 |
| `getExamStatistics()` | `getExamStatistics(examId, organizationId)` | `ExamRepository.findById()`, `ExamSessionRepository.aggregate()` | P2 |
| `duplicateExam()` | `duplicateExam(examId, newExamData, organizationId)` | `ExamRepository.findById()`, `ExamRepository.create()` | P2 |
| `scheduleExam()` | `scheduleExam(examId, scheduleData, organizationId)` | `ExamRepository.findById()`, `ExamRepository.updateOne()` | P1 |
| `getExamsByTeacher()` | `getExamsByTeacher(teacherId, organizationId, filters)` | `ExamRepository.findAll()` | P2 |
| `getExamsByStudent()` | `getExamsByStudent(studentId, organizationId, filters)` | `ExamRepository.findAll()`, `ExamSessionRepository.findAll()` | P2 |
| `assignTeachersToExam()` | `assignTeachersToExam(examId, teacherIds, organizationId)` | `ExamRepository.findById()`, `TeacherRepository.findAll()`, `ExamRepository.updateOne()` | P1 |
| `getExamResults()` | `getExamResults(examId, organizationId)` | `ExamRepository.findById()`, `ExamSessionRepository.findAll()` | P2 |
| `markExpiredExams()` | `markExpiredExams(organizationId)` | `ExamRepository.findAll()`, `ExamRepository.updateOne()` (bulk) | P3 |

**Service Method Definitions:**

```javascript
// ExamService.js

/**
 * Create a new exam
 * @param {Object} examData - Exam data
 * @param {string} userId - Creator user ID
 * @param {string} organizationId - Organization ID
 * @returns {Object} - Created exam
 * @throws {AppError} - If validation fails
 */
async createExam(examData, userId, organizationId) {
  // 1. Validate organization exists
  // 2. Validate exam data
  // 3. Calculate total marks if not provided
  // 4. Create exam (ExamRepository.create)
  // 5. Return created exam
}

/**
 * Get all exams with filtering and pagination
 * @param {string} organizationId - Organization ID
 * @param {Object} filters - { status, subject, examType }
 * @param {Object} pagination - { page, limit }
 * @returns {Object} - { exams, pagination }
 * @throws {AppError} - If organization not found
 */
async getExams(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
  // 1. Mark expired exams (internal call)
  // 2. Build filter object
  // 3. Get exams (ExamRepository.findAll)
  // 4. Populate related data
  // 5. Get total count (ExamRepository.count)
  // 6. Return exams with pagination
}
```

---

### B.4 QuestionController → QuestionService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createQuestion()` | `createQuestion(questionData, organizationId)` | `QuestionRepository.create()` | P1 |
| `getQuestions()` | `getQuestions(organizationId, filters, pagination)` | `QuestionRepository.findAll()`, `QuestionRepository.count()` | P1 |
| `getQuestionById()` | `getQuestionById(questionId, organizationId)` | `QuestionRepository.findById()` | P1 |
| `updateQuestion()` | `updateQuestion(questionId, questionData, organizationId)` | `QuestionRepository.findById()`, `QuestionRepository.updateOne()` | P1 |
| `deleteQuestion()` | `deleteQuestion(questionId, organizationId)` | `QuestionRepository.findById()`, `QuestionRepository.deleteOne()` | P1 |
| `duplicateQuestion()` | `duplicateQuestion(questionId, organizationId)` | `QuestionRepository.findById()`, `QuestionRepository.create()` | P2 |
| `validateQuestion()` | `validateQuestion(questionData)` | N/A (business logic only) | P2 |
| `getQuestionStatistics()` | `getQuestionStatistics(questionId, organizationId)` | `QuestionRepository.findById()`, `ExamRepository.aggregate()` | P2 |
| `getQuestionsBySubject()` | `getQuestionsBySubject(subjectId, organizationId, filters)` | `QuestionRepository.findAll()` | P2 |
| `getPopularQuestions()` | `getPopularQuestions(organizationId, limit)` | `QuestionRepository.aggregate()` | P2 |
| `recordQuestionAttempt()` | `recordQuestionAttempt(questionId, attemptData, organizationId)` | `QuestionRepository.findById()`, `QuestionRepository.updateOne()` | P2 |
| `bulkImportQuestions()` | `bulkImportQuestions(questionsData, organizationId)` | `QuestionRepository.create()` (bulk) | P2 |
| `exportQuestions()` | `exportQuestions(questionIds, organizationId, format)` | `QuestionRepository.findAll()` | P2 |
| `getAvailableQuestionsForExam()` | `getAvailableQuestionsForExam(examId, organizationId)` | `ExamRepository.findById()`, `QuestionRepository.findAll()` | P2 |

**Service Method Definitions:**

```javascript
// QuestionService.js

/**
 * Create a new question
 * @param {Object} questionData - Question data
 * @param {string} organizationId - Organization ID
 * @returns {Object} - Created question
 * @throws {AppError} - If validation fails
 */
async createQuestion(questionData, organizationId) {
  // 1. Validate organization exists
  // 2. Validate question data
  // 3. Validate question structure (validateQuestion)
  // 4. Create question (QuestionRepository.create)
  // 5. Update question bank statistics if applicable
  // 6. Return created question
}
```

---

### B.5 QuestionBankController → QuestionBankService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createQuestionBank()` | `createQuestionBank(questionBankData, organizationId)` | `QuestionBankRepository.create()` | P1 |
| `getQuestionBanks()` | `getQuestionBanks(organizationId, filters, pagination)` | `QuestionBankRepository.findAll()`, `QuestionBankRepository.count()` | P1 |
| `getQuestionBankById()` | `getQuestionBankById(questionBankId, organizationId)` | `QuestionBankRepository.findById()` | P1 |
| `updateQuestionBank()` | `updateQuestionBank(questionBankId, questionBankData, organizationId)` | `QuestionBankRepository.findById()`, `QuestionBankRepository.updateOne()` | P1 |
| `deleteQuestionBank()` | `deleteQuestionBank(questionBankId, organizationId)` | `QuestionBankRepository.findById()`, `QuestionBankRepository.deleteOne()` | P1 |
| `addQuestionsToBank()` | `addQuestionsToBank(questionBankId, questionIds, organizationId)` | `QuestionBankRepository.findById()`, `QuestionRepository.findAll()`, `QuestionBankRepository.updateOne()` | P1 |
| `getQuestionsInBank()` | `getQuestionsInBank(questionBankId, organizationId, pagination)` | `QuestionBankRepository.findById()`, `QuestionRepository.findAll()` | P1 |
| `removeQuestionFromBank()` | `removeQuestionFromBank(questionBankId, questionId, organizationId)` | `QuestionBankRepository.findById()`, `QuestionBankRepository.updateOne()` | P1 |
| `getQuestionBankStatistics()` | `getQuestionBankStatistics(questionBankId, organizationId)` | `QuestionBankRepository.findById()`, `QuestionRepository.count()` | P2 |
| `duplicateQuestionBank()` | `duplicateQuestionBank(questionBankId, newQuestionBankData, organizationId)` | `QuestionBankRepository.findById()`, `QuestionBankRepository.create()`, `QuestionRepository.findAll()` | P2 |

---

### B.6 OrganizationController → OrganizationService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `registerStep1()` | `registerOrganizationStep1(orgData)` | `OrganizationRepository.findOne()`, `OrganizationRepository.create()` | P1 |
| `registerStep2()` | `registerOrganizationStep2(orgData, tempKey)` | `OrganizationRepository.findOne()`, `OrganizationRepository.updateOne()` | P1 |
| `sendEmailOTP()` | `sendOrganizationEmailOTP(email)` | `OrganizationRepository.findOne()` | P2 |
| `verifyEmailOTP()` | `verifyOrganizationEmailOTP(email, otpCode)` | `OrganizationRepository.findOne()` | P2 |
| `sendPhoneOTP()` | `sendOrganizationPhoneOTP(phoneNumber)` | `OrganizationRepository.findOne()` | P2 |
| `verifyPhoneOTP()` | `verifyOrganizationPhoneOTP(phoneNumber, otpCode)` | `OrganizationRepository.findOne()` | P2 |
| `completeRegistration()` | `completeOrganizationRegistration(registrationToken, orgData)` | `OrganizationRepository.findOne()`, `OrganizationRepository.updateOne()`, `UserRepository.create()` | P1 |
| `getOrganizationByCode()` | `getOrganizationByCode(orgCode)` | `OrganizationRepository.findOne()` | P1 |
| `getAllOrganizations()` | `getAllOrganizations(filters, pagination)` | `OrganizationRepository.findAll()`, `OrganizationRepository.count()` | P2 |
| `updateOrganization()` | `updateOrganization(organizationId, orgData)` | `OrganizationRepository.findById()`, `OrganizationRepository.updateOne()` | P1 |
| `deleteOrganization()` | `deleteOrganization(organizationId)` | `OrganizationRepository.findById()`, `OrganizationRepository.deleteOne()` | P1 |
| `uploadLogo()` | `uploadOrganizationLogo(organizationId, logoFile)` | `OrganizationRepository.findById()`, `OrganizationRepository.updateOne()` | P2 |
| `completeSetup()` | `completeOrganizationSetup(organizationId, setupData)` | `OrganizationRepository.findById()`, `OrganizationRepository.updateOne()` | P2 |
| `getSetupStatus()` | `getOrganizationSetupStatus(organizationId)` | `OrganizationRepository.findById()` | P2 |
| `skipSetup()` | `skipOrganizationSetup(organizationId)` | `OrganizationRepository.findById()`, `OrganizationRepository.updateOne()` | P2 |

---

### B.7 TeacherController → TeacherService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `registerStep1()` | `registerTeacherStep1(teacherData)` | `UserRepository.findOne()`, `TeacherRepository.findOne()` | P1 |
| `registerStep2()` | `registerTeacherStep2(teacherData, tempKey)` | `TeacherRepository.findOne()` | P1 |
| `registerStep3()` | `registerTeacherStep3(teacherData, tempKey)` | `TeacherRepository.findOne()` | P1 |
| `registerStep4()` | `registerTeacherStep4(teacherData, tempKey)` | `TeacherRepository.findOne()`, `UserRepository.create()` | P1 |
| `registerTeacher()` | `registerTeacher(teacherData, organizationId)` | `TeacherRepository.create()`, `UserRepository.create()` | P1 |
| `getTeacherById()` | `getTeacherById(teacherId, organizationId)` | `TeacherRepository.findById()` | P1 |
| `getAllTeachers()` | `getAllTeachers(organizationId, filters, pagination)` | `TeacherRepository.findAll()`, `TeacherRepository.count()` | P1 |
| `updateTeacher()` | `updateTeacher(teacherId, teacherData, organizationId)` | `TeacherRepository.findById()`, `TeacherRepository.updateOne()` | P1 |
| `deleteTeacher()` | `deleteTeacher(teacherId, organizationId)` | `TeacherRepository.findById()`, `TeacherRepository.deleteOne()`, `UserRepository.deleteOne()` | P1 |
| `sendEmailOTPForTeacher()` | `sendTeacherEmailOTP(email)` | `TeacherRepository.findOne()` | P2 |
| `sendPhoneOTPForTeacher()` | `sendTeacherPhoneOTP(phoneNumber)` | `TeacherRepository.findOne()` | P2 |
| `verifyEmailOTPForTeacher()` | `verifyTeacherEmailOTP(email, otpCode)` | `TeacherRepository.findOne()` | P2 |
| `verifyPhoneOTPForTeacher()` | `verifyTeacherPhoneOTP(phoneNumber, otpCode)` | `TeacherRepository.findOne()` | P2 |
| `assignToDepartment()` | `assignTeacherToDepartment(teacherId, departmentId, organizationId)` | `TeacherRepository.findById()`, `DepartmentRepository.findById()`, `TeacherRepository.updateOne()` | P1 |
| `removeFromDepartment()` | `removeTeacherFromDepartment(teacherId, departmentId, organizationId)` | `TeacherRepository.findById()`, `TeacherRepository.updateOne()` | P1 |

---

### B.8 StudentController → StudentService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `getStudents()` | `getStudents(organizationId, filters, pagination)` | `StudentRepository.findAll()`, `StudentRepository.count()`, `StudentRepository.aggregate()` | P1 |
| `getStudentById()` | `getStudentById(studentId, organizationId)` | `StudentRepository.findById()` | P1 |
| `createStudent()` | `createStudent(studentData, organizationId)` | `StudentRepository.create()`, `UserRepository.create()` | P1 |
| `updateStudent()` | `updateStudent(studentId, studentData, organizationId)` | `StudentRepository.findById()`, `StudentRepository.updateOne()` | P1 |
| `deleteStudent()` | `deleteStudent(studentId, organizationId)` | `StudentRepository.findById()`, `StudentRepository.deleteOne()`, `UserRepository.deleteOne()` | P1 |
| `getStudentStats()` | `getStudentStatistics(organizationId)` | `StudentRepository.aggregate()` | P2 |
| `assignToDepartment()` | `assignStudentToDepartment(studentId, departmentId, organizationId)` | `StudentRepository.findById()`, `DepartmentRepository.findById()`, `StudentRepository.updateOne()` | P1 |
| `removeFromDepartment()` | `removeStudentFromDepartment(studentId, departmentId, organizationId)` | `StudentRepository.findById()`, `StudentRepository.updateOne()` | P1 |

---

### B.9 DepartmentController → DepartmentService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createDepartment()` | `createDepartment(departmentData, organizationId)` | `DepartmentRepository.create()`, `OrganizationRepository.findById()` | P1 |
| `getDepartments()` | `getDepartments(organizationId, filters)` | `DepartmentRepository.findAll()` | P1 |
| `getDepartmentById()` | `getDepartmentById(departmentId, organizationId)` | `DepartmentRepository.findById()` | P1 |
| `updateDepartment()` | `updateDepartment(departmentId, departmentData, organizationId)` | `DepartmentRepository.findById()`, `DepartmentRepository.updateOne()` | P1 |
| `deleteDepartment()` | `deleteDepartment(departmentId, organizationId)` | `DepartmentRepository.findById()`, `DepartmentRepository.deleteOne()` | P1 |
| `getDepartmentHierarchy()` | `getDepartmentHierarchy(organizationId, rootDepartmentId)` | `DepartmentRepository.findAll()`, `DepartmentRepository.findById()` | P2 |
| `getDepartmentStatistics()` | `getDepartmentStatistics(departmentId, organizationId)` | `DepartmentRepository.findById()`, `TeacherRepository.count()`, `StudentRepository.count()` | P2 |

---

### B.10 SubjectController → SubjectService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createSubject()` | `createSubject(subjectData, organizationId)` | `SubjectRepository.create()`, `OrganizationRepository.findById()`, `DepartmentRepository.findById()` | P1 |
| `getSubjects()` | `getSubjects(organizationId, filters, pagination)` | `SubjectRepository.findAll()`, `SubjectRepository.count()` | P1 |
| `getSubjectById()` | `getSubjectById(subjectId, organizationId)` | `SubjectRepository.findById()` | P1 |
| `updateSubject()` | `updateSubject(subjectId, subjectData, organizationId)` | `SubjectRepository.findById()`, `SubjectRepository.updateOne()` | P1 |
| `deleteSubject()` | `deleteSubject(subjectId, organizationId)` | `SubjectRepository.findById()`, `SubjectRepository.deleteOne()` | P1 |
| `getSubjectsByDepartment()` | `getSubjectsByDepartment(departmentId, organizationId)` | `SubjectRepository.findAll()` | P2 |
| `getSubjectStatistics()` | `getSubjectStatistics(subjectId, organizationId)` | `SubjectRepository.findById()`, `QuestionRepository.count()`, `ExamRepository.count()` | P2 |

---

### B.11 TeacherClassController → TeacherClassService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `createTeacherClass()` | `createTeacherClass(teacherClassData, organizationId)` | `TeacherClassRepository.create()`, `TeacherRepository.findById()`, `SubjectRepository.findById()`, `DepartmentRepository.findById()` | P1 |
| `getTeacherClasses()` | `getTeacherClasses(organizationId, filters, pagination)` | `TeacherClassRepository.findAll()`, `TeacherClassRepository.count()` | P1 |
| `getAvailableStudents()` | `getAvailableStudents(teacherClassId, organizationId)` | `TeacherClassRepository.findById()`, `StudentRepository.findAll()` | P2 |
| `addStudentsToClass()` | `addStudentsToClass(teacherClassId, studentIds, organizationId)` | `TeacherClassRepository.findById()`, `StudentRepository.findAll()`, `TeacherClassRepository.updateOne()` | P1 |
| `removeStudentFromClass()` | `removeStudentFromClass(teacherClassId, studentId, organizationId)` | `TeacherClassRepository.findById()`, `TeacherClassRepository.updateOne()` | P1 |
| `getTeacherClass()` | `getTeacherClassById(teacherClassId, organizationId)` | `TeacherClassRepository.findById()` | P1 |
| `updateTeacherClass()` | `updateTeacherClass(teacherClassId, teacherClassData, organizationId)` | `TeacherClassRepository.findById()`, `TeacherClassRepository.updateOne()` | P1 |
| `deleteTeacherClass()` | `deleteTeacherClass(teacherClassId, organizationId)` | `TeacherClassRepository.findById()`, `TeacherClassRepository.deleteOne()` | P1 |

---

### B.12 ExamSessionController → ExamSessionService

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| (Note: ExamSessionController may not exist yet, but methods should be created) | `createExamSession(examId, studentId, organizationId)` | `ExamSessionRepository.create()`, `ExamRepository.findById()`, `StudentRepository.findById()` | P1 |
| | `getExamSessionById(sessionId, organizationId)` | `ExamSessionRepository.findById()` | P1 |
| | `getExamSessionsByExam(examId, organizationId, filters)` | `ExamSessionRepository.findAll()` | P1 |
| | `getExamSessionsByStudent(studentId, organizationId, filters)` | `ExamSessionRepository.findAll()` | P1 |
| | `updateExamSession(sessionId, sessionData, organizationId)` | `ExamSessionRepository.findById()`, `ExamSessionRepository.updateOne()` | P1 |
| | `submitExamSession(sessionId, answers, organizationId)` | `ExamSessionRepository.findById()`, `ExamSessionRepository.updateOne()` | P1 |
| | `getExamSessionResults(sessionId, organizationId)` | `ExamSessionRepository.findById()`, `QuestionRepository.findAll()` | P2 |

---

### B.13 OTPController → OTPService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `sendEmailOTP()` | `sendEmailOTP(email, purpose)` | `OTPRepository.create()` | P2 |
| `sendPhoneOTP()` | `sendPhoneOTP(phoneNumber, purpose)` | `OTPRepository.create()` | P2 |
| `verifyEmailOTP()` | `verifyEmailOTP(email, otpCode, purpose)` | `OTPRepository.findOne()`, `OTPRepository.deleteOne()` | P2 |
| `verifyPhoneOTP()` | `verifyPhoneOTP(phoneNumber, otpCode, purpose)` | `OTPRepository.findOne()`, `OTPRepository.deleteOne()` | P2 |
| `sendEmailOTPForOrganization()` | `sendEmailOTPForOrganization(email)` | `OTPRepository.create()` | P2 |
| `verifyEmailOTPForOrganization()` | `verifyEmailOTPForOrganization(email, otpCode)` | `OTPRepository.findOne()`, `OTPRepository.deleteOne()` | P2 |
| `sendPhoneOTPForOrganization()` | `sendPhoneOTPForOrganization(phoneNumber)` | `OTPRepository.create()` | P2 |
| `verifyPhoneOTPForOrganization()` | `verifyPhoneOTPForOrganization(phoneNumber, otpCode)` | `OTPRepository.findOne()`, `OTPRepository.deleteOne()` | P2 |
| `cleanupExpiredOTPs()` | `cleanupExpiredOTPs()` | `OTPRepository.deleteMany()` | P3 |

---

### B.14 HealthController → HealthService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `getBasicHealth()` | `getBasicHealth()` | N/A (system check only) | P2 |
| `getHealthStatus()` | `getHealthStatus()` | N/A (uses databaseHealth utility) | P2 |
| `fixDataIssues()` | `fixDataIssues(organizationId)` | N/A (uses databaseHealth utility) | P3 |
| `getDatabaseInfo()` | `getDatabaseInfo()` | N/A (Mongoose connection info) | P2 |

---

### B.15 TimeController → TimeService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| `getServerTime()` | `getServerTime()` | N/A (system time only) | P2 |
| `getExamCountdown()` | `getExamCountdown(examId)` | `ExamRepository.findById()` | P2 |

---

### B.16 BulkUploadController → BulkUploadService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| (Methods to be analyzed) | `bulkUploadUsers(file, organizationId)` | `UserRepository.create()` (bulk), `TeacherRepository.create()` or `StudentRepository.create()` | P2 |
| | `bulkUploadQuestions(file, organizationId)` | `QuestionRepository.create()` (bulk) | P2 |
| | `bulkUploadExams(file, organizationId)` | `ExamRepository.create()` (bulk) | P2 |

---

### B.17 UserActivityController → UserActivityService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| (Methods to be analyzed) | `getUserActivity(userId, organizationId, filters)` | `UserActivityRepository.findAll()` | P2 |
| | `logUserActivity(activityData, organizationId)` | `UserActivityRepository.create()` | P2 |

---

### B.18 UserPermissionController → UserPermissionService (New Service)

| Controller Method | Service Method | Repository Methods | Priority |
|------------------|----------------|-------------------|----------|
| (Methods to be analyzed) | `getUserPermissions(userId, organizationId)` | `UserPermissionRepository.findAll()` | P2 |
| | `updateUserPermissions(userId, permissions, organizationId)` | `UserPermissionRepository.findById()`, `UserPermissionRepository.updateOne()` | P2 |

---

## PART C: REPOSITORY METHOD SPECIFICATIONS

### C.1 UserRepository

```javascript
class UserRepository {
  // Create
  async create(userData) {
    // Create user document
    // Return created user
  }
  
  // Read
  async findById(id, options = {}) {
    // Find user by ID
    // Apply populate options if provided
    // Return user or null
  }
  
  async findOne(filter, options = {}) {
    // Find single user matching filter
    // Apply populate options if provided
    // Return user or null
  }
  
  async findAll(filter = {}, options = {}) {
    // Find all users matching filter
    // Apply pagination, sorting, population
    // Return array of users
  }
  
  // Update
  async updateOne(id, updateData) {
    // Update user by ID
    // Return updated user
  }
  
  // Delete
  async deleteOne(id) {
    // Delete user by ID
    // Return deletion result
  }
  
  // Query
  async count(filter = {}) {
    // Count users matching filter
    // Return count
  }
  
  async exists(filter) {
    // Check if user exists
    // Return boolean
  }
  
  async aggregate(pipeline) {
    // Run aggregation pipeline
    // Return aggregation results
  }
}
```

### C.2 ExamRepository

```javascript
class ExamRepository {
  async create(examData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async exists(filter) { }
  async aggregate(pipeline) { }
}
```

### C.3 QuestionRepository

```javascript
class QuestionRepository {
  async create(questionData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async exists(filter) { }
  async aggregate(pipeline) { }
}
```

### C.4 OrganizationRepository

```javascript
class OrganizationRepository {
  async create(orgData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async exists(filter) { }
}
```

### C.5 TeacherRepository

```javascript
class TeacherRepository {
  async create(teacherData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async exists(filter) { }
  async aggregate(pipeline) { }
}
```

### C.6 StudentRepository

```javascript
class StudentRepository {
  async create(studentData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async exists(filter) { }
  async aggregate(pipeline) { }
}
```

### C.7 ExamSessionRepository

```javascript
class ExamSessionRepository {
  async create(sessionData) { }
  async findById(id, options = {}) { }
  async findOne(filter, options = {}) { }
  async findAll(filter = {}, options = {}) { }
  async updateOne(id, updateData) { }
  async deleteOne(id) { }
  async count(filter = {}) { }
  async aggregate(pipeline) { }
}
```

### C.8 Additional Repositories Needed

- **QuestionBankRepository** - For question bank operations
- **DepartmentRepository** - For department operations
- **SubjectRepository** - For subject operations
- **TeacherClassRepository** - For teacher class operations
- **InvitationRepository** - For invitation operations
- **OTPRepository** - For OTP operations
- **UserActivityRepository** - For user activity logging
- **UserPermissionRepository** - For user permission management

---

## PART D: MIGRATION PRIORITY ORDER

### Priority 1 (Critical - Migrate First)

1. **AuthController** → AuthService
   - `login()`, `getProfile()`, `updateProfile()`, `changePassword()`, `completeFirstTimeLogin()`
   - **Reason:** Core authentication functionality

2. **UserManagementController** → UserService
   - `getAllUserManagements()`, `getUserManagementById()`, `createUserManagement()`, `updateUserManagement()`, `deleteUserManagement()`, `toggleUserStatus()`
   - **Reason:** Core user management functionality

3. **ExamController** → ExamService
   - `createExam()`, `getExams()`, `getExamById()`, `updateExam()`, `deleteExam()`, `scheduleExam()`, `assignTeachersToExam()`, `assignQuestionBankToExam()`
   - **Reason:** Core exam functionality

4. **QuestionController** → QuestionService
   - `createQuestion()`, `getQuestions()`, `getQuestionById()`, `updateQuestion()`, `deleteQuestion()`
   - **Reason:** Core question functionality

5. **OrganizationController** → OrganizationService
   - `registerStep1()`, `registerStep2()`, `completeRegistration()`, `getOrganizationByCode()`, `updateOrganization()`, `deleteOrganization()`
   - **Reason:** Core organization functionality

6. **TeacherController** → TeacherService
   - `registerTeacher()`, `getTeacherById()`, `getAllTeachers()`, `updateTeacher()`, `deleteTeacher()`, `assignToDepartment()`, `removeFromDepartment()`
   - **Reason:** Core teacher functionality

7. **StudentController** → StudentService
   - `getStudents()`, `getStudentById()`, `createStudent()`, `updateStudent()`, `deleteStudent()`, `assignToDepartment()`, `removeFromDepartment()`
   - **Reason:** Core student functionality

8. **QuestionBankController** → QuestionBankService
   - `createQuestionBank()`, `getQuestionBanks()`, `getQuestionBankById()`, `updateQuestionBank()`, `deleteQuestionBank()`, `addQuestionsToBank()`, `removeQuestionFromBank()`
   - **Reason:** Core question bank functionality

9. **DepartmentController** → DepartmentService
   - `createDepartment()`, `getDepartments()`, `getDepartmentById()`, `updateDepartment()`, `deleteDepartment()`
   - **Reason:** Core department functionality

10. **SubjectController** → SubjectService
    - `createSubject()`, `getSubjects()`, `getSubjectById()`, `updateSubject()`, `deleteSubject()`
    - **Reason:** Core subject functionality

11. **TeacherClassController** → TeacherClassService
    - `createTeacherClass()`, `getTeacherClasses()`, `getTeacherClass()`, `updateTeacherClass()`, `deleteTeacherClass()`, `addStudentsToClass()`, `removeStudentFromClass()`
    - **Reason:** Core teacher class functionality

### Priority 2 (High - Migrate Second)

12. **ExamSessionController** → ExamSessionService
    - All exam session operations
    - **Reason:** Important for exam functionality

13. **OTPController** → OTPService
    - All OTP operations
    - **Reason:** Used by multiple registration flows

14. **HealthController** → HealthService
    - Health check operations
    - **Reason:** System monitoring

15. **TimeController** → TimeService
    - Time synchronization operations
    - **Reason:** Exam timing functionality

### Priority 3 (Medium - Migrate Third)

16. **BulkUploadController** → BulkUploadService
    - Bulk upload operations
    - **Reason:** Administrative functionality

17. **UserActivityController** → UserActivityService
    - User activity logging
    - **Reason:** Analytics and monitoring

18. **UserPermissionController** → UserPermissionService
    - User permission management
    - **Reason:** Advanced permission features

---

## PART E: VALIDATION FLOW RULES

### E.1 Input Validation

1. **Controller Layer:**
   - Basic type checking
   - Required field validation
   - Format validation (email, phone, etc.)

2. **Service Layer:**
   - Business rule validation
   - Cross-entity validation
   - Data consistency checks

3. **Repository Layer:**
   - Data type validation (handled by Mongoose)
   - Database constraint validation

### E.2 Error Handling Flow

```javascript
// Controller
try {
  const result = await service.method(params);
  return sendSuccess(res, result);
} catch (error) {
  // Error automatically handled by errorHandler middleware
  throw error;
}

// Service
async method(params) {
  // Validate business rules
  if (!valid) {
    throw AppError.badRequest('Validation failed');
  }
  
  // Check entity existence
  const entity = await repository.findById(id);
  if (!entity) {
    throw AppError.notFound('Entity not found');
  }
  
  // Perform operation
  return await repository.updateOne(id, data);
}
```

---

## PART F: RESPONSE FLOW RULES

### F.1 Success Responses

```javascript
// Single entity
sendSuccess(res, { user: userData }, 'User retrieved successfully', 200);

// List with pagination
sendPaginated(res, users, totalUsers, page, limit, 'Users retrieved successfully');

// Created entity
sendSuccess(res, { exam: examData }, 'Exam created successfully', 201);

// Updated entity
sendSuccess(res, { user: userData }, 'User updated successfully', 200);

// Deleted entity
sendSuccess(res, null, 'User deleted successfully', 200);
```

### F.2 Error Responses

```javascript
// In Service - throw AppError
throw AppError.notFound('User not found');
throw AppError.badRequest('Invalid input data');
throw AppError.unauthorized('Authentication required');
throw AppError.forbidden('Insufficient permissions');
throw AppError.conflict('Resource already exists');
throw AppError.validationError('Validation failed', { errors: [...] });

// Error automatically handled by errorHandler middleware
// Returns standardized error response
```

---

## PART G: MIGRATION CHECKLIST

### G.1 Pre-Migration

- [ ] All services created (skeleton classes)
- [ ] All repositories created (skeleton classes)
- [ ] Error handler middleware installed
- [ ] API response utilities ready
- [ ] Async wrapper middleware ready

### G.2 Migration Steps (Per Controller)

- [ ] Create service methods
- [ ] Create repository methods
- [ ] Update controller to use service
- [ ] Replace direct model access with repository
- [ ] Replace manual error handling with AppError
- [ ] Replace manual responses with sendSuccess/sendPaginated
- [ ] Add asyncWrapper to route handlers
- [ ] Test all endpoints
- [ ] Update documentation

### G.3 Post-Migration

- [ ] All controllers migrated
- [ ] All services implemented
- [ ] All repositories implemented
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code review completed

---

## PART H: SUMMARY

### H.1 Statistics

- **Total Controllers:** 17
- **Total Controller Methods:** 150+
- **Total Services:** 17 (7 existing + 10 new)
- **Total Repositories:** 15 (7 existing + 8 new)
- **Migration Priority 1:** 11 controllers
- **Migration Priority 2:** 5 controllers
- **Migration Priority 3:** 3 controllers

### H.2 Key Benefits

1. **Separation of Concerns:** Clear boundaries between layers
2. **Testability:** Services and repositories can be unit tested
3. **Maintainability:** Business logic centralized in services
4. **Reusability:** Services can be reused across controllers
5. **Consistency:** Standardized error handling and responses
6. **Scalability:** Easy to add new features

### H.3 Next Steps

1. **Phase 2 - Task 2.5:** Implement Priority 1 repositories
2. **Phase 2 - Task 2.6:** Implement Priority 1 services
3. **Phase 2 - Task 2.7:** Migrate Priority 1 controllers
4. **Phase 2 - Task 2.8:** Implement Priority 2 repositories and services
5. **Phase 2 - Task 2.9:** Migrate Priority 2 controllers
6. **Phase 2 - Task 2.10:** Implement Priority 3 repositories and services
7. **Phase 2 - Task 2.11:** Migrate Priority 3 controllers

---

## END OF BLUEPRINT

**Status:** ✅ BLUEPRINT COMPLETE  
**Next Steps:** Proceed with Phase 2 - Task 2.5 (Repository Implementation)  
**Recommendation:** Start with Priority 1 repositories (UserRepository, ExamRepository, QuestionRepository)

---

*Blueprint generated as part of Evalon Refactor Plan - Phase 2, Task 2.4*


