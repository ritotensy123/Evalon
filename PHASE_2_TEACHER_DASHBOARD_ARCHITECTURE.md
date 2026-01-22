# Phase 2: Teacher-Owned Dashboard Data Architecture
## Evalon Exam Management System

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** Design Document  
**Scope:** Standalone Teacher Dashboard Data Ownership

---

## 1. Executive Summary

### 1.1 Purpose
Design the architecture for Phase 2 implementation that enables standalone teachers to see their own dashboard data (counts and lists) without any organization dependency.

### 1.2 Principles
- **Data Ownership:** Standalone teachers own 100% of their data
- **No Organization Dependency:** Zero reliance on organization context
- **Simple Data Model:** Counts and lists only, no analytics
- **Explicit Scoping:** All queries explicitly filter by `teacherId` and `organizationId: null`

### 1.3 Out of Scope
- Analytics, charts, trends, or performance metrics
- Organization-level aggregations
- Cross-teacher data access
- Historical trend analysis
- Predictive analytics

---

## 2. Data Ownership Model

### 2.1 Standalone Teacher Data Ownership

| Entity | Ownership Rule | Filter Criteria |
|--------|---------------|-----------------|
| **Exams** | Owns exams they created or are assigned to | `{ $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }], organizationId: null }` |
| **Question Banks** | Owns question banks they created | `{ createdBy: teacherId, organizationId: null }` |
| **Questions** | Owns questions they created | `{ createdBy: teacherId, organizationId: null }` |
| **Classes** | Owns classes they created | `{ teacherId: teacherId, organizationId: null }` |
| **Students** | Owns students enrolled in their classes | `{ classId: { $in: teacherClassIds }, organizationId: null }` |
| **Assignments** | Owns assignments they created | `{ createdBy: teacherId, organizationId: null }` |
| **Grades** | Owns grades they assigned | `{ gradedBy: teacherId, organizationId: null }` |

### 2.2 Data Isolation Rules

**Rule 1: Explicit Null OrganizationId**
- All queries MUST explicitly set `organizationId: null`
- Never use `{ organizationId: { $exists: false } }`
- Never omit `organizationId` from query

**Rule 2: Teacher ID Scoping**
- All queries MUST filter by `teacherId` (via `createdBy`, `assignedTeachers`, `teacherId`, etc.)
- Never return data from other teachers

**Rule 3: No Cross-Teacher Access**
- Standalone teachers CANNOT see:
  - Other teachers' exams
  - Other teachers' question banks
  - Other teachers' questions
  - Other teachers' classes
  - Organization-scoped data

---

## 3. API Endpoints Design

### 3.1 Endpoint Overview

All endpoints follow the pattern: `GET /api/teachers/:teacherId/{resource}`

**Base Path:** `/api/teachers/:teacherId`

**Authentication:** Required (JWT token in Authorization header)

**Authorization:** Teacher can only access their own data (`teacherId` must match `req.user.id` or `req.user.dashboardData.teacherId`)

---

### 3.2 Endpoint Specifications

#### 3.2.1 Dashboard Statistics Summary

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/stats`

**Purpose:** Get basic counts for dashboard summary cards

**Request:**
```
GET /api/teachers/:teacherId/dashboard/stats
Headers:
  Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClasses": 0,
    "totalStudents": 0,
    "totalAssignments": 0,
    "totalExams": 0,
    "upcomingExams": 0,
    "totalQuestionBanks": 0,
    "totalQuestions": 0
  },
  "message": "Dashboard statistics retrieved successfully"
}
```

**Query Pattern:**
```javascript
// Classes count
TeacherClass.countDocuments({ teacherId, organizationId: null })

// Students count (via classes)
const classIds = await TeacherClass.find({ teacherId, organizationId: null }).distinct('_id')
Student.countDocuments({ classId: { $in: classIds }, organizationId: null })

// Assignments count
Assignment.countDocuments({ createdBy: teacherId, organizationId: null })

// Exams count
Exam.countDocuments({ 
  $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }],
  organizationId: null 
})

// Upcoming exams count
Exam.countDocuments({ 
  $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }],
  organizationId: null,
  status: 'scheduled',
  scheduledDate: { $gte: new Date() }
})

// Question banks count
QuestionBank.countDocuments({ createdBy: teacherId, organizationId: null })

