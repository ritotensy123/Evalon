# Teacher Data Ownership & Separation Proposal
## Standalone vs Organization Teachers

---

## 1. Data Ownership Matrix

### 1.1 Standalone Teacher Data Ownership

| Entity | Ownership Rule | Query Pattern | Notes |
|--------|---------------|---------------|-------|
| **Exams** | Owns exams they create or are assigned to | `{ $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }], organizationId: null }` | Must explicitly set `organizationId: null` |
| **Question Banks** | Owns question banks they create | `{ createdBy: teacherId, organizationId: null }` | Personal question banks only |
| **Questions** | Owns questions they create | `{ createdBy: teacherId, organizationId: null }` | Personal questions only |
| **Classes** | Owns classes they create | `{ teacherId: teacherId, organizationId: null }` | Personal classes, not tied to organization |
| **Students** | Owns students in their classes | Via class enrollment: `{ classId: { $in: teacherClasses }, organizationId: null }` | Only students enrolled in their classes |
| **Assignments** | Owns assignments they create | `{ createdBy: teacherId, organizationId: null }` | Personal assignments |
| **Grades** | Owns grades they assign | `{ gradedBy: teacherId, organizationId: null }` | Grades for their exams/assignments |
| **Performance Data** | Calculated from their own data | Aggregated from their exams, assignments, grades | No access to organization data |

**Key Principle:** Standalone teachers have **complete isolation** - they cannot see or access any organization data.

---

### 1.2 Organization Teacher Data Ownership

| Entity | Ownership Rule | Query Pattern | Notes |
|--------|---------------|---------------|-------|
| **Exams** | Owns exams in their organization (they created or are assigned to) | `{ $or: [{ createdBy: teacherId }, { assignedTeachers: teacherId }], organizationId: orgId }` | Scoped to organization |
| **Question Banks** | Access to organization question banks | `{ organizationId: orgId }` | All organization question banks |
| **Questions** | Access to organization questions | `{ organizationId: orgId }` | All organization questions |
| **Classes** | Owns classes in their departments | `{ teacherId: teacherId, organizationId: orgId }` OR `{ departmentId: { $in: teacher.departments }, organizationId: orgId }` | Scoped to their departments |
| **Students** | Access to students in their classes/departments | `{ organizationId: orgId, classId: { $in: teacherClasses } }` | Students in their classes or departments |
| **Assignments** | Owns assignments in their organization | `{ createdBy: teacherId, organizationId: orgId }` | Scoped to organization |
| **Grades** | Owns grades they assign | `{ gradedBy: teacherId, organizationId: orgId }` | Grades for organization exams/assignments |
| **Performance Data** | Calculated from organization data | Aggregated from organization exams, assignments, grades | Can see organization-wide analytics |

**Key Principle:** Organization teachers have **organization-scoped access** - they can see organization data but are restricted by their role/departments.

---

## 2. Query Builder Pattern

### 2.1 Implementation

**File:** `backend/src/utils/queryBuilder.js` (NEW)

```javascript
/**
 * Build query for teacher-scoped data
 * Handles both standalone and organization teachers
 */
class TeacherQueryBuilder {
  /**
   * Build exam query for teacher
   */
  static buildExamQuery(teacherId, organizationId, options = {}) {
    const baseQuery = {
      $or: [
        { createdBy: teacherId },
        { assignedTeachers: teacherId }
      ]
    };

    if (organizationId) {
      // Organization teacher
      baseQuery.organizationId = organizationId;
    } else {
      // Standalone teacher - explicitly null
      baseQuery.organizationId = null;
    }

    // Add optional filters
    if (options.status) {
      baseQuery.status = options.status;
    }
    if (options.subject) {
      baseQuery.subject = options.subject;
    }

    return baseQuery;
  }

  /**
   * Build question bank query for teacher
   */
  static buildQuestionBankQuery(teacherId, organizationId, options = {}) {
    if (organizationId) {
      // Organization teacher - can see all org question banks
      return {
        organizationId: organizationId,
        ...options
      };
    } else {
      // Standalone teacher - only their own
      return {
        createdBy: teacherId,
        organizationId: null,
        ...options
      };
    }
  }

  /**
   * Build question query for teacher
   */
  static buildQuestionQuery(teacherId, organizationId, options = {}) {
    if (organizationId) {
      // Organization teacher - can see all org questions
      return {
        organizationId: organizationId,
        ...options
      };
    } else {
      // Standalone teacher - only their own
      return {
        createdBy: teacherId,
        organizationId: null,
        ...options
      };
    }
  }

  /**
   * Build class query for teacher
   */
  static buildClassQuery(teacherId, organizationId, options = {}) {
    if (organizationId) {
      // Organization teacher - classes in their departments
      return {
        organizationId: organizationId,
        teacherId: teacherId,
        ...options
      };
    } else {
      // Standalone teacher - only their own classes
      return {
        teacherId: teacherId,
        organizationId: null,
        ...options
      };
    }
  }

  /**
   * Build student query for teacher
   */
  static buildStudentQuery(teacherId, organizationId, classIds = [], options = {}) {
    if (organizationId) {
      // Organization teacher - students in their classes or departments
      return {
        organizationId: organizationId,
        $or: [
          { classId: { $in: classIds } },
          // Add department-based query if needed
        ],
        ...options
      };
    } else {
      // Standalone teacher - only students in their classes
      return {
        organizationId: null,
        classId: { $in: classIds },
        ...options
      };
    }
  }
}

module.exports = TeacherQueryBuilder;
```

