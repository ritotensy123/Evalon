/**
 * TeacherDashboardController
 * HTTP request/response handling for teacher dashboard operations
 * All business logic is delegated to TeacherDashboardService
 */

const TeacherDashboardService = require('../services/TeacherDashboardService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');
const { HTTP_STATUS } = require('../constants');

/**
 * Get dashboard statistics for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/stats
 */
const getDashboardStats = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const stats = await TeacherDashboardService.getDashboardStats(teacherId);

  return sendSuccess(res, stats, 'Dashboard statistics retrieved successfully', HTTP_STATUS.OK);
});

/**
 * Get recent exams for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/exams/recent
 */
const getRecentExams = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;
  const { limit, status } = req.query;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const exams = await TeacherDashboardService.getRecentExams(teacherId, {
    limit: limit ? parseInt(limit) : 5,
    status
  });

  return sendSuccess(
    res,
    { exams, total: exams.length },
    'Recent exams retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get recent question banks for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/question-banks/recent
 */
const getRecentQuestionBanks = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;
  const { limit } = req.query;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const questionBanks = await TeacherDashboardService.getRecentQuestionBanks(teacherId, {
    limit: limit ? parseInt(limit) : 5
  });

  return sendSuccess(
    res,
    { questionBanks, total: questionBanks.length },
    'Recent question banks retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get recent classes for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/classes/recent
 */
const getRecentClasses = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;
  const { limit } = req.query;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const classes = await TeacherDashboardService.getRecentClasses(teacherId, {
    limit: limit ? parseInt(limit) : 5
  });

  return sendSuccess(
    res,
    { classes, total: classes.length },
    'Recent classes retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get recent assignments for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/assignments/recent
 */
const getRecentAssignments = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;
  const { limit, status } = req.query;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const assignments = await TeacherDashboardService.getRecentAssignments(teacherId, {
    limit: limit ? parseInt(limit) : 5,
    status
  });

  return sendSuccess(
    res,
    { assignments, total: assignments.length },
    'Recent assignments retrieved successfully',
    HTTP_STATUS.OK
  );
});

/**
 * Get navigation counts for standalone teacher
 * GET /api/teachers/:teacherId/dashboard/navigation-counts
 */
const getNavigationCounts = asyncWrapper(async (req, res) => {
  const { teacherId } = req.params;
  const authenticatedUserId = req.user.id;
  const authenticatedTeacherId = req.user.userId;
  const organizationId = req.user.organizationId;

  // Authorization: Reject if organizationId is not null
  if (organizationId !== null && organizationId !== undefined) {
    throw AppError.forbidden('This endpoint is only for standalone teachers');
  }

  // Authorization: Validate teacher ID matches authenticated user
  TeacherDashboardService.validateTeacherAccess(
    teacherId,
    authenticatedUserId,
    authenticatedTeacherId
  );

  const counts = await TeacherDashboardService.getNavigationCounts(teacherId);

  return sendSuccess(
    res,
    counts,
    'Navigation counts retrieved successfully',
    HTTP_STATUS.OK
  );
});

module.exports = {
  getDashboardStats,
  getRecentExams,
  getRecentQuestionBanks,
  getRecentClasses,
  getRecentAssignments,
  getNavigationCounts
};