// Questions count
Question.countDocuments({ createdBy: teacherId, organizationId: null })
```

---

#### 3.2.2 Recent Exams List

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/exams/recent`

**Purpose:** Get list of recent exams (created or assigned)

**Request:**
```
GET /api/teachers/:teacherId/dashboard/exams/recent?limit=5
Headers:
  Authorization: Bearer <token>
Query Parameters:
  limit: number (default: 5, max: 20)
  status: string (optional: 'scheduled', 'active', 'completed', 'draft')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "exam_id",
        "title": "Midterm Exam",
        "subject": "Mathematics",
        "class": "Grade 10A",
        "scheduledDate": "2025-02-15T10:00:00Z",
        "startTime": "10:00 AM",
        "status": "scheduled",
        "totalQuestions": 50,
        "totalMarks": 100
      }
    ],
    "total": 5
  },
  "message": "Recent exams retrieved successfully"
}
```

**Query Pattern:**
```javascript
Exam.find({
  $or: [
    { createdBy: teacherId },
    { assignedTeachers: teacherId }
  ],
  organizationId: null
})
  .sort({ scheduledDate: -1 })
  .limit(limit)
  .select('title subject class scheduledDate startTime status totalQuestions totalMarks')
```

---

#### 3.2.3 Recent Question Banks List

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/question-banks/recent`

**Purpose:** Get list of recent question banks

**Request:**
```
GET /api/teachers/:teacherId/dashboard/question-banks/recent?limit=5
Headers:
  Authorization: Bearer <token>
Query Parameters:
  limit: number (default: 5, max: 20)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questionBanks": [
      {
        "_id": "qb_id",
        "name": "Algebra Basics",
        "subject": "Mathematics",
        "class": "Grade 10",
        "totalQuestions": 25,
        "status": "active",
        "createdAt": "2025-01-10T08:00:00Z"
      }
    ],
    "total": 5
  },
  "message": "Recent question banks retrieved successfully"
}
```

**Query Pattern:**
```javascript
QuestionBank.find({
  createdBy: teacherId,
  organizationId: null
})
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('name subject class totalQuestions status createdAt')
```

---

#### 3.2.4 Recent Classes List

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/classes/recent`

**Purpose:** Get list of recent classes

**Request:**
```
GET /api/teachers/:teacherId/dashboard/classes/recent?limit=5
Headers:
  Authorization: Bearer <token>
Query Parameters:
  limit: number (default: 5, max: 20)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classes": [
      {
        "_id": "class_id",
        "className": "Mathematics 10A",
        "classCode": "MATH-10A",
        "subject": "Mathematics",
        "totalStudents": 25,
        "createdAt": "2025-01-05T09:00:00Z"
      }
    ],
    "total": 5
  },
  "message": "Recent classes retrieved successfully"
}
```

**Query Pattern:**
```javascript
TeacherClass.find({
  teacherId: teacherId,
  organizationId: null
})
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('className classCode subject totalStudents createdAt')
  .populate('subjectId', 'name')
```

---

#### 3.2.5 Recent Assignments List

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/assignments/recent`

**Purpose:** Get list of recent assignments

**Request:**
```
GET /api/teachers/:teacherId/dashboard/assignments/recent?limit=5
Headers:
  Authorization: Bearer <token>
Query Parameters:
  limit: number (default: 5, max: 20)
  status: string (optional: 'draft', 'published', 'graded')
```

**Response:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "_id": "assignment_id",
        "title": "Homework Chapter 5",
        "subject": "Physics",
        "class": "Grade 11B",
        "dueDate": "2025-01-20T23:59:59Z",
        "status": "published",
        "totalSubmissions": 18,
        "totalStudents": 25,
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 5
  },
  "message": "Recent assignments retrieved successfully"
}
```

**Query Pattern:**
```javascript
Assignment.find({
  createdBy: teacherId,
  organizationId: null
})
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('title subject class dueDate status totalSubmissions totalStudents createdAt')
```

---

#### 3.2.6 Navigation Counts

**Endpoint:** `GET /api/teachers/:teacherId/dashboard/navigation-counts`

**Purpose:** Get counts for navigation menu badges

**Request:**
```
GET /api/teachers/:teacherId/dashboard/navigation-counts
Headers:
  Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "classes": 0,
    "students": 0,
    "assignments": 0,
    "schedule": 0,
    "exams": 0,
    "questionBank": 0,
    "grades": 0,
    "quizzes": 0,
    "reports": 0
  },
  "message": "Navigation counts retrieved successfully"
}
```

