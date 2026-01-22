# Teacher Dashboard Refactoring Checklist

## Overview
This checklist tracks the refactoring work required to fix standalone teacher dashboard data issues identified in the audit.

---

## Phase 1: Critical Backend Fixes (Priority: HIGH)

### 1.1 Fix Exam Endpoint Data Scoping
- [ ] **File:** `backend/src/controllers/examController.js`
- [ ] **Function:** `getExamsByTeacher` (Line 376)
- [ ] **Issue:** Filters by `organizationId: null` without proper handling
- [ ] **Fix:** Add conditional logic to handle standalone teachers
- [ ] **Test:** Verify standalone teachers only see their own exams

**Code Change:**
```javascript
// BEFORE
filter = {
  organizationId,  // null for standalone teachers
  $or: [
    { createdBy: userId },
    { assignedTeachers: userId }
  ]
};

// AFTER
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
  filter.organizationId = null;  // Explicitly null
}
```

---

### 1.2 Make Organization Optional in Teacher Classes
- [ ] **File:** `backend/src/controllers/teacherClassController.js`
- [ ] **Function:** `getAvailableStudents` (Line 196)
- [ ] **Issue:** Requires organizationId, fails for standalone teachers
- [ ] **Fix:** Allow null organizationId and filter by teacherId only
- [ ] **Test:** Verify standalone teachers can create classes

**Code Change:**
```javascript
// BEFORE
if (!organizationId) {
  return sendError(res, new Error('Teacher is not assigned to any organization'), ...);
}

// AFTER
// Allow standalone teachers (organizationId can be null)
if (organizationId) {
  // Organization teacher logic
} else {
  // Standalone teacher logic - filter by teacherId only
}
```

---

### 1.3 Verify Question Bank Scoping
- [ ] **File:** `backend/src/controllers/questionBankController.js`
- [ ] **Issue:** May filter by organizationId only
- [ ] **Fix:** Add support for `organizationId: null` (standalone teachers)
- [ ] **Test:** Verify standalone teachers can access their question banks

---

### 1.4 Verify Question Scoping
- [ ] **File:** `backend/src/controllers/questionController.js`
- [ ] **Issue:** May filter by organizationId only
- [ ] **Fix:** Add support for `organizationId: null` (standalone teachers)
- [ ] **Test:** Verify standalone teachers can access their questions

---

## Phase 2: Create Missing API Endpoints (Priority: HIGH)

### 2.1 Teacher Dashboard Statistics Endpoint
- [ ] **File:** `backend/src/controllers/teacherStatsController.js` (NEW)
- [ ] **Endpoint:** `GET /api/teachers/:teacherId/stats`
- [ ] **Returns:**
  - Total classes
  - Total students
  - Total assignments
  - Average grade
  - Upcoming exams count
  - Recent activity

**Implementation:**
```javascript
const getTeacherStats = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const organizationId = req.user.organizationId;
  
  const stats = await TeacherStatsService.getDashboardStats(teacherId, organizationId);
  
  return sendSuccess(res, stats, 'Teacher statistics retrieved', 200);
});
```

---

### 2.2 Student Performance Endpoint
- [ ] **File:** `backend/src/controllers/teacherStatsController.js`
- [ ] **Endpoint:** `GET /api/teachers/:teacherId/performance`
- [ ] **Returns:** Student performance data over time (for charts)

---

### 2.3 Subject Performance Endpoint
- [ ] **File:** `backend/src/controllers/teacherStatsController.js`
- [ ] **Endpoint:** `GET /api/teachers/:teacherId/subjects/performance`
- [ ] **Returns:** Performance by subject

---

### 2.4 Recent Assignments Endpoint
- [ ] **File:** `backend/src/controllers/teacherStatsController.js`
- [ ] **Endpoint:** `GET /api/teachers/:teacherId/assignments/recent`
- [ ] **Returns:** Recent assignments with status and scores

---

### 2.5 Top Students Endpoint
- [ ] **File:** `backend/src/controllers/teacherStatsController.js`
- [ ] **Endpoint:** `GET /api/teachers/:teacherId/students/top`
- [ ] **Returns:** Top performing students

---

### 2.6 Create Service Layer
- [ ] **File:** `backend/src/services/TeacherStatsService.js` (NEW)
- [ ] **Methods:**
  - `getDashboardStats(teacherId, organizationId)`
  - `getStudentPerformance(teacherId, organizationId, period)`
  - `getSubjectPerformance(teacherId, organizationId)`
  - `getRecentAssignments(teacherId, organizationId, limit)`
  - `getTopStudents(teacherId, organizationId, limit)`

---

### 2.7 Add Routes
- [ ] **File:** `backend/src/routes/teacherRoutes.js`
- [ ] **Add routes:**
  ```javascript
  router.get('/:teacherId/stats', authenticate, getTeacherStats);
  router.get('/:teacherId/performance', authenticate, getStudentPerformance);
  router.get('/:teacherId/subjects/performance', authenticate, getSubjectPerformance);
  router.get('/:teacherId/assignments/recent', authenticate, getRecentAssignments);
  router.get('/:teacherId/students/top', authenticate, getTopStudents);
  ```

---

## Phase 3: Frontend Refactoring (Priority: CRITICAL)

