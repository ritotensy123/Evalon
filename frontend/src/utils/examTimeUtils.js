// Utility functions for exam time management

/**
 * Check if exam can be started (within 5 minutes of scheduled time)
 * @param {Object} exam - Exam object with scheduledDate and startTime
 * @returns {boolean} - True if exam can be started
 */
export const canStartExam = (exam) => {
  if (exam.status !== 'scheduled') return false;
  
  // Validate required fields
  if (!exam.scheduledDate || !exam.startTime) {
    return false;
  }
  
  const now = new Date();
  
  // Handle different date formats - extract just the date part
  let scheduledDateStr;
  if (exam.scheduledDate instanceof Date) {
    scheduledDateStr = exam.scheduledDate.toISOString().split('T')[0];
  } else if (typeof exam.scheduledDate === 'string') {
    if (exam.scheduledDate.includes('T')) {
      scheduledDateStr = exam.scheduledDate.split('T')[0];
    } else {
      scheduledDateStr = exam.scheduledDate;
    }
  } else {
    return false;
  }
  
  // Create the scheduled date time
  const scheduledDateTime = new Date(`${scheduledDateStr}T${exam.startTime}`);
  
  // Check if the date is valid
  if (isNaN(scheduledDateTime.getTime())) {
    return false;
  }
  
  const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
  
  // Can start if current time is 5 minutes before scheduled time or later
  return now >= fiveMinutesBefore;
};

/**
 * Get time until exam can be started
 * @param {Object} exam - Exam object with scheduledDate and startTime
 * @returns {string|null} - Time remaining or null if can start now
 */
export const getTimeUntilStartable = (exam) => {
  // Validate required fields
  if (!exam.scheduledDate || !exam.startTime) {
    return null;
  }
  
  const now = new Date();
  
  // Handle different date formats - extract just the date part
  let scheduledDateStr;
  if (exam.scheduledDate instanceof Date) {
    scheduledDateStr = exam.scheduledDate.toISOString().split('T')[0];
  } else if (typeof exam.scheduledDate === 'string') {
    if (exam.scheduledDate.includes('T')) {
      scheduledDateStr = exam.scheduledDate.split('T')[0];
    } else {
      scheduledDateStr = exam.scheduledDate;
    }
  } else {
    return null;
  }
  
  // Create the scheduled date time
  const scheduledDateTime = new Date(`${scheduledDateStr}T${exam.startTime}`);
  
  // Check if the date is valid
  if (isNaN(scheduledDateTime.getTime())) {
    return null;
  }
  
  const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
  
  // If we're already past the 5-minute mark, return null (can start now)
  if (now >= fiveMinutesBefore) {
    return null;
  }
  
  // If we're before the 5-minute mark, show countdown
  const diffMs = fiveMinutesBefore.getTime() - now.getTime();
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  return `${diffMinutes} minutes`;
};

/**
 * Get exam status based on current time (simplified)
 * @param {Object} exam - Exam object with scheduledDate and startTime
 * @returns {string} - Status: 'upcoming', 'startable', 'active', 'ended'
 */
export const getExamTimeStatus = (exam) => {
  // Validate required fields
  if (!exam.scheduledDate || !exam.startTime) {
    return 'upcoming';
  }
  
  // Simplified logic - if scheduled, it's startable
  if (exam.status === 'scheduled') {
    return 'startable';
  }
  
  return 'upcoming';
};

/**
 * Format time remaining for display
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTimeRemaining = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get color class for time remaining
 * @param {number} seconds - Time in seconds
 * @returns {string} - Tailwind color class
 */
export const getTimeColor = (seconds) => {
  if (seconds < 300) return 'text-red-600'; // Less than 5 minutes
  if (seconds < 900) return 'text-yellow-600'; // Less than 15 minutes
  return 'text-green-600';
};