**Query Pattern:**
```javascript
// Aggregated query for performance
const counts = await Promise.all([
  TeacherClass.countDocuments({ teacherId, organizationId: null }),
  Exam.countDocuments({ 
    $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }],
    organizationId: null 
  }),
  QuestionBank.countDocuments({ createdBy: teacherId, organizationId: null }),
  Assignment.countDocuments({ createdBy: teacherId, organizationId: null }),
  // ... other counts
])
```

---

## 4. Query Patterns

### 4.1 Standard Query Builder Pattern

**Pattern Name:** Teacher-Owned Data Query

**Structure:**
```javascript
{
  // Always include teacher ownership
  $or: [
    { createdBy: teacherId },
    { assignedTeachers: teacherId },
    { teacherId: teacherId }
  ],
  // Always explicitly null for standalone
  organizationId: null,
  // Optional filters
  status: 'scheduled',
  // ... other filters
}
```

### 4.2 Query Patterns by Entity

#### 4.2.1 Exams Query
```javascript
{
  $or: [
    { createdBy: teacherId },
    { assignedTeachers: teacherId }
  ],
  organizationId: null
}
```

#### 4.2.2 Question Banks Query
```javascript
{
  createdBy: teacherId,
  organizationId: null
}
```

#### 4.2.3 Questions Query
```javascript
{
  createdBy: teacherId,
  organizationId: null
}
```

#### 4.2.4 Classes Query
```javascript
{
  teacherId: teacherId,
  organizationId: null
}
```

#### 4.2.5 Students Query (via Classes)
```javascript
// Step 1: Get teacher's class IDs
const classIds = await TeacherClass.find({ 
  teacherId: teacherId, 
  organizationId: null 
}).distinct('_id')

// Step 2: Get students in those classes
{
  classId: { $in: classIds },
  organizationId: null
}
```

#### 4.2.6 Assignments Query
```javascript
{
  createdBy: teacherId,
  organizationId: null
}
```

---

## 5. Data Ownership Rules

### 5.1 Creation Rules

**Rule:** When a standalone teacher creates an entity, it MUST have:
- `createdBy: teacherId` (or `teacherId: teacherId` for classes)
- `organizationId: null` (explicitly null, not undefined)

**Enforcement:**
- Backend validation MUST reject creation if `organizationId` is provided
- Backend MUST set `organizationId: null` if not provided

### 5.2 Read Rules

**Rule:** Standalone teachers can ONLY read:
- Entities they created (`createdBy: teacherId`)
- Entities they're assigned to (`assignedTeachers: teacherId` or `teacherId: teacherId`)
- Entities with `organizationId: null`

**Enforcement:**
- All read queries MUST include teacher ownership filter
- All read queries MUST include `organizationId: null`

### 5.3 Update Rules

**Rule:** Standalone teachers can ONLY update:
- Entities they created
- Entities they're assigned to (if allowed by entity type)

**Enforcement:**
- Pre-update validation MUST check ownership
- `organizationId` MUST remain `null` after update

### 5.4 Delete Rules

**Rule:** Standalone teachers can ONLY delete:
- Entities they created
- Entities they're assigned to (if allowed by entity type)

**Enforcement:**
- Pre-delete validation MUST check ownership
- Soft delete preferred (set `status: 'deleted'`)

---

## 6. Frontend Data Contracts

### 6.1 TypeScript Interfaces (Reference)

```typescript
// Dashboard Statistics
interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  totalExams: number;
  upcomingExams: number;
  totalQuestionBanks: number;
  totalQuestions: number;
}

// Navigation Counts
interface NavigationCounts {
  classes: number;
  students: number;
  assignments: number;
  schedule: number;
  exams: number;
  questionBank: number;
  grades: number;
  quizzes: number;
  reports: number;
}

// Recent Exam
interface RecentExam {
  _id: string;
  title: string;
  subject: string;
  class: string;
  scheduledDate: string;
  startTime: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  totalQuestions: number;
  totalMarks: number;
}

// Recent Question Bank
interface RecentQuestionBank {
  _id: string;
  name: string;
  subject: string;
  class: string;
  totalQuestions: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

// Recent Class
interface RecentClass {
  _id: string;
  className: string;
  classCode: string;
  subject: string;
  totalStudents: number;
  createdAt: string;
}

// Recent Assignment
interface RecentAssignment {
  _id: string;
  title: string;
  subject: string;
  class: string;
  dueDate: string;
  status: 'draft' | 'published' | 'graded';
  totalSubmissions: number;
  totalStudents: number;
  createdAt: string;
}
```

