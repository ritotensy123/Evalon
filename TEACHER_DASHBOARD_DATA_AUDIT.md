# Teacher Dashboard Data Audit Report
## Evalon Exam Management System

**Date:** 2025-01-XX  
**Auditor:** Senior Full-Stack Architect  
**Scope:** Standalone Teacher Dashboard Data Sources and Data Ownership

---

## Executive Summary

This audit identifies why standalone teachers (not affiliated with any organization) see predefined/hardcoded data on the Teacher Dashboard. The investigation reveals a combination of:

1. **Hardcoded frontend data** displayed regardless of actual backend data
2. **Incorrect data scoping** in backend endpoints that assume `organizationId` exists
3. **Missing API integrations** for dashboard metrics
4. **Architectural assumptions** that all teachers belong to organizations

---

## 1. Data Sources Used by Teacher Dashboard

### 1.1 Frontend Component
**File:** `frontend/src/pages/dashboard/TeacherDashboard.js`

#### Hardcoded Data (Lines 101-162)

| Data Type | Location | Values | Issue |
|-----------|----------|--------|-------|
| **Student Performance Chart** | Lines 102-115 | 12 months of fake data (78-97%) | Never fetched from API |
| **Subject Performance** | Lines 117-122 | Mathematics (92%), Physics (87%), Chemistry (78%), Biology (65%) | Hardcoded, not teacher-specific |
| **Recent Assignments** | Lines 124-129 | 4 fake assignments with scores, dates, subjects | No API call to fetch actual assignments |
| **Top Students** | Lines 131-136 | 4 fake students (Alex Johnson, Emma Davis, etc.) | No API call to fetch actual students |
| **Navigation Counts** | Lines 148-162 | Classes: '6', Students: '85', Assignments: '12', Schedule: '24', Question Bank: '10', Grades: '45', Quizzes: '15', Reports: '3' | All hardcoded, never updated |
| **Summary Cards** | Lines 372-375 | Today's Classes: '6', My Students: '85', Assignments: '12', Avg. Grade: '87%' | Hardcoded values, not calculated |

#### API Calls (Actual Backend Integration)

| Endpoint | Location | Purpose | Status |
|----------|----------|---------|--------|
| `examAPI.getExamsByTeacher({ status: 'scheduled' })` | Line 76 | Fetch assigned exams | ✅ Implemented but has scoping issues |

**Total API Calls:** 1 out of ~10+ data points needed

---

## 2. Login Flow Analysis

### 2.1 User Object Fields Returned

**File:** `backend/src/services/AuthService.js` (Lines 133-149)

For a standalone teacher, the login response includes:

```javascript
{
  user: {
    id: user._id,
    email: user.email,
    userType: 'teacher',
    profile: user.profile,  // { firstName, lastName }
    isEmailVerified: user.isEmailVerified,
    lastLogin: user.lastLogin,
    firstLogin: user.firstLogin,
    organizationId: null  // ⚠️ NULL for standalone teachers
  },
  dashboard: {
    teacherId: user.userId._id,
    organizationId: null,  // ⚠️ NULL for standalone teachers
    organizationName: null,  // ⚠️ NULL
    subjects: user.userId.subjects || [],  // Empty array for standalone
    role: 'Teacher'
  },
  organization: {}  // ⚠️ Empty object for standalone teachers
}
```

### 2.2 OrganizationId Handling

**Critical Finding:** `organizationId` is **optional** in the data model but **assumed** in many endpoints.

**Evidence:**
- `Teacher` model (`backend/src/models/Teacher.js:149`): `organization: { required: false }`
- `User` model (`backend/src/models/User.js`): `organizationId` not in schema (resolved dynamically)
- `AuthService` (`backend/src/services/AuthService.js:88-130`): Only sets `organizationData` if `user.userId.organizationId` exists

**Problem:** Many endpoints use `req.user.organizationId` without null checks, causing:
- Empty result sets when filtering by `organizationId: null`
- Incorrect data scoping
- Standalone teachers seeing organization-level data

---

## 3. Backend Endpoints Consumed by Teacher Dashboard

### 3.1 Exam Endpoint: `/api/exams/teacher`

**File:** `backend/src/controllers/examController.js` (Lines 376-423)