---

### 2.2 Usage in Controllers

**Example:** `backend/src/controllers/examController.js`

```javascript
const TeacherQueryBuilder = require('../utils/queryBuilder');

const getExamsByTeacher = asyncWrapper(async (req, res) => {
  const userId = req.user.id;
  const organizationId = req.user.organizationId;
  const { status, subject } = req.query;

  // Use query builder instead of manual filter construction
  const filter = TeacherQueryBuilder.buildExamQuery(userId, organizationId, {
    status,
    subject
  });

  const exams = await ExamRepository.findAll(filter, {
    populate: ['createdBy', 'assignedTeachers', 'questionBankId'],
    sort: { scheduledDate: -1 }
  });

  return sendSuccess(res, { exams }, 'Teacher exams retrieved successfully', 200);
});
```

---

## 3. Service Layer Abstraction

### 3.1 Teacher Data Service

**File:** `backend/src/services/TeacherDataService.js` (NEW)

```javascript
/**
 * Service layer for teacher data access
 * Abstracts organization vs standalone teacher logic
 */
class TeacherDataService {
  constructor(teacherId, organizationId) {
    this.teacherId = teacherId;
    this.organizationId = organizationId;
    this.isStandalone = !organizationId;
  }

  /**
   * Get exams for teacher
   */
  async getExams(options = {}) {
    const filter = TeacherQueryBuilder.buildExamQuery(
      this.teacherId,
      this.organizationId,
      options
    );
    return await ExamRepository.findAll(filter, options);
  }

  /**
   * Get question banks for teacher
   */
  async getQuestionBanks(options = {}) {
    const filter = TeacherQueryBuilder.buildQuestionBankQuery(
      this.teacherId,
      this.organizationId,
      options
    );
    return await QuestionBankRepository.findAll(filter, options);
  }

  /**
   * Get questions for teacher
   */
  async getQuestions(options = {}) {
    const filter = TeacherQueryBuilder.buildQuestionQuery(
      this.teacherId,
      this.organizationId,
      options
    );
    return await QuestionRepository.findAll(filter, options);
  }

  /**
   * Get classes for teacher
   */
  async getClasses(options = {}) {
    const filter = TeacherQueryBuilder.buildClassQuery(
      this.teacherId,
      this.organizationId,
      options
    );
    return await TeacherClassRepository.findAll(filter, options);
  }

  /**
   * Get students for teacher
   */
  async getStudents(classIds = [], options = {}) {
    const filter = TeacherQueryBuilder.buildStudentQuery(
      this.teacherId,
      this.organizationId,
      classIds,
      options
    );
    return await StudentRepository.findAll(filter, options);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [exams, classes, questionBanks, questions] = await Promise.all([
      this.getExams(),
      this.getClasses(),
      this.getQuestionBanks(),
      this.getQuestions()
    ]);

    // Get students from classes
    const classIds = classes.map(c => c._id);
    const students = await this.getStudents(classIds);

    return {
      totalExams: exams.length,
      totalClasses: classes.length,
      totalStudents: students.length,
      totalQuestionBanks: questionBanks.length,
      totalQuestions: questions.length,
      upcomingExams: exams.filter(e => e.status === 'scheduled').length,
      // ... more stats
    };
  }
}

module.exports = TeacherDataService;
```

