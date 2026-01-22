/**
 * TeacherDashboardService
 * Service layer for teacher dashboard data operations
 * Handles data retrieval for standalone teachers only
 */

const Exam = require('../models/Exam');
const QuestionBank = require('../models/QuestionBank');
const Question = require('../models/Question');
const TeacherClass = require('../models/TeacherClass');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

class TeacherDashboardService {
  /**
   * Validate teacher is standalone (organizationId must be null)
   * @param {string} teacherId - Teacher ID
   * @throws {AppError} - If teacher is not standalone
   */
  async validateStandaloneTeacher(teacherId) {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    if (teacher.organization !== null && teacher.organization !== undefined) {
      throw AppError.forbidden('This endpoint is only for standalone teachers');
    }

    return teacher;
  }

  /**
   * Validate teacher ID matches authenticated user
   * @param {string} teacherId - Teacher ID from URL
   * @param {string} authenticatedUserId - Authenticated user ID
   * @param {string} authenticatedTeacherId - Authenticated teacher model ID
   * @throws {AppError} - If IDs don't match
   */
  validateTeacherAccess(teacherId, authenticatedUserId, authenticatedTeacherId) {
    // teacherId can be either User._id or Teacher._id
    if (teacherId !== authenticatedUserId && teacherId !== authenticatedTeacherId) {
      throw AppError.forbidden('Access denied. You can only access your own data.');
    }
  }

  /**
   * Get dashboard statistics for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getDashboardStats(teacherId) {
    // Resolve teacherId to User._id and Teacher._id
    let user = await User.findById(teacherId);
    let teacherModelId = null;
    let userId = teacherId;

    if (user && user.userType === 'teacher') {
      // teacherId is User._id
      userId = user._id;
      teacherModelId = user.userId;
    } else {
      // teacherId might be Teacher._id, find user by userId
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        throw AppError.notFound('Teacher not found');
      }
      teacherModelId = teacher._id;
      user = await User.findOne({ userId: teacher._id, userType: 'teacher' });
      if (!user) {
        throw AppError.notFound('User not found for teacher');
      }
      userId = user._id;
    }

    // Get teacher model
    const teacher = await Teacher.findById(teacherModelId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }

    // Validate teacher is standalone
    if (teacher.organization !== null && teacher.organization !== undefined) {
      throw AppError.forbidden('This endpoint is only for standalone teachers');
    }

    // Get classes count
    const totalClasses = await TeacherClass.countDocuments({
      teacherId: teacherModelId,
      organizationId: null
    });

    // Get students count (via classes - students are stored in TeacherClass.students array)
    const teacherClasses = await TeacherClass.find({
      teacherId: teacherModelId,
      organizationId: null
    }).select('students');

    // Count unique active students across all classes
    const studentIds = new Set();
    teacherClasses.forEach(cls => {
      if (cls.students && Array.isArray(cls.students)) {
        cls.students.forEach(student => {
          if (student.status === 'active' || !student.status) {
            studentIds.add(student.studentId.toString());
          }
        });
      }
    });
    const totalStudents = studentIds.size;

    // Get assignments count (exams with type 'assignment')
    // Note: createdBy and assignedTeachers use User._id
    const totalAssignments = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      examType: 'assignment'
    });

    // Get exams count
    const totalExams = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null
    });

    // Get upcoming exams count
    const upcomingExams = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    });

    // Get question banks count
    const totalQuestionBanks = await QuestionBank.countDocuments({
      createdBy: userId,
      organizationId: null
    });

    // Get questions count
    const totalQuestions = await Question.countDocuments({
      createdBy: userId,
      organizationId: null
    });

    return {
      totalClasses,
      totalStudents,
      totalAssignments,
      totalExams,
      upcomingExams,
      totalQuestionBanks,
      totalQuestions
    };
  }

  /**
   * Get recent exams for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recent exams
   */
  async getRecentExams(teacherId, options = {}) {
    const limit = Math.min(options.limit || 5, 20);
    const status = options.status;

    // Resolve to User._id
    const userId = await this._resolveUserId(teacherId);

    const query = {
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null
    };

    if (status) {
      query.status = status;
    }

    const exams = await Exam.find(query)
      .sort({ scheduledDate: -1 })
      .limit(limit)
      .select('title subject class scheduledDate startTime status totalQuestions totalMarks')
      .lean();

    return exams;
  }