**Current Implementation:**
```javascript
const getExamsByTeacher = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.userType;
  const organizationId = req.user.organizationId;  // ⚠️ NULL for standalone teachers
  
  let filter = {};
  
  if (userType === 'teacher') {
    filter = {
      organizationId,  // ⚠️ This becomes null for standalone teachers
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ]
    };
  }
  
  // ... rest of implementation
});
```

**Issues:**
1. **Data Scoping:** Filter includes `organizationId: null`, which may return:
   - Exams with `organizationId: null` (intended for standalone teachers)
   - BUT ALSO: Exams with `organizationId: undefined` (if schema allows)
   - Risk: Could return exams from other standalone teachers if not properly scoped

2. **Teacher ID Scoping:** ✅ Correctly filters by `createdBy` or `assignedTeachers`

3. **Organization Assumption:** The filter structure assumes `organizationId` exists, even if null

**Recommendation:** For standalone teachers, filter should be:
```javascript
if (organizationId) {
  filter.organizationId = organizationId;
} else {
  // Standalone teacher: only show exams they created or are assigned to
  filter.$or = [
    { createdBy: userId },
    { assignedTeachers: userId }
  ];
  // Explicitly exclude organization exams
  filter.organizationId = { $exists: false };
}
```

---

## 4. Data Scoping Analysis

### 4.1 Endpoints and Their Scoping

| Endpoint | File | Scoped by teacherId? | Uses organizationId? | Issue |
|----------|------|---------------------|---------------------|------|
| `GET /api/exams/teacher` | `examController.js:376` | ✅ Yes (`createdBy`, `assignedTeachers`) | ⚠️ Yes (assumes exists) | Filters by `organizationId: null` which may be incorrect |
| `GET /api/teacher-classes` | `teacherClassController.js:164` | ✅ Yes (filters by `teacherId`) | ⚠️ Yes (required) | **FAILS for standalone teachers** - requires organization |
| `GET /api/question-banks` | `questionBankController.js` | ❌ No | ⚠️ Yes (implicit) | Likely filters by organization, excluding standalone teachers |
| `GET /api/questions` | `questionController.js` | ❌ No | ⚠️ Yes (implicit) | Likely filters by organization |

### 4.2 Implicit OrganizationId Usage

**File:** `backend/src/utils/authUtils.js` (Lines 131-156)

The `resolveUserOrganization` function:
- Returns `null` for standalone teachers (correct)
- But many endpoints use `req.user.organizationId` without null checks

**Example Problem:**
```javascript
// In teacherClassController.js:208
const organizationId = teacher.organization;
if (!organizationId) {
  return sendError(res, new Error('Teacher is not assigned to any organization'), ...);
  // ⚠️ This FAILS for standalone teachers
}
```

---

## 5. Mock/Demo Data Locations

### 5.1 Frontend Hardcoded Data

| Component | File | Data Type | Lines |
|-----------|------|-----------|-------|
| TeacherDashboard | `TeacherDashboard.js` | Student Performance | 102-115 |
| TeacherDashboard | `TeacherDashboard.js` | Subject Performance | 117-122 |
| TeacherDashboard | `TeacherDashboard.js` | Recent Assignments | 124-129 |
| TeacherDashboard | `TeacherDashboard.js` | Top Students | 131-136 |
| TeacherDashboard | `TeacherDashboard.js` | Navigation Counts | 148-162 |
| TeacherDashboard | `TeacherDashboard.js` | Summary Cards | 372-375 |

### 5.2 Backend Seeded Data

**File:** `backend/tests/fixtures/test-data.json`
- Contains test users, organizations, departments, subjects
- **Not used in production** (test fixtures only)

### 5.3 Organization-Level Data Reuse

**Issue:** No explicit organization-level data reuse found, but:
- Dashboard shows hardcoded data that looks like organization data
- Navigation counts suggest organization-level metrics
- Summary cards show values that would only exist in organizations

---

## 6. Data Ownership Map

### 6.1 Standalone Teacher → Owns Which Entities?