---

## 4. Frontend Data Fetching Strategy

### 4.1 Custom Hook

**File:** `frontend/src/hooks/useTeacherData.js` (NEW)

```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teacherStatsAPI } from '../services/teacherStatsAPI';

export const useTeacherData = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: null,
    performance: null,
    subjectPerformance: null,
    recentAssignments: null,
    topStudents: null,
    loading: true,
    error: null
  });

  const isStandaloneTeacher = !user?.organizationId;
  const teacherId = user?.dashboardData?.teacherId || user?.id;

  useEffect(() => {
    if (!teacherId) return;

    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        const [stats, performance, subjects, assignments, students] = await Promise.all([
          teacherStatsAPI.getStats(teacherId),
          teacherStatsAPI.getPerformance(teacherId),
          teacherStatsAPI.getSubjectPerformance(teacherId),
          teacherStatsAPI.getRecentAssignments(teacherId),
          teacherStatsAPI.getTopStudents(teacherId)
        ]);

        setData({
          stats: stats.data,
          performance: performance.data,
          subjectPerformance: subjects.data,
          recentAssignments: assignments.data,
          topStudents: students.data,
          loading: false,
          error: null
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchData();
  }, [teacherId]);

  return {
    ...data,
    isStandaloneTeacher,
    teacherId
  };
};
```

---

### 4.2 Usage in Dashboard

**File:** `frontend/src/pages/dashboard/TeacherDashboard.js`

```javascript
import { useTeacherData } from '../../hooks/useTeacherData';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const {
    stats,
    performance,
    subjectPerformance,
    recentAssignments,
    topStudents,
    loading,
    error,
    isStandaloneTeacher
  } = useTeacherData();

  // Use real data instead of hardcoded
  const studentPerformanceData = performance || [];
  const subjectPerformanceData = subjectPerformance || [];
  const recentAssignmentsData = recentAssignments || [];
  const topStudentsData = topStudents || [];

  // Navigation counts from stats
  const coreModules = [
    { id: 'classes', count: stats?.totalClasses?.toString() || '0' },
    { id: 'students', count: stats?.totalStudents?.toString() || '0' },
    // ... etc
  ];

  // Summary cards from stats
  const summaryCards = [
    { title: "Today's Classes", value: stats?.todayClasses || '0' },
    { title: 'My Students', value: stats?.totalStudents || '0' },
    // ... etc
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    // Render dashboard with real data
  );
};
```

---

## 5. Data Isolation Rules

### 5.1 Standalone Teacher Isolation

**Rule 1: Explicit Null OrganizationId**
- All queries MUST explicitly set `organizationId: null`
- Never use `{ organizationId: { $exists: false } }` (may match undefined)
- Never omit `organizationId` from query (may match any)

**Rule 2: Teacher ID Scoping**
- All queries MUST filter by `teacherId` (createdBy, assignedTeachers, etc.)
- Never return data from other teachers

**Rule 3: No Organization Data Access**
- Standalone teachers CANNOT access:
  - Organization question banks
  - Organization questions
  - Organization students (unless in their classes)
  - Organization exams (unless assigned to them)
  - Organization departments/subjects

---

### 5.2 Organization Teacher Scoping

**Rule 1: Organization ID Required**
- All queries MUST include `organizationId: orgId`
- Never return data from other organizations

**Rule 2: Department Scoping (Optional)**
- Teachers may be restricted to their departments
- Check `teacher.departments` array for department-based filtering

**Rule 3: Role-Based Access**
- Organization admins: Full organization access
- Sub-admins: Department-scoped access
- Teachers: Class-scoped access

---

## 6. Migration Strategy

### 6.1 Existing Standalone Teachers

**Issue:** Existing standalone teachers may have data with `organizationId: undefined` instead of `null`.