### 6.2 API Response Contracts

#### 6.2.1 Standard Success Response
```typescript
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}
```

#### 6.2.2 Standard Error Response
```typescript
interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  requestId?: string;
}
```

### 6.3 Frontend Data Flow

**Pattern:** Fetch → Transform → Display

1. **Fetch:** Call API endpoint with teacherId
2. **Transform:** Map API response to UI format (if needed)
3. **Display:** Render counts/lists in dashboard components

**Example Flow:**
```
Component Mount
  ↓
Fetch Dashboard Stats (GET /api/teachers/:teacherId/dashboard/stats)
  ↓
Update State: { totalClasses: 0, totalStudents: 0, ... }
  ↓
Render Summary Cards with counts
```

---

## 7. Security & Authorization

### 7.1 Authentication Requirements

**All endpoints require:**
- Valid JWT token in `Authorization: Bearer <token>` header
- Token must not be expired
- Token must not be revoked

### 7.2 Authorization Rules

**Rule 1: Teacher ID Validation**
- `teacherId` in URL MUST match authenticated teacher
- Validate: `teacherId === req.user.id` OR `teacherId === req.user.dashboardData.teacherId`

**Rule 2: Standalone Teacher Check**
- Verify teacher has `organizationId: null`
- Reject if teacher belongs to organization (different endpoint)

**Rule 3: Data Scoping**
- All queries MUST include teacher ownership filter
- All queries MUST include `organizationId: null`

### 7.3 Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required",
  "requestId": "req_123"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. You can only access your own data.",
  "requestId": "req_123"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found or you don't have access",
  "requestId": "req_123"
}
```

---

## 8. Performance Considerations

### 8.1 Caching Strategy

**Recommendation:** Cache dashboard stats for 5 minutes

**Cache Key Pattern:**
```
teacher_dashboard_stats:{teacherId}
teacher_navigation_counts:{teacherId}
```

**Invalidation:**
- Invalidate on entity creation/update/deletion
- TTL: 5 minutes

### 8.2 Query Optimization

**Recommendation:** Use aggregation pipelines for counts

**Example:**
```javascript
// Instead of multiple count queries
const stats = await Promise.all([
  TeacherClass.countDocuments({ teacherId, organizationId: null }),
  Exam.countDocuments({ ... }),
  // ...
])