**Current State:**
- ✅ **Exams:** Owns exams they create (`createdBy: teacherId`)
- ✅ **Exams:** Owns exams they're assigned to (`assignedTeachers: teacherId`)
- ❌ **Classes:** Cannot create classes (requires organization/department)
- ❌ **Students:** Cannot manage students (requires organization)
- ❌ **Question Banks:** Likely scoped by organization (needs verification)
- ❌ **Questions:** Likely scoped by organization (needs verification)
- ❌ **Assignments:** No API endpoint exists (hardcoded in frontend)
- ❌ **Grades:** No API endpoint exists (hardcoded in frontend)
- ❌ **Performance Data:** No API endpoint exists (hardcoded in frontend)

**Expected State (Architectural Proposal):**
- ✅ **Exams:** Owns exams they create or are assigned to
- ✅ **Question Banks:** Owns question banks they create (organizationId: null)
- ✅ **Questions:** Owns questions they create (organizationId: null)
- ✅ **Classes:** Can create personal classes (not tied to organization)
- ✅ **Students:** Can manage students in their personal classes
- ✅ **Assignments:** Can create assignments for their classes
- ✅ **Grades:** Can grade assignments/exams they created
- ✅ **Performance Data:** Calculated from their own exams/assignments

### 6.2 Organization Admin → Owns Which Entities?

**Current State:**
- ✅ **Exams:** All exams in organization (`organizationId: orgId`)
- ✅ **Teachers:** All teachers in organization
- ✅ **Students:** All students in organization
- ✅ **Classes:** All classes in organization
- ✅ **Question Banks:** All question banks in organization
- ✅ **Questions:** All questions in organization
- ✅ **Departments:** All departments in organization
- ✅ **Subjects:** All subjects in organization

**Expected State (No Change):**
- Same as current - organization admin owns all organization-scoped entities

---

## 7. Current Behavior Summary

### 7.1 What Standalone Teachers See

1. **Hardcoded Dashboard Metrics:**
   - Student Performance Chart: 12 months of fake data (78-97%)
   - Subject Performance: 4 hardcoded subjects with percentages
   - Recent Assignments: 4 fake assignments
   - Top Students: 4 fake students
   - Summary Cards: Hardcoded counts (6 classes, 85 students, 12 assignments, 87% avg)

2. **Actual API Data:**
   - Upcoming Exams: Fetched from `/api/exams/teacher` (may be empty or incorrect)

3. **Navigation Counts:**
   - All hardcoded: Classes (6), Students (85), Assignments (12), Schedule (24), Question Bank (10), Grades (45), Quizzes (15), Reports (3)

### 7.2 Why This Happens

1. **Frontend:** Dashboard was built with hardcoded demo data for rapid prototyping
2. **Backend:** Endpoints assume `organizationId` exists and filter accordingly
3. **Architecture:** System was designed primarily for organization-based workflows
4. **Missing APIs:** No endpoints exist for:
   - Student performance analytics
   - Subject performance
   - Recent assignments
   - Top students
   - Class/student/assignment counts

---

## 8. Incorrect Assumptions

### 8.1 Backend Assumptions

| Assumption | Location | Impact | Fix Required |
|------------|----------|--------|--------------|
| All teachers have `organizationId` | `examController.js:390` | Filters incorrectly for standalone teachers | Add null check |
| Teachers can only access organization-scoped data | `teacherClassController.js:208` | Standalone teachers cannot create classes | Make organization optional |
| `organizationId` is always present in filters | Multiple endpoints | Empty results for standalone teachers | Add conditional filtering |
| Question banks are organization-scoped | `questionBankController.js` (assumed) | Standalone teachers cannot access | Verify and fix if needed |

### 8.2 Frontend Assumptions

| Assumption | Location | Impact | Fix Required |
|------------|----------|--------|--------------|
| Dashboard data will come from APIs | `TeacherDashboard.js` | Shows hardcoded data instead | Implement API calls |
| Navigation counts are dynamic | `TeacherDashboard.js:148-162` | Shows hardcoded counts | Fetch from APIs |
| Summary cards are calculated | `TeacherDashboard.js:372-375` | Shows hardcoded values | Calculate from real data |
| All teachers belong to organizations | Multiple components | UI may break for standalone teachers | Add null checks |

---

## 9. Required Architectural Corrections

### 9.1 Backend Changes

#### Priority 1: Fix Data Scoping

**File:** `backend/src/controllers/examController.js`

**Current:**
```javascript
filter = {
  organizationId,  // null for standalone teachers
  $or: [
    { createdBy: userId },
    { assignedTeachers: userId }
  ]
};
```