**Migration Script:**
```javascript
// backend/scripts/migration/fix-standalone-teacher-data.js

async function fixStandaloneTeacherData() {
  // Find all standalone teachers
  const standaloneTeachers = await Teacher.find({ organization: null });

  for (const teacher of standaloneTeachers) {
    // Fix exams
    await Exam.updateMany(
      { createdBy: teacher._id, organizationId: { $exists: false } },
      { $set: { organizationId: null } }
    );

    // Fix question banks
    await QuestionBank.updateMany(
      { createdBy: teacher._id, organizationId: { $exists: false } },
      { $set: { organizationId: null } }
    );

    // Fix questions
    await Question.updateMany(
      { createdBy: teacher._id, organizationId: { $exists: false } },
      { $set: { organizationId: null } }
    );

    // Fix classes
    await TeacherClass.updateMany(
      { teacherId: teacher._id, organizationId: { $exists: false } },
      { $set: { organizationId: null } }
    );
  }
}
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

**Test Query Builder:**
```javascript
describe('TeacherQueryBuilder', () => {
  it('should build correct query for standalone teacher', () => {
    const query = TeacherQueryBuilder.buildExamQuery('teacher123', null);
    expect(query).toEqual({
      $or: [
        { createdBy: 'teacher123' },
        { assignedTeachers: 'teacher123' }
      ],
      organizationId: null
    });
  });

  it('should build correct query for organization teacher', () => {
    const query = TeacherQueryBuilder.buildExamQuery('teacher123', 'org456');
    expect(query).toEqual({
      $or: [
        { createdBy: 'teacher123' },
        { assignedTeachers: 'teacher123' }
      ],
      organizationId: 'org456'
    });
  });
});
```

---

### 7.2 Integration Tests

**Test Data Isolation:**
```javascript
describe('Teacher Data Isolation', () => {
  it('should not return organization data for standalone teacher', async () => {
    const standaloneTeacher = await createStandaloneTeacher();
    const orgExam = await createOrgExam();

    const exams = await getExamsByTeacher(standaloneTeacher.id);
    
    expect(exams).not.toContainEqual(expect.objectContaining({ _id: orgExam._id }));
  });

  it('should not return standalone data for organization teacher', async () => {
    const orgTeacher = await createOrgTeacher();
    const standaloneExam = await createStandaloneExam();

    const exams = await getExamsByTeacher(orgTeacher.id);
    
    expect(exams).not.toContainEqual(expect.objectContaining({ _id: standaloneExam._id }));
  });
});
```

---

## 8. Implementation Checklist

- [ ] Create `TeacherQueryBuilder` utility
- [ ] Create `TeacherDataService` service layer
- [ ] Update all exam endpoints to use query builder
- [ ] Update all question bank endpoints to use query builder
- [ ] Update all question endpoints to use query builder
- [ ] Update all class endpoints to use query builder
- [ ] Create migration script for existing data
- [ ] Add unit tests for query builder
- [ ] Add integration tests for data isolation
- [ ] Update frontend to use new data fetching hooks
- [ ] Remove all hardcoded data from frontend
- [ ] Add monitoring/logging for data access patterns

---

## 9. Security Considerations

### 9.1 Data Leakage Prevention

1. **Never trust client-provided organizationId**
   - Always use `req.user.organizationId` from authenticated session
   - Never accept organizationId from request body/query params

2. **Explicit Null Checks**
   - Always check `organizationId === null` explicitly
   - Don't rely on truthy/falsy checks

3. **Query Validation**
   - Validate all queries before execution
   - Log suspicious query patterns

---

## 10. Performance Considerations

### 10.1 Indexing Strategy

**Required Indexes:**
```javascript
// Exams
Exam.index({ organizationId: 1, createdBy: 1 });
Exam.index({ organizationId: 1, assignedTeachers: 1 });
Exam.index({ organizationId: 1, status: 1 });

// Question Banks
QuestionBank.index({ organizationId: 1, createdBy: 1 });

// Questions
Question.index({ organizationId: 1, createdBy: 1 });

// Classes
TeacherClass.index({ organizationId: 1, teacherId: 1 });
```

---

## Conclusion

This proposal provides a clean separation between standalone and organization teachers through:

1. **Query Builder Pattern** - Centralized logic for building queries
2. **Service Layer Abstraction** - Business logic separated from controllers
3. **Frontend Hooks** - Reusable data fetching logic
4. **Explicit Data Isolation** - Clear rules for data ownership
5. **Migration Strategy** - Safe migration of existing data

**Next Steps:**
1. Implement query builder
2. Update all endpoints
3. Create frontend hooks
4. Remove hardcoded data
5. Test thoroughly

---

**End of Proposal**