// Use single aggregation
const stats = await Teacher.aggregate([
  { $match: { _id: teacherId, organization: null } },
  {
    $lookup: {
      from: 'teacherclasses',
      localField: '_id',
      foreignField: 'teacherId',
      as: 'classes'
    }
  },
  {
    $project: {
      totalClasses: { $size: '$classes' }
      // ... other counts
    }
  }
])
```

### 8.3 Pagination

**Recommendation:** All list endpoints support pagination

**Default Limits:**
- Recent items: 5-20 items
- Full lists: 10-50 items per page

---

## 9. Database Indexes

### 9.1 Required Indexes

**Exams:**
```javascript
Exam.index({ createdBy: 1, organizationId: 1 })
Exam.index({ assignedTeachers: 1, organizationId: 1 })
Exam.index({ organizationId: 1, status: 1, scheduledDate: 1 })
```

**Question Banks:**
```javascript
QuestionBank.index({ createdBy: 1, organizationId: 1 })
QuestionBank.index({ organizationId: 1, createdAt: -1 })
```

**Questions:**
```javascript
Question.index({ createdBy: 1, organizationId: 1 })
Question.index({ organizationId: 1, createdAt: -1 })
```

**Classes:**
```javascript
TeacherClass.index({ teacherId: 1, organizationId: 1 })
TeacherClass.index({ organizationId: 1, createdAt: -1 })
```

**Assignments:**
```javascript
Assignment.index({ createdBy: 1, organizationId: 1 })
Assignment.index({ organizationId: 1, createdAt: -1 })
```

---

## 10. Implementation Checklist

### 10.1 Backend Tasks

- [ ] Create `TeacherDashboardController` with all endpoints
- [ ] Create `TeacherDashboardService` for business logic
- [ ] Implement query builder for teacher-owned data
- [ ] Add authorization middleware for teacher ID validation
- [ ] Add database indexes
- [ ] Write unit tests for each endpoint
- [ ] Write integration tests for data isolation

### 10.2 Frontend Tasks

- [ ] Create `teacherDashboardAPI` service
- [ ] Create TypeScript interfaces/types
- [ ] Update `TeacherDashboard` component to fetch real data
- [ ] Replace hardcoded counts with API calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add empty state handling

### 10.3 Testing Tasks

- [ ] Test standalone teacher can only see their data
- [ ] Test organization teacher cannot access standalone endpoints
- [ ] Test data isolation between teachers
- [ ] Test performance with large datasets
- [ ] Test error handling and edge cases

---

## 11. Migration Considerations

### 11.1 Existing Data

**Issue:** Existing standalone teacher data may have `organizationId: undefined` instead of `null`

**Solution:** Run migration script before Phase 2:
```javascript
// Set organizationId: null for all standalone teacher entities
await Exam.updateMany(
  { createdBy: { $in: standaloneTeacherIds }, organizationId: { $exists: false } },
  { $set: { organizationId: null } }
)
// Repeat for QuestionBank, Question, TeacherClass, Assignment
```

### 11.2 Backward Compatibility

**Requirement:** Phase 2 endpoints should not break existing functionality

**Strategy:**
- New endpoints are additive (don't modify existing endpoints)
- Existing endpoints continue to work
- Frontend gradually migrates to new endpoints

---

## 12. API Endpoint Summary

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/teachers/:teacherId/dashboard/stats` | GET | Dashboard statistics | Counts object |
| `/api/teachers/:teacherId/dashboard/exams/recent` | GET | Recent exams | Exam list |
| `/api/teachers/:teacherId/dashboard/question-banks/recent` | GET | Recent question banks | Question bank list |
| `/api/teachers/:teacherId/dashboard/classes/recent` | GET | Recent classes | Class list |
| `/api/teachers/:teacherId/dashboard/assignments/recent` | GET | Recent assignments | Assignment list |
| `/api/teachers/:teacherId/dashboard/navigation-counts` | GET | Navigation counts | Counts object |

---

## 13. Success Criteria

✅ Standalone teachers see only their own data  
✅ All queries explicitly filter by `teacherId` and `organizationId: null`  
✅ No hardcoded data in frontend  
✅ All dashboard counts come from APIs  
✅ Proper data isolation between teachers  
✅ Empty states handled gracefully  
✅ Performance is acceptable (< 500ms response time)  
✅ All endpoints properly authenticated and authorized  

---

## 14. Future Considerations

### 14.1 Potential Enhancements (Out of Scope for Phase 2)

- Caching layer for dashboard stats
- Real-time updates via WebSocket
- Batch endpoints for multiple counts
- Filtering and sorting options
- Search functionality

### 14.2 Scalability Considerations

- Consider read replicas for dashboard queries
- Implement rate limiting per teacher
- Monitor query performance
- Consider materialized views for counts

---

## Appendix A: Query Examples

### A.1 Dashboard Stats Query
```javascript
const stats = {
  totalClasses: await TeacherClass.countDocuments({ 
    teacherId: teacherId, 
    organizationId: null 
  }),
  totalExams: await Exam.countDocuments({ 
    $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }],
    organizationId: null 
  }),
  // ... other counts
}
```

### A.2 Recent Exams Query
```javascript
const exams = await Exam.find({
  $or: [
    { createdBy: teacherId },
    { assignedTeachers: teacherId }
  ],
  organizationId: null
})
  .sort({ scheduledDate: -1 })
  .limit(5)
  .select('title subject class scheduledDate startTime status totalQuestions totalMarks')
  .lean()
```

---

## Appendix B: Error Scenarios

### B.1 Teacher Not Found
```json
{
  "success": false,
  "message": "Teacher not found",
  "requestId": "req_123"
}
```

### B.2 Unauthorized Access
```json
{
  "success": false,
  "message": "Access denied. You can only access your own data.",
  "requestId": "req_123"
}
```

### B.3 Invalid Teacher ID
```json
{
  "success": false,
  "message": "Invalid teacher ID format",
  "requestId": "req_123"
}
```

---

**End of Architecture Document**