**Required:**
```javascript
if (organizationId) {
  filter.organizationId = organizationId;
  filter.$or = [
    { createdBy: userId },
    { assignedTeachers: userId }
  ];
} else {
  // Standalone teacher: only their own exams
  filter.$or = [
    { createdBy: userId },
    { assignedTeachers: userId }
  ];
  filter.organizationId = null;  // Explicitly null, not undefined
}
```

#### Priority 2: Make Organization Optional in Teacher Classes

**File:** `backend/src/controllers/teacherClassController.js:208`

**Current:**
```javascript
if (!organizationId) {
  return sendError(res, new Error('Teacher is not assigned to any organization'), ...);
}
```

**Required:**
```javascript
// Allow standalone teachers to create classes without organization
// Filter classes by teacherId only if no organizationId
```

#### Priority 3: Create Missing API Endpoints

**Required Endpoints:**
1. `GET /api/teachers/:teacherId/stats` - Dashboard statistics
2. `GET /api/teachers/:teacherId/students` - Students in teacher's classes
3. `GET /api/teachers/:teacherId/assignments` - Recent assignments
4. `GET /api/teachers/:teacherId/performance` - Student performance data
5. `GET /api/teachers/:teacherId/subjects` - Subject performance

### 9.2 Frontend Changes

#### Priority 1: Replace Hardcoded Data with API Calls

**File:** `frontend/src/pages/dashboard/TeacherDashboard.js`

**Required:**
1. Remove all hardcoded arrays (lines 102-136)
2. Add state for real data
3. Implement `useEffect` hooks to fetch:
   - Student performance from API
   - Subject performance from API
   - Recent assignments from API
   - Top students from API
   - Navigation counts from API
   - Summary card values from API

#### Priority 2: Handle Null OrganizationId

**File:** `frontend/src/pages/dashboard/TeacherDashboard.js`

**Required:**
- Add conditional rendering for organization-dependent features
- Show appropriate empty states for standalone teachers
- Hide organization-specific navigation items

### 9.3 Data Model Changes

**No schema changes required** - `Teacher.organization` is already optional.

**Required:** Ensure all queries handle `organization: null` correctly.

---

## 10. Files to Refactor

### 10.1 Backend Files

| File | Priority | Changes Required |
|------|----------|------------------|
| `backend/src/controllers/examController.js` | **HIGH** | Fix `getExamsByTeacher` to handle null organizationId |
| `backend/src/controllers/teacherClassController.js` | **HIGH** | Make organization optional for class creation |
| `backend/src/controllers/questionBankController.js` | **MEDIUM** | Verify and fix organization scoping |
| `backend/src/controllers/questionController.js` | **MEDIUM** | Verify and fix organization scoping |
| `backend/src/services/TeacherService.js` | **HIGH** | Add methods for dashboard statistics |
| `backend/src/routes/teacherRoutes.js` | **MEDIUM** | Add new dashboard statistics endpoints |

### 10.2 Frontend Files

| File | Priority | Changes Required |
|------|----------|------------------|
| `frontend/src/pages/dashboard/TeacherDashboard.js` | **CRITICAL** | Remove all hardcoded data, implement API calls |
| `frontend/src/services/api.js` | **HIGH** | Add teacher statistics API methods |
| `frontend/src/contexts/AuthContext.js` | **LOW** | Already handles null organizationId correctly |

### 10.3 New Files to Create

| File | Purpose |
|------|---------|
| `backend/src/controllers/teacherStatsController.js` | Dashboard statistics endpoints |
| `backend/src/services/TeacherStatsService.js` | Business logic for teacher statistics |
| `frontend/src/services/teacherStatsAPI.js` | Frontend API client for statistics |

---

## 11. Clean Separation Proposal

### 11.1 Standalone Teacher Data Scope

**Owns:**
- Exams they create (`createdBy: teacherId, organizationId: null`)
- Exams they're assigned to (`assignedTeachers: teacherId`)
- Question banks they create (`createdBy: teacherId, organizationId: null`)
- Questions they create (`createdBy: teacherId, organizationId: null`)
- Classes they create (`teacherId: teacherId, organizationId: null`)
- Students in their classes (via class enrollment)
- Assignments they create (for their classes)
- Grades they assign (for their exams/assignments)

