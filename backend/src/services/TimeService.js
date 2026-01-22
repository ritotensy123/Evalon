/**
 * TimeService
 * Service layer for time operations
 * Handles time calculations, timezone conversions, and time-related business logic
 */

const TimeRepository = require('../repositories/TimeRepository');
const AppError = require('../utils/AppError');

class TimeService {
  /**
   * Get current server time
   * @returns {Object} - Current server time information
   */
  getServerTime() {
    return TimeRepository.getServerTime();
  }

  /**
   * Convert timestamp to different timezone
   * @param {number|Date} timestamp - Timestamp or Date object
   * @param {string} timezone - Target timezone
   * @returns {Object} - Converted time information
   * @throws {AppError} - If validation fails
   */
  convertToTimezone(timestamp, timezone) {
    if (!timestamp) {
      throw AppError.badRequest('Timestamp is required');
    }

    return TimeRepository.convertToTimezone(timestamp, timezone);
  }

  /**
   * Calculate time difference between two timestamps
   * @param {number|Date} startTime - Start timestamp or Date
   * @param {number|Date} endTime - End timestamp or Date
   * @returns {Object} - Time difference in various units
   * @throws {AppError} - If validation fails
   */
  calculateTimeDifference(startTime, endTime) {
    return TimeRepository.calculateTimeDifference(startTime, endTime);
  }

  /**
   * Add time to a date
   * @param {number|Date} date - Base date or timestamp
   * @param {Object} duration - Duration object
   * @returns {Date} - New date with added time
   * @throws {AppError} - If validation fails
   */
  addTime(date, duration) {
    if (!date) {
      throw AppError.badRequest('Date is required');
    }

    return TimeRepository.addTime(date, duration);
  }

  /**
   * Check if a date is in the past
   * @param {number|Date} date - Date to check
   * @returns {boolean} - True if date is in the past
   */
  isPast(date) {
    if (!date) {
      throw AppError.badRequest('Date is required');
    }

    return TimeRepository.isPast(date);
  }

  /**
   * Check if a date is in the future
   * @param {number|Date} date - Date to check
   * @returns {boolean} - True if date is in the future
   */
  isFuture(date) {
    if (!date) {
      throw AppError.badRequest('Date is required');
    }

    return TimeRepository.isFuture(date);
  }

  /**
   * Get timezone information
   * @param {string} timezone - Timezone identifier (optional)
   * @returns {Object} - Timezone information
   */
  getTimezoneInfo(timezone = null) {
    return TimeRepository.getTimezoneInfo(timezone);
  }

  /**
   * Calculate exam duration remaining
   * @param {Date} startTime - Exam start time
   * @param {number} durationMinutes - Exam duration in minutes
   * @returns {Object} - Remaining time information
   * @throws {AppError} - If validation fails
   */
  calculateExamTimeRemaining(startTime, durationMinutes) {
    if (!startTime) {
      throw AppError.badRequest('Start time is required');
    }

    if (!durationMinutes || durationMinutes <= 0) {
      throw AppError.badRequest('Duration in minutes is required and must be positive');
    }

    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end = TimeRepository.addTime(start, { minutes: durationMinutes });
    const now = new Date();

    if (now > end) {
      return {
        remaining: 0,
        expired: true,
        timeRemaining: {
          milliseconds: 0,
          seconds: 0,
          minutes: 0,
          hours: 0
        },
        endTime: end
      };
    }

    const diff = TimeRepository.calculateTimeDifference(now, end);

    return {
      remaining: diff.milliseconds,
      expired: false,
      timeRemaining: {
        milliseconds: diff.milliseconds,
        seconds: diff.seconds,
        minutes: diff.minutes,
        hours: diff.hours
      },
      endTime: end,
      humanized: diff.humanized
    };
  }

  /**
   * Format date for display
   * @param {number|Date} date - Date to format
   * @param {string} format - Format string (optional)
   * @param {string} timezone - Timezone (optional)
   * @returns {string} - Formatted date string
   */
  formatDate(date, format = 'iso', timezone = null) {
    if (!date) {
      throw AppError.badRequest('Date is required');
    }

    const dateObj = date instanceof Date ? date : new Date(date);

    switch (format) {
      case 'iso':
        return dateObj.toISOString();
      case 'utc':
        return dateObj.toUTCString();
      case 'local':
        return dateObj.toString();
      case 'date':
        return dateObj.toDateString();
      case 'time':
        return dateObj.toTimeString();
      default:
        if (timezone) {
          const converted = TimeRepository.convertToTimezone(dateObj, timezone);
          return converted.formatted;
        }
        return dateObj.toISOString();
    }
  }

  /**
   * Get current timestamp
   * @returns {number} - Current timestamp in milliseconds
   */
  getCurrentTimestamp() {
    return Date.now();
  }

  /**
   * Validate date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Object} - Validation result
   */
  validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
      throw AppError.badRequest('Start date and end date are required');
    }

    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw AppError.badRequest('Invalid date format');
    }

    const isValid = start <= end;
    const duration = isValid ? TimeRepository.calculateTimeDifference(start, end) : null;

    return {
      valid: isValid,
      error: isValid ? null : 'Start date must be before or equal to end date',
      duration
    };
  }
}

module.exports = new TimeService();