  /**
   * Get recent question banks for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recent question banks
   */
  async getRecentQuestionBanks(teacherId, options = {}) {
    const limit = Math.min(options.limit || 5, 20);

    // Resolve to User._id
    const userId = await this._resolveUserId(teacherId);

    const questionBanks = await QuestionBank.find({
      createdBy: userId,
      organizationId: null
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('name subject class totalQuestions status createdAt')
      .lean();

    return questionBanks;
  }

  /**
   * Get recent classes for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recent classes
   */
  async getRecentClasses(teacherId, options = {}) {
    const limit = Math.min(options.limit || 5, 20);

    // Resolve to Teacher._id
    const teacherModelId = await this._resolveTeacherId(teacherId);

    const classes = await TeacherClass.find({
      teacherId: teacherModelId,
      organizationId: null
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('className classCode subjectName totalStudents createdAt')
      .lean();

    // Map to consistent format
    return classes.map(cls => ({
      _id: cls._id,
      className: cls.className,
      classCode: cls.classCode,
      subject: cls.subjectName || '',
      totalStudents: cls.stats?.totalStudents || 0,
      createdAt: cls.createdAt
    }));
  }

  /**
   * Get recent assignments for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Recent assignments
   */
  async getRecentAssignments(teacherId, options = {}) {
    const limit = Math.min(options.limit || 5, 20);
    const status = options.status;

    // Resolve to User._id
    const userId = await this._resolveUserId(teacherId);

    const query = {
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      examType: 'assignment'
    };

    if (status) {
      query.status = status;
    }

    const assignments = await Exam.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('title subject class scheduledDate status totalQuestions totalMarks createdAt')
      .lean();

    // Map to assignment format
    return assignments.map(assignment => ({
      _id: assignment._id,
      title: assignment.title,
      subject: assignment.subject,
      class: assignment.class,
      dueDate: assignment.scheduledDate,
      status: assignment.status,
      totalSubmissions: 0, // Not tracked in Exam model
      totalStudents: 0, // Not tracked in Exam model
      createdAt: assignment.createdAt
    }));
  }

  /**
   * Get navigation counts for standalone teacher
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @returns {Promise<Object>} - Navigation counts
   */
  async getNavigationCounts(teacherId) {
    // Resolve to User._id and Teacher._id
    const userId = await this._resolveUserId(teacherId);
    const teacherModelId = await this._resolveTeacherId(teacherId);

    // Get classes count
    const classes = await TeacherClass.countDocuments({
      teacherId: teacherModelId,
      organizationId: null
    });

    // Get students count (via classes - students are stored in TeacherClass.students array)
    const teacherClassesForCount = await TeacherClass.find({
      teacherId: teacherModelId,
      organizationId: null
    }).select('students');

    // Count unique active students across all classes
    const studentIds = new Set();
    teacherClassesForCount.forEach(cls => {
      if (cls.students && Array.isArray(cls.students)) {
        cls.students.forEach(student => {
          if (student.status === 'active' || !student.status) {
            studentIds.add(student.studentId.toString());
          }
        });
      }
    });
    const students = studentIds.size;

    // Get assignments count
    const assignments = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      examType: 'assignment'
    });

    // Get schedule count (exams scheduled today or future)
    const schedule = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      status: 'scheduled',
      scheduledDate: { $gte: new Date() }
    });

    // Get exams count
    const exams = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null
    });

    // Get question bank count
    const questionBank = await QuestionBank.countDocuments({
      createdBy: userId,
      organizationId: null
    });

    // Get grades count (completed exams)
    const grades = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      status: 'completed'
    });

    // Get quizzes count
    const quizzes = await Exam.countDocuments({
      $or: [
        { createdBy: userId },
        { assignedTeachers: userId }
      ],
      organizationId: null,
      examType: 'quiz'
    });

    // Get reports count (placeholder - no reports model)
    const reports = 0;

    return {
      classes,
      students,
      assignments,
      schedule,
      exams,
      questionBank,
      grades,
      quizzes,
      reports
    };
  }

  /**
   * Resolve teacherId to User._id
   * @private
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @returns {Promise<string>} - User._id
   */
  async _resolveUserId(teacherId) {
    let user = await User.findById(teacherId);
    if (user && user.userType === 'teacher') {
      return user._id.toString();
    }
    // teacherId is Teacher._id, find user
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }
    user = await User.findOne({ userId: teacher._id, userType: 'teacher' });
    if (!user) {
      throw AppError.notFound('User not found for teacher');
    }
    return user._id.toString();
  }

  /**
   * Resolve teacherId to Teacher._id
   * @private
   * @param {string} teacherId - Teacher ID (User._id or Teacher._id)
   * @returns {Promise<string>} - Teacher._id
   */
  async _resolveTeacherId(teacherId) {
    let user = await User.findById(teacherId);
    if (user && user.userType === 'teacher') {
      return user.userId.toString();
    }
    // teacherId is Teacher._id
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw AppError.notFound('Teacher not found');
    }
    return teacher._id.toString();
  }
}

module.exports = new TeacherDashboardService();

