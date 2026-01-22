/**
 * Exam Session Advanced Controller
 * Handles advanced exam session operations: analytics, monitoring, proctoring
 */

const ExamSessionAdvancedService = require('../services/ExamSessionAdvancedService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/**
 * Get active exam sessions for an organization
 */
const getActiveSessions = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const sessions = await ExamSessionAdvancedService.getActiveSessions(organizationId);

  return sendSuccess(res, sessions, 'OK', 200);
});

/**
 * Get session by socket ID
 */
const getSessionBySocketId = asyncWrapper(async (req, res) => {
  const { socketId } = req.params;

  const session = await ExamSessionAdvancedService.getSessionBySocketId(socketId);

  return sendSuccess(res, session, 'OK', 200);
});

/**
 * Get session analytics
 */
const getSessionAnalytics = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const filters = {
    examId: req.query.examId,
    status: req.query.status,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const analytics = await ExamSessionAdvancedService.getSessionAnalytics(organizationId, filters);

  return sendSuccess(res, analytics, 'OK', 200);
});

/**
 * Get security flags summary
 */
const getSecurityFlagsSummary = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const filters = {
    examId: req.query.examId,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const summary = await ExamSessionAdvancedService.getSecurityFlagsSummary(organizationId, filters);

  return sendSuccess(res, summary, 'OK', 200);
});

/**
 * Get sessions by date range
 */
const getSessionsByDateRange = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;
  const { startDate, endDate } = req.query;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  if (!startDate || !endDate) {
    throw AppError.badRequest('Start date and end date are required');
  }

  const sessions = await ExamSessionAdvancedService.getSessionsByDateRange(
    organizationId,
    startDate,
    endDate
  );

  return sendSuccess(res, sessions, 'OK', 200);
});

/**
 * Get high-risk sessions
 */
const getHighRiskSessions = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;
  const threshold = parseInt(req.query.threshold) || 3;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const sessions = await ExamSessionAdvancedService.getHighRiskSessions(organizationId, threshold);

  return sendSuccess(res, sessions, 'OK', 200);
});

/**
 * Get progress statistics for an exam
 */
const getProgressStatistics = asyncWrapper(async (req, res) => {
  const { examId } = req.params;

  const stats = await ExamSessionAdvancedService.getProgressStatistics(examId);

  return sendSuccess(res, stats, 'OK', 200);
});

/**
 * Cleanup inactive sessions
 */
const cleanupInactiveSessions = asyncWrapper(async (req, res) => {
  const maxAgeMinutes = parseInt(req.query.maxAgeMinutes) || 30;

  const result = await ExamSessionAdvancedService.cleanupInactiveSessions(maxAgeMinutes);

  return sendSuccess(res, result, 'Inactive sessions cleaned up successfully', 200);
});

/**
 * Get sessions by status
 */
const getSessionsByStatus = asyncWrapper(async (req, res) => {
  const organizationId = req.user.organizationId || req.params.organizationId;
  const { status } = req.params;

  if (!organizationId) {
    throw AppError.badRequest('Organization ID is required');
  }

  const sessions = await ExamSessionAdvancedService.getSessionsByStatus(organizationId, status);

  return sendSuccess(res, sessions, 'OK', 200);
});

/**
 * Get session monitoring data
 */
const getSessionMonitoringData = asyncWrapper(async (req, res) => {
  const { sessionId } = req.params;

  const monitoringData = await ExamSessionAdvancedService.getSessionMonitoringData(sessionId);

  return sendSuccess(res, monitoringData, 'OK', 200);
});

/**
 * Get comprehensive session report
 */
const getSessionReport = asyncWrapper(async (req, res) => {
  const { sessionId } = req.params;

  const report = await ExamSessionAdvancedService.getSessionReport(sessionId);

  return sendSuccess(res, report, 'OK', 200);
});

module.exports = {
  getActiveSessions,
  getSessionBySocketId,
  getSessionAnalytics,
  getSecurityFlagsSummary,
  getSessionsByDateRange,
  getHighRiskSessions,
  getProgressStatistics,
  cleanupInactiveSessions,
  getSessionsByStatus,
  getSessionMonitoringData,
  getSessionReport
};