### 3.1 Remove Hardcoded Data
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Remove:**
  - [ ] Lines 102-115: `studentPerformanceData` array
  - [ ] Lines 117-122: `subjectPerformanceData` array
  - [ ] Lines 124-129: `recentAssignments` array
  - [ ] Lines 131-136: `topStudents` array
  - [ ] Lines 148-162: Hardcoded navigation counts
  - [ ] Lines 372-375: Hardcoded summary card values

---

### 3.2 Add State Management
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Add state:**
  ```javascript
  const [studentPerformance, setStudentPerformance] = useState([]);
  const [subjectPerformance, setSubjectPerformance] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    averageGrade: 0
  });
  const [loading, setLoading] = useState(true);
  ```

---

### 3.3 Implement API Calls
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Add useEffect hooks:**
  ```javascript
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const teacherId = user?.dashboardData?.teacherId || user?.id;
      
      const [stats, performance, subjects, assignments, students] = await Promise.all([
        teacherStatsAPI.getStats(teacherId),
        teacherStatsAPI.getPerformance(teacherId),
        teacherStatsAPI.getSubjectPerformance(teacherId),
        teacherStatsAPI.getRecentAssignments(teacherId),
        teacherStatsAPI.getTopStudents(teacherId)
      ]);
      
      // Update state
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  ```

---

### 3.4 Update Navigation Counts
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Replace hardcoded counts with:**
  ```javascript
  const coreModules = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, active: true },
    { id: 'classes', label: 'My Classes', icon: <Class />, count: dashboardStats.totalClasses?.toString() || '0' },
    { id: 'students', label: 'Students', icon: <Users />, count: dashboardStats.totalStudents?.toString() || '0' },
    { id: 'assignments', label: 'Assignments', icon: <Assignment />, count: dashboardStats.totalAssignments?.toString() || '0' },
    // ... etc
  ];
  ```

---

### 3.5 Update Summary Cards
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Replace hardcoded values with:**
  ```javascript
  const summaryCards = [
    { title: "Today's Classes", value: dashboardStats.todayClasses || '0', ... },
    { title: 'My Students', value: dashboardStats.totalStudents || '0', ... },
    { title: 'Assignments', value: dashboardStats.totalAssignments || '0', ... },
    { title: 'Avg. Grade', value: `${dashboardStats.averageGrade || 0}%`, ... },
  ];
  ```

---

### 3.6 Add Loading States
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Add loading indicators:**
  - Show skeleton loaders while data is fetching
  - Show empty states when no data exists
  - Handle errors gracefully

---

### 3.7 Handle Standalone Teacher State
- [ ] **File:** `frontend/src/pages/dashboard/TeacherDashboard.js`
- [ ] **Add conditional rendering:**
  ```javascript
  const isStandaloneTeacher = !user?.organizationId;
  
  // Hide organization-specific features
  // Show appropriate empty states
  // Display "Standalone Teacher" badge if needed
  ```

---

## Phase 4: Frontend API Client (Priority: HIGH)

### 4.1 Create Teacher Stats API
- [ ] **File:** `frontend/src/services/teacherStatsAPI.js` (NEW)
- [ ] **Methods:**
  ```javascript
  export const teacherStatsAPI = {
    getStats: async (teacherId) => { ... },
    getPerformance: async (teacherId, period = '12 Months') => { ... },
    getSubjectPerformance: async (teacherId) => { ... },
    getRecentAssignments: async (teacherId, limit = 10) => { ... },
    getTopStudents: async (teacherId, limit = 5) => { ... }
  };
  ```

---

### 4.2 Update Main API File
- [ ] **File:** `frontend/src/services/api.js`
- [ ] **Export teacherStatsAPI:**
  ```javascript
  export { teacherStatsAPI } from './teacherStatsAPI';
  ```

---

## Phase 5: Testing (Priority: MEDIUM)

### 5.1 Backend Tests
- [ ] Test `getExamsByTeacher` with null organizationId
- [ ] Test `getTeacherClasses` with null organizationId
- [ ] Test all new statistics endpoints
- [ ] Test data scoping for standalone vs organization teachers

---

### 5.2 Frontend Tests
- [ ] Test dashboard loads with real data
- [ ] Test empty states for standalone teachers
- [ ] Test loading states
- [ ] Test error handling

---

### 5.3 Integration Tests
- [ ] Test full dashboard flow for standalone teacher
- [ ] Test full dashboard flow for organization teacher
- [ ] Verify no data leakage between teacher types

---

## Phase 6: Documentation (Priority: LOW)

### 6.1 Update API Documentation
- [ ] Document new teacher statistics endpoints
- [ ] Document organizationId handling
- [ ] Add examples for standalone vs organization teachers

---

### 6.2 Update Frontend Documentation
- [ ] Document dashboard data flow
- [ ] Document standalone teacher limitations
- [ ] Add component usage examples

---

## Progress Tracking

**Total Tasks:** 50+  
**Completed:** 0  
**In Progress:** 0  
**Blocked:** 0  

---

## Notes

- All changes should maintain backward compatibility with organization teachers
- Add feature flags if needed to toggle between old and new implementations
- Consider creating a migration script for existing standalone teachers
- Monitor performance impact of new API calls

---

**Last Updated:** 2025-01-XX



