/**
 * Time Controller
 * Handles time synchronization and exam countdown endpoints
 */

const TimeService = require('../services/TimeService');
const ExamService = require('../services/ExamService');
const asyncWrapper = require('../middleware/asyncWrapper');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/**
 * Get current server time
 * Used for client-server time synchronization
 */
const getServerTime = asyncWrapper(async (req, res) => {
  const serverTime = TimeService.getServerTime();

  return sendSuccess(res, {
    timestamp: serverTime.iso,
    unix: serverTime.timestamp,
    timezone: serverTime.timezone
  }, 'OK', 200);
});

/**
 * Get exam countdown information
 * Returns time remaining, exam status, and timing details
 */
const getExamCountdown = asyncWrapper(async (req, res) => {
  const { examId } = req.params;

  // Validate examId format
  if (!examId || !examId.match(/^[0-9a-fA-F]{24}$/)) {
    throw AppError.badRequest('Invalid exam ID format');
  }

  const exam = await ExamService.getExamById(examId);

  if (!exam) {
    throw AppError.notFound('Exam not found');
  }

  const now = new Date();
  let scheduledDateTime;

  // Parse exam start time
  if (exam.scheduledDate instanceof Date) {
    scheduledDateTime = new Date(exam.scheduledDate);
    const [hours, minutes] = exam.startTime.split(':');
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  } else if (typeof exam.scheduledDate === 'string') {
    let datePart;
    if (exam.scheduledDate.includes('T')) {
      datePart = exam.scheduledDate.split('T')[0];
    } else {
      datePart = exam.scheduledDate;
    }
    scheduledDateTime = new Date(`${datePart}T${exam.startTime}:00`);
  }

  const examEndTime = new Date(scheduledDateTime.getTime() + exam.duration * 60 * 1000);

  let timeRemaining = 0;
  let examStatus = 'waiting';

  if (now >= scheduledDateTime && now < examEndTime) {
    // Exam is active
    timeRemaining = Math.max(0, Math.floor((examEndTime.getTime() - now.getTime()) / 1000));
    examStatus = 'active';
  } else if (now < scheduledDateTime) {
    // Exam hasn't started yet
    const timeUntilStart = Math.floor((scheduledDateTime.getTime() - now.getTime()) / 1000);
    timeRemaining = timeUntilStart;
    examStatus = 'scheduled';
  } else {
    // Exam has ended
    timeRemaining = 0;
    examStatus = 'ended';
  }

  return sendSuccess(res, {
    examId,
    timeRemaining,
    examStatus,
    examStartTime: scheduledDateTime.toISOString(),
    examEndTime: examEndTime.toISOString(),
    serverTime: now.toISOString(),
    duration: exam.duration
  }, 'OK', 200);
});

module.exports = {
  getServerTime,
  getExamCountdown
};
