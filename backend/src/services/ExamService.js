/**
 * ExamService
 * Service layer for exam operations
 * Handles exam CRUD operations and business logic
 */

const ExamRepository = require('../repositories/ExamRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const UserRepository = require('../repositories/UserRepository');
const ExamSession = require('../models/ExamSession');
const Exam = require('../models/Exam');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

class ExamService {
  /**
   * Get exam by ID
   * @param {string} examId - Exam ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Exam document
   * @throws {AppError} - If exam not found or unauthorized
   */
  async getExamById(examId, organizationId = null) {
    if (!examId) {
      throw AppError.badRequest('Exam ID is required');
    }

    const exam = await ExamRepository.findById(examId, {
      populate: ['createdBy', 'assignedTeachers', 'organizationId']
    });

    if (!exam) {
      throw AppError.notFound('Exam not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (exam.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Exam does not belong to this organization');
      }
    }

    return exam;
  }

  /**
   * Create a new exam
   * @param {Object} examData - Exam data
   * @param {string} userId - Creator user ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Created exam
   * @throws {AppError} - If validation fails
   */
  async createExam(examData, userId, organizationId) {
    // Input validation
    if (!examData.title || !examData.subject || !examData.class) {
      throw AppError.badRequest('Exam title, subject, and class are required');
    }

    if (!userId) {
      throw AppError.badRequest('User ID is required');
    }

    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Verify user exists
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }

    // Calculate total marks if not provided
    if (!examData.totalMarks && examData.totalQuestions && examData.marksPerQuestion) {
      examData.totalMarks = examData.totalQuestions * examData.marksPerQuestion;
    }

    // Set required fields
    examData.organizationId = organizationId;
    examData.createdBy = userId;
    examData.status = examData.status || 'scheduled';
    examData.questionsAdded = examData.questionsAdded || 0;

    // Create exam
    const exam = await ExamRepository.create(examData);

    return exam;
  }

  /**
   * Update exam
   * @param {string} examId - Exam ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Updated exam
   * @throws {AppError} - If exam not found or unauthorized
   */
  async updateExam(examId, updateData, organizationId = null) {
    if (!examId) {
      throw AppError.badRequest('Exam ID is required');
    }

    // Get existing exam
    const existingExam = await ExamRepository.findById(examId);
    if (!existingExam) {
      throw AppError.notFound('Exam not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingExam.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Exam does not belong to this organization');
      }
    }

    // Prevent organizationId changes
    if (updateData.organizationId) {
      delete updateData.organizationId;
    }

    // Recalculate total marks if questions or marks per question changed
    if (updateData.totalQuestions || updateData.marksPerQuestion) {
      const totalQuestions = updateData.totalQuestions || existingExam.totalQuestions;
      const marksPerQuestion = updateData.marksPerQuestion || existingExam.marksPerQuestion;
      if (totalQuestions && marksPerQuestion) {
        updateData.totalMarks = totalQuestions * marksPerQuestion;
      }
    }

    // Update exam
    const updatedExam = await ExamRepository.updateById(examId, updateData);

    if (!updatedExam) {
      throw AppError.notFound('Exam not found after update');
    }

    return updatedExam;
  }

  /**
   * Delete exam
   * @param {string} examId - Exam ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Deletion result
   * @throws {AppError} - If exam not found or unauthorized
   */
  async deleteExam(examId, organizationId = null) {
    if (!examId) {
      throw AppError.badRequest('Exam ID is required');
    }

    // Get existing exam
    const existingExam = await ExamRepository.findById(examId);
    if (!existingExam) {
      throw AppError.notFound('Exam not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingExam.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Exam does not belong to this organization');
      }
    }

    // Delete exam
    const deletedExam = await ExamRepository.deleteById(examId);

    if (!deletedExam) {
      throw AppError.notFound('Exam not found');
    }

    return {
      success: true,
      message: 'Exam deleted successfully',
      examId: deletedExam._id
    };
  }

  /**
   * List exams by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Filter options (status, subject, examType)
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - { exams, total, pagination }
   * @throws {AppError} - If organization not found
   */
  async listExamsByOrganization(organizationId, filters = {}, pagination = { page: 1, limit: 10 }) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Verify organization exists
    const organization = await OrganizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('Organization not found');
    }

    // Build filter
    const filter = { organizationId };
    
    if (filters.status) {
      filter.status = filters.status;
    }
    
    if (filters.subject) {
      filter.subject = filters.subject;
    }
    
    if (filters.examType) {
      filter.examType = filters.examType;
    }

    // Calculate pagination
    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 10;
    const skip = (page - 1) * limit;

    // Get exams
    const exams = await ExamRepository.findAll(filter, {
      populate: ['createdBy', 'organizationId'],
      sort: { createdAt: -1 },
      limit,
      skip
    });

    // Get total count
    const total = await ExamRepository.count(filter);

    return {
      exams,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  /**
   * Join exam session
   * @param {string} examId - Exam ID
   * @param {string} studentId - Student user ID
   * @param {Object} deviceInfo - Device information
   * @param {Object} networkInfo - Network information
   * @returns {Promise<Object>} - Session data with socket event payload
   * @throws {AppError} - If validation fails
   */
  async joinExam(examId, studentId, deviceInfo = {}, networkInfo = {}) {
    if (!examId || !studentId) {
      throw AppError.badRequest('Exam ID and Student ID are required');
    }

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw AppError.notFound('Exam not found');
    }

    // Check if exam is scheduled and active
    const now = new Date();
    const examStartTime = new Date(exam.scheduledDate);
    const [hours, minutes] = exam.startTime.split(':');
    examStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const examEndTime = new Date(examStartTime.getTime() + exam.duration * 60000);

    if (now < examStartTime) {
      throw AppError.badRequest('Exam has not started yet');
    }

    if (now > examEndTime) {
      throw AppError.badRequest('Exam has already ended');
    }

    // Create or update exam session
    let session = await ExamSession.findOne({
      examId: examId,
      studentId: studentId,
      status: { $in: ['active', 'disconnected', 'waiting'] }
    }).sort({ startTime: -1 });

    if (!session) {
      const startTime = new Date();
      const endTime = new Date(examStartTime.getTime() + exam.duration * 60000);
      
      session = new ExamSession({
        examId: examId,
        studentId: studentId,
        organizationId: exam.organizationId,
        duration: exam.duration,
        status: 'active',
        startTime: startTime,
        endTime: endTime,
        deviceInfo: deviceInfo,
        networkInfo: networkInfo,
        progress: {
          currentQuestion: 0,
          totalQuestions: exam.questions.length,
          answeredQuestions: 0
        },
        isConnected: true,
        isMonitoringActive: true
      });
      await session.save();
      logger.info('Created new exam session', { examId, studentId, sessionId: session._id });
    } else {
      session.status = 'active';
      session.isConnected = true;
      session.isMonitoringActive = true;
      session.lastActivity = new Date();
      await session.save();
      logger.info('Updated existing exam session', { examId, studentId, sessionId: session._id });
    }

    const timeRemaining = Math.max(0, Math.floor((session.endTime - new Date()) / 1000));

    // Return data for socket event
    return {
      sessionId: session._id,
      exam: {
        id: exam._id,
        title: exam.title,
        duration: exam.duration,
        questions: exam.questions
      },
      timeRemaining: timeRemaining,
      session: session.toObject(),
      socketEvent: 'exam_session_joined',
      socketData: {
        sessionId: session._id,
        exam: {
          id: exam._id,
          title: exam.title,
          duration: exam.duration,
          questions: exam.questions
        },
        timeRemaining: timeRemaining
      }
    };
  }

  /**
   * Submit answer
   * @param {string} sessionId - Session ID
   * @param {string} questionId - Question ID
   * @param {*} answer - Answer data
   * @param {number} timeSpent - Time spent on question (seconds)
   * @returns {Promise<Object>} - Updated session data with socket event payload
   * @throws {AppError} - If validation fails
   */
  async submitAnswer(sessionId, questionId, answer, timeSpent = 0) {
    if (!sessionId || !questionId) {
      throw AppError.badRequest('Session ID and Question ID are required');
    }

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      throw AppError.notFound('Exam session not found');
    }

    if (session.status !== 'active') {
      throw AppError.badRequest('Exam session is not active');
    }

    // Update answers in sessionData
    if (!session.sessionData) {
      session.sessionData = {};
    }
    if (!session.sessionData.answers) {
      session.sessionData.answers = [];
    }
    
    const answerData = {
      questionId: questionId,
      answer: answer,
      timeSpent: timeSpent,
      timestamp: new Date()
    };

    // Check if answer already exists and update, otherwise add
    const existingAnswerIndex = session.sessionData.answers.findIndex(
      a => a.questionId && a.questionId.toString() === questionId.toString()
    );
    
    if (existingAnswerIndex >= 0) {
      session.sessionData.answers[existingAnswerIndex] = answerData;
    } else {
      session.sessionData.answers.push(answerData);
    }
    
    // Update progress
    const answeredCount = session.sessionData.answers.length;
    session.progress = {
      ...session.progress,
      answeredQuestions: answeredCount,
      currentQuestion: session.progress?.currentQuestion || 0
    };

    session.lastActivity = new Date();
    await session.save();

    logger.debug('Answer submitted', { sessionId, questionId, answeredCount });

    return {
      sessionId: session._id,
      progress: session.progress,
      socketEvent: 'answer_submitted',
      socketData: {
        questionId: questionId,
        progress: session.progress,
        timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / 1000))
      }
    };
  }

  /**
   * End exam
   * @param {string} sessionId - Session ID
   * @param {string} reason - Reason for ending (optional)
   * @returns {Promise<Object>} - Final session data with socket event payload
   * @throws {AppError} - If validation fails
   */
  async endExam(sessionId, reason = 'completed') {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      throw AppError.notFound('Exam session not found');
    }

    session.status = 'completed';
    session.isConnected = false;
    session.endTime = new Date();
    session.lastActivity = new Date();
    
    if (reason !== 'completed') {
      session.status = 'terminated';
      session.terminationReason = reason;
    }

    await session.save();

    logger.info('Exam ended', { sessionId, reason, status: session.status });

    return {
      sessionId: session._id,
      status: session.status,
      socketEvent: 'exam_ended',
      socketData: {
        sessionId: session._id,
        status: session.status,
        reason: reason,
        completedAt: session.endTime
      }
    };
  }

  /**
   * Start exam
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session data with socket event payload
   * @throws {AppError} - If validation fails
   */
  async startExam(sessionId) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      throw AppError.notFound('Exam session not found');
    }

    session.status = 'active';
    session.startTime = new Date();
    session.isMonitoringActive = true;
    session.lastActivity = new Date();
    await session.save();

    logger.info('Exam started', { sessionId });

    return {
      sessionId: session._id,
      startTime: session.startTime,
      socketEvent: 'exam_started',
      socketData: {
        sessionId: session._id,
        startTime: session.startTime,
        timeRemaining: Math.max(0, Math.floor((session.endTime - new Date()) / 1000))
      }
    };
  }

  /**
   * Handle AI update
   * @param {string} sessionId - Session ID
   * @param {Object} aiData - AI proctoring data
   * @returns {Promise<Object>} - Updated session data with socket event payload
   * @throws {AppError} - If validation fails
   */
  async handleAIUpdate(sessionId, aiData) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      throw AppError.notFound('Exam session not found');
    }

    // Update AI monitoring data
    if (!session.aiMonitoring) {
      session.aiMonitoring = {};
    }

    session.aiMonitoring = {
      ...session.aiMonitoring,
      ...aiData,
      lastUpdate: new Date()
    };

    session.lastActivity = new Date();
    await session.save();

    logger.debug('AI update processed', { sessionId, aiDataKeys: Object.keys(aiData) });

    return {
      sessionId: session._id,
      aiMonitoring: session.aiMonitoring,
      socketEvent: 'ai_update_processed',
      socketData: {
        sessionId: session._id,
        aiMonitoring: session.aiMonitoring
      }
    };
  }
}

module.exports = new ExamService();
