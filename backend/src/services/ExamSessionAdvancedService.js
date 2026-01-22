/**
 * ExamSessionAdvancedService
 * Service layer for advanced exam session operations
 * Handles analytics, monitoring, proctoring, and advanced business logic
 */

const ExamSessionAdvancedRepository = require('../repositories/ExamSessionAdvancedRepository');
const ExamSessionRepository = require('../repositories/ExamSessionRepository');
const AppError = require('../utils/AppError');

class ExamSessionAdvancedService {
  /**
   * Get active sessions for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of active exam sessions
   * @throws {AppError} - If validation fails
   */
  async getActiveSessions(organizationId) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    return await ExamSessionAdvancedRepository.findActiveSessions(organizationId);
  }

  /**
   * Get session by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Promise<Object>} - Exam session document
   * @throws {AppError} - If session not found
   */
  async getSessionBySocketId(socketId) {
    if (!socketId) {
      throw AppError.badRequest('Socket ID is required');
    }

    const session = await ExamSessionAdvancedRepository.findBySocketId(socketId);
    if (!session) {
      throw AppError.notFound('Session not found');
    }

    return session;
  }

  /**
   * Get session analytics
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Additional filters (date range, exam ID, etc.)
   * @returns {Promise<Object>} - Analytics data
   * @throws {AppError} - If validation fails
   */
  async getSessionAnalytics(organizationId, filters = {}) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    // Convert date strings to ObjectIds if needed
    const processedFilters = {};
    if (filters.examId) {
      processedFilters.examId = filters.examId;
    }
    if (filters.status) {
      processedFilters.status = filters.status;
    }
    if (filters.startDate && filters.endDate) {
      processedFilters.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const analytics = await ExamSessionAdvancedRepository.getSessionAnalytics(
      organizationId,
      processedFilters
    );

    return {
      ...analytics,
      organizationId,
      filters: processedFilters
    };
  }

  /**
   * Get security flags summary
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} - Security flags summary
   * @throws {AppError} - If validation fails
   */
  async getSecurityFlagsSummary(organizationId, filters = {}) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    return await ExamSessionAdvancedRepository.getSecurityFlagsSummary(organizationId, filters);
  }

  /**
   * Get sessions by date range
   * @param {string} organizationId - Organization ID
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Promise<Array>} - Array of exam sessions
   * @throws {AppError} - If validation fails
   */
  async getSessionsByDateRange(organizationId, startDate, endDate) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    if (!startDate || !endDate) {
      throw AppError.badRequest('Start date and end date are required');
    }

    return await ExamSessionAdvancedRepository.findByDateRange(
      organizationId,
      startDate,
      endDate
    );
  }

  /**
   * Get high-risk sessions
   * @param {string} organizationId - Organization ID
   * @param {number} threshold - Minimum number of security flags (default: 3)
   * @returns {Promise<Array>} - Array of high-risk sessions
   * @throws {AppError} - If validation fails
   */
  async getHighRiskSessions(organizationId, threshold = 3) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    if (threshold < 0) {
      throw AppError.badRequest('Threshold must be non-negative');
    }

    return await ExamSessionAdvancedRepository.findHighRiskSessions(organizationId, threshold);
  }

  /**
   * Get progress statistics for an exam
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} - Progress statistics
   * @throws {AppError} - If validation fails
   */
  async getProgressStatistics(examId) {
    if (!examId) {
      throw AppError.badRequest('Exam ID is required');
    }

    return await ExamSessionAdvancedRepository.getProgressStatistics(examId);
  }

  /**
   * Cleanup inactive sessions
   * @param {number} maxAgeMinutes - Maximum age in minutes (default: 30)
   * @returns {Promise<Object>} - Cleanup result
   * @throws {AppError} - If validation fails
   */
  async cleanupInactiveSessions(maxAgeMinutes = 30) {
    if (maxAgeMinutes < 0) {
      throw AppError.badRequest('Max age must be non-negative');
    }

    return await ExamSessionAdvancedRepository.cleanupInactiveSessions(maxAgeMinutes);
  }

  /**
   * Get sessions by status
   * @param {string} organizationId - Organization ID
   * @param {string} status - Session status
   * @returns {Promise<Array>} - Array of exam sessions
   * @throws {AppError} - If validation fails
   */
  async getSessionsByStatus(organizationId, status) {
    if (!organizationId) {
      throw AppError.badRequest('Organization ID is required');
    }

    if (!status) {
      throw AppError.badRequest('Status is required');
    }

    const validStatuses = ['waiting', 'active', 'paused', 'completed', 'terminated', 'disconnected'];
    if (!validStatuses.includes(status)) {
      throw AppError.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return await ExamSessionAdvancedRepository.findByStatus(organizationId, status);
  }

  /**
   * Get session monitoring data
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Monitoring data
   * @throws {AppError} - If session not found
   */
  async getSessionMonitoringData(sessionId) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSessionRepository.findById(sessionId, {
      populate: [
        { path: 'examId', select: 'title duration' },
        { path: 'studentId', select: 'profile.firstName profile.lastName email' }
      ]
    });

    if (!session) {
      throw AppError.notFound('Session not found');
    }

    return {
      sessionId: session._id,
      status: session.status,
      isMonitoringActive: session.isMonitoringActive,
      monitoringStartedAt: session.monitoringStartedAt,
      lastActivity: session.lastActivity,
      activityCount: session.activityCount,
      securityFlags: session.securityFlags || [],
      securityFlagsCount: session.securityFlags?.length || 0,
      deviceInfo: session.deviceInfo,
      networkInfo: session.networkInfo,
      progress: session.progress,
      timeRemaining: session.timeRemaining
    };
  }

  /**
   * Get comprehensive session report
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Comprehensive session report
   * @throws {AppError} - If session not found
   */
  async getSessionReport(sessionId) {
    if (!sessionId) {
      throw AppError.badRequest('Session ID is required');
    }

    const session = await ExamSessionRepository.findById(sessionId, {
      populate: [
        { path: 'examId', select: 'title subject class duration' },
        { path: 'studentId', select: 'profile.firstName profile.lastName email' },
        { path: 'organizationId', select: 'name code' }
      ]
    });

    if (!session) {
      throw AppError.notFound('Session not found');
    }

    // Calculate time statistics
    let timeStats = null;
    if (session.startTime && session.endTime) {
      const duration = session.endTime - session.startTime;
      timeStats = {
        startTime: session.startTime,
        endTime: session.endTime,
        duration: {
          milliseconds: duration,
          seconds: Math.floor(duration / 1000),
          minutes: Math.floor(duration / 60000),
          hours: Math.floor(duration / 3600000)
        },
        totalTimeSpent: session.completionInfo?.totalTimeSpent || null
      };
    }

    return {
      sessionId: session._id,
      exam: session.examId,
      student: session.studentId,
      organization: session.organizationId,
      status: session.status,
      timeStats,
      progress: session.progress,
      securityFlags: session.securityFlags || [],
      securityFlagsCount: session.securityFlags?.length || 0,
      completionInfo: session.completionInfo,
      deviceInfo: session.deviceInfo,
      networkInfo: session.networkInfo,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }
}

module.exports = new ExamSessionAdvancedService();






