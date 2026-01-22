/**
 * TimeRepository
 * Repository layer for time-related data access
 * Handles timezone and time calculation operations
 */

const AppError = require('../utils/AppError');

class TimeRepository {
  /**
   * Get current server time
   * @returns {Object} - Current server time information
   */
  getServerTime() {
    try {
      const now = new Date();
      return {
        timestamp: now.getTime(),
        iso: now.toISOString(),
        utc: now.toUTCString(),
        local: now.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: now.getTimezoneOffset()
      };
    } catch (error) {
      throw AppError.internal(`Failed to get server time: ${error.message}`);
    }
  }

  /**
   * Convert timestamp to different timezone
   * @param {number|Date} timestamp - Timestamp or Date object
   * @param {string} timezone - Target timezone (e.g., 'Asia/Kolkata', 'America/New_York')
   * @returns {Object} - Converted time information
   */
  convertToTimezone(timestamp, timezone) {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
      if (!timezone) {
        throw AppError.badRequest('Timezone is required');
      }

      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const parts = formatter.formatToParts(date);
      const formatted = {
        year: parts.find(p => p.type === 'year').value,
        month: parts.find(p => p.type === 'month').value,
        day: parts.find(p => p.type === 'day').value,
        hour: parts.find(p => p.type === 'hour').value,
        minute: parts.find(p => p.type === 'minute').value,
        second: parts.find(p => p.type === 'second').value
      };

      return {
        timestamp: date.getTime(),
        iso: date.toISOString(),
        timezone,
        formatted: `${formatted.year}-${formatted.month}-${formatted.day} ${formatted.hour}:${formatted.minute}:${formatted.second}`,
        date: new Date(date.toLocaleString('en-US', { timeZone: timezone }))
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to convert timezone: ${error.message}`);
    }
  }

  /**
   * Calculate time difference between two timestamps
   * @param {number|Date} startTime - Start timestamp or Date
   * @param {number|Date} endTime - End timestamp or Date
   * @returns {Object} - Time difference in various units
   */
  calculateTimeDifference(startTime, endTime) {
    try {
      const start = startTime instanceof Date ? startTime.getTime() : startTime;
      const end = endTime instanceof Date ? endTime.getTime() : endTime;

      if (!start || !end) {
        throw AppError.badRequest('Start time and end time are required');
      }

      const diff = Math.abs(end - start);

      return {
        milliseconds: diff,
        seconds: Math.floor(diff / 1000),
        minutes: Math.floor(diff / 60000),
        hours: Math.floor(diff / 3600000),
        days: Math.floor(diff / 86400000),
        weeks: Math.floor(diff / 604800000),
        months: Math.floor(diff / 2592000000),
        years: Math.floor(diff / 31536000000),
        humanized: this.humanizeDuration(diff)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to calculate time difference: ${error.message}`);
    }
  }

  /**
   * Humanize duration in milliseconds
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} - Humanized duration string
   */
  humanizeDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }

  /**
   * Add time to a date
   * @param {number|Date} date - Base date or timestamp
   * @param {Object} duration - Duration object {years, months, days, hours, minutes, seconds, milliseconds}
   * @returns {Date} - New date with added time
   */
  addTime(date, duration) {
    try {
      const baseDate = date instanceof Date ? new Date(date) : new Date(date);
      
      if (!duration || typeof duration !== 'object') {
        throw AppError.badRequest('Duration object is required');
      }

      const result = new Date(baseDate);

      if (duration.years) result.setFullYear(result.getFullYear() + duration.years);
      if (duration.months) result.setMonth(result.getMonth() + duration.months);
      if (duration.days) result.setDate(result.getDate() + duration.days);
      if (duration.hours) result.setHours(result.getHours() + duration.hours);
      if (duration.minutes) result.setMinutes(result.getMinutes() + duration.minutes);
      if (duration.seconds) result.setSeconds(result.getSeconds() + duration.seconds);
      if (duration.milliseconds) result.setMilliseconds(result.getMilliseconds() + duration.milliseconds);

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to add time: ${error.message}`);
    }
  }

  /**
   * Check if a date is in the past
   * @param {number|Date} date - Date to check
   * @returns {boolean} - True if date is in the past
   */
  isPast(date) {
    try {
      const checkDate = date instanceof Date ? date : new Date(date);
      return checkDate.getTime() < Date.now();
    } catch (error) {
      throw AppError.internal(`Failed to check if date is past: ${error.message}`);
    }
  }

  /**
   * Check if a date is in the future
   * @param {number|Date} date - Date to check
   * @returns {boolean} - True if date is in the future
   */
  isFuture(date) {
    try {
      const checkDate = date instanceof Date ? date : new Date(date);
      return checkDate.getTime() > Date.now();
    } catch (error) {
      throw AppError.internal(`Failed to check if date is future: ${error.message}`);
    }
  }

  /**
   * Get timezone information
   * @param {string} timezone - Timezone identifier (optional, defaults to server timezone)
   * @returns {Object} - Timezone information
   */
  getTimezoneInfo(timezone = null) {
    try {
      const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'long'
      });

      return {
        timezone: tz,
        offset: now.getTimezoneOffset(),
        name: formatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value || tz,
        abbreviation: this.getTimezoneAbbreviation(tz, now)
      };
    } catch (error) {
      throw AppError.internal(`Failed to get timezone info: ${error.message}`);
    }
  }

  /**
   * Get timezone abbreviation
   * @param {string} timezone - Timezone identifier
   * @param {Date} date - Date to check
   * @returns {string} - Timezone abbreviation
   */
  getTimezoneAbbreviation(timezone, date = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      return formatter.formatToParts(date).find(p => p.type === 'timeZoneName')?.value || '';
    } catch (error) {
      return '';
    }
  }
}

module.exports = new TimeRepository();






