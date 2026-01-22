/**
 * ExamSessionService
 * Service layer for exam session operations
 * Handles exam session lifecycle and management
 */

const ExamSessionRepository = require('../repositories/ExamSessionRepository');
const ExamRepository = require('../repositories/ExamRepository');
const UserRepository = require('../repositories/UserRepository');
const OrganizationRepository = require('../repositories/OrganizationRepository');
const AppError = require('../utils/AppError');

class ExamSessionService {
  /**
   * Start an exam session
   * @param {string} examId - Exam ID
   * @param {string} studentId - Student ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Created exam session
   * @throws {AppError} - If validation fails
   */
  async startSession(examId, studentId, organizationId) {
    // Input validation
    if (!examId || !studentId || !organizationId) {
      throw AppError.badRequest('Exam ID, student ID, and organization ID are required');
    }

    // Verify exam exists
    const exam = await ExamRepository.findById(examId);
    if (!exam) {
      throw AppError.notFound('Exam not found');
    }

    // Verify organization matches
    if (exam.organizationId?.toString() !== organizationId.toString()) {
      throw AppError.forbidden('Exam does not belong to this organization');
    }

    // Verify student exists
    const student = await UserRepository.findById(studentId);
    if (!student) {
      throw AppError.notFound('Student not found');
    }

    // Check if session already exists
    const existingSession = await ExamSessionRepository.findOne({
      examId,
      studentId,
      organizationId
    });

    if (existingSession) {
      // If session exists and is active, return it
      if (existingSession.status === 'active' || existingSession.status === 'waiting') {
        return existingSession;
      }
      // If session is completed, create a new one
    }

    // Create new session
    const sessionData = {
      examId,
      studentId,
      organizationId,
      status: 'waiting',
      duration: exam.duration,
      startTime: null,
      endTime: null,
      timeRemaining: exam.duration * 60, // Convert minutes to seconds
      isMonitoringActive: false
    };

    const session = await ExamSessionRepository.create(sessionData);

    return session;
  }

  /**
   * Get exam session
   * @param {string} sessionId - Session ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Exam session document
   * @throws {AppError} - If session not found or unauthorized
   */
  async getSession(sessionId, organizationId = null) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSessionRepository.findById(sessionId, {
      populate: ['examId', 'studentId', 'organizationId']
    });

    if (!session) {
      throw AppError.notFound('Exam session not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (session.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Session does not belong to this organization');
      }
    }

    return session;
  }

  /**
   * Update exam session
   * @param {string} sessionId - Session ID
   * @param {Object} updateData - Update data
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Updated exam session
   * @throws {AppError} - If session not found or unauthorized
   */
  async updateSession(sessionId, updateData, organizationId = null) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    // Get existing session
    const existingSession = await ExamSessionRepository.findById(sessionId);
    if (!existingSession) {
      throw AppError.notFound('Exam session not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingSession.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Session does not belong to this organization');
      }
    }

    // Prevent organizationId changes
    if (updateData.organizationId) {
      delete updateData.organizationId;
    }

    // Update session
    const updatedSession = await ExamSessionRepository.updateById(sessionId, updateData);

    if (!updatedSession) {
      throw AppError.notFound('Exam session not found after update');
    }

    return updatedSession;
  }

  /**
   * End exam session
   * @param {string} sessionId - Session ID
   * @param {string} organizationId - Organization ID (for authorization)
   * @returns {Promise<Object>} - Updated exam session
   * @throws {AppError} - If session not found or unauthorized
   */
  async endSession(sessionId, organizationId = null) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    // Get existing session
    const existingSession = await ExamSessionRepository.findById(sessionId);
    if (!existingSession) {
      throw AppError.notFound('Exam session not found');
    }

    // Organization scoping check
    if (organizationId) {
      if (existingSession.organizationId?.toString() !== organizationId.toString()) {
        throw AppError.forbidden('Access denied: Session does not belong to this organization');
      }
    }

    // Update session to completed
    const updateData = {
      status: 'completed',
      endTime: new Date(),
      timeRemaining: 0,
      isMonitoringActive: false
    };

    // Set start time if not already set
    if (!existingSession.startTime) {
      updateData.startTime = new Date();
    }

    const updatedSession = await ExamSessionRepository.updateById(sessionId, updateData);

    if (!updatedSession) {
      throw AppError.notFound('Exam session not found after update');
    }

    return updatedSession;
  }
}

module.exports = new ExamSessionService();