**Cannot Access:**
- Organization-level question banks
- Organization-level questions
- Other teachers' exams (unless assigned)
- Organization students (unless in their classes)
- Organization departments/subjects

### 11.2 Organization Teacher Data Scope

**Owns (within organization):**
- Exams they create (`createdBy: teacherId, organizationId: orgId`)
- Exams they're assigned to (`assignedTeachers: teacherId`)
- Question banks in organization (`organizationId: orgId`)
- Questions in organization (`organizationId: orgId`)
- Classes in their departments (`departmentId: teacher.departments`)
- Students in their classes
- Assignments for their classes
- Grades for their exams/assignments

**Cannot Access:**
- Other organizations' data
- Standalone teachers' data
- Other departments' data (unless assigned)

### 11.3 Implementation Strategy

1. **Query Builder Pattern:**
   ```javascript
   function buildTeacherQuery(teacherId, organizationId) {
     const baseQuery = {
       $or: [
         { createdBy: teacherId },
         { assignedTeachers: teacherId }
       ]
     };
     
     if (organizationId) {
       baseQuery.organizationId = organizationId;
     } else {
       baseQuery.organizationId = null;
     }
     
     return baseQuery;
   }
   ```

2. **Service Layer Abstraction:**
   - Create `TeacherDataService` that handles organization vs standalone logic
   - All controllers use this service instead of direct queries

3. **Frontend Data Fetching:**
   - Create `useTeacherDashboard` hook that:
     - Detects if teacher is standalone (`organizationId === null`)
     - Fetches appropriate data based on teacher type
     - Handles empty states gracefully

---

## 12. Recommendations

### 12.1 Immediate Actions (Week 1)

1. ✅ **Document current behavior** (this audit)
2. 🔄 **Fix `getExamsByTeacher` endpoint** to handle null organizationId
3. 🔄 **Remove hardcoded data from TeacherDashboard.js**
4. 🔄 **Add empty state handling** for standalone teachers

### 12.2 Short-term (Weeks 2-4)

1. Create dashboard statistics API endpoints
2. Implement API calls in frontend
3. Make teacher classes work for standalone teachers
4. Verify and fix question bank/question scoping

### 12.3 Long-term (Months 2-3)

1. Implement full standalone teacher workflow
2. Add analytics and reporting for standalone teachers
3. Create onboarding flow for standalone teachers
4. Add feature flags to toggle organization vs standalone features

---

## 13. Conclusion

The Teacher Dashboard shows predefined data for standalone teachers due to:

1. **Hardcoded frontend data** that was never replaced with API calls
2. **Backend endpoints** that assume `organizationId` exists
3. **Missing API endpoints** for dashboard statistics
4. **Architectural assumptions** that all teachers belong to organizations

**Root Cause:** The system was designed primarily for organization-based workflows, and standalone teacher support was added later without updating the dashboard or all endpoints.

**Impact:** Standalone teachers see fake data and may have limited functionality compared to organization teachers.

**Solution:** Implement the architectural corrections outlined in Section 9, prioritizing data scoping fixes and removing hardcoded frontend data.

---

## Appendix A: Code References

### A.1 Frontend Hardcoded Data Locations

- `frontend/src/pages/dashboard/TeacherDashboard.js:102-115` - Student Performance
- `frontend/src/pages/dashboard/TeacherDashboard.js:117-122` - Subject Performance  
- `frontend/src/pages/dashboard/TeacherDashboard.js:124-129` - Recent Assignments
- `frontend/src/pages/dashboard/TeacherDashboard.js:131-136` - Top Students
- `frontend/src/pages/dashboard/TeacherDashboard.js:148-162` - Navigation Counts
- `frontend/src/pages/dashboard/TeacherDashboard.js:372-375` - Summary Cards

### A.2 Backend Endpoint Locations

- `backend/src/controllers/examController.js:376` - `getExamsByTeacher`
- `backend/src/controllers/teacherClassController.js:164` - `getTeacherClasses`
- `backend/src/controllers/teacherClassController.js:196` - `getAvailableStudents`

### A.3 Authentication & User Resolution

- `backend/src/services/AuthService.js:21-150` - Login flow
- `backend/src/utils/authUtils.js:131-156` - Organization resolution
- `backend/src/middleware/auth.js:35-146` - Authentication middleware

---

**End of Audit Report**



