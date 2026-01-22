/**
 * ExamSessionAdvancedRepository
 * Repository layer for advanced exam session operations
 * Handles analytics, monitoring, and advanced queries
 */

const ExamSession = require('../models/ExamSession');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

class ExamSessionAdvancedRepository {
  /**
   * Find active sessions by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Array>} - Array of active exam sessions
   */
  async findActiveSessions(organizationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      return await ExamSession.find({
        organizationId,
        status: { $in: ['waiting', 'active', 'paused'] }
      })
        .populate('examId', 'title subject class duration')
        .populate('studentId', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find active sessions: ${error.message}`);
    }
  }

  /**
   * Find session by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Promise<Object|null>} - Exam session document or null
   */
  async findBySocketId(socketId) {
    try {
      if (!socketId) {
        throw AppError.badRequest('Socket ID is required');
      }

      return await ExamSession.findOne({ socketId }).exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find session by socket ID: ${error.message}`);
    }
  }

  /**
   * Get session analytics
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Analytics data
   */
  async getSessionAnalytics(organizationId, filters = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      const matchFilter = {
        organizationId: mongoose.Types.ObjectId(organizationId),
        ...filters
      };

      const analytics = await ExamSession.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            activeSessions: {
              $sum: { $cond: [{ $in: ['$status', ['waiting', 'active', 'paused']] }, 1, 0] }
            },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            terminatedSessions: {
              $sum: { $cond: [{ $eq: ['$status', 'terminated'] }, 1, 0] }
            },
            averageTimeSpent: {
              $avg: '$completionInfo.totalTimeSpent'
            },
            averageScore: {
              $avg: '$completionInfo.finalScore'
            }
          }
        }
      ]);

      return analytics[0] || {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        terminatedSessions: 0,
        averageTimeSpent: 0,
        averageScore: 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get session analytics: ${error.message}`);
    }
  }

  /**
   * Get security flags summary
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - Security flags summary
   */
  async getSecurityFlagsSummary(organizationId, filters = {}) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      const matchFilter = {
        organizationId: mongoose.Types.ObjectId(organizationId),
        ...filters
      };

      const summary = await ExamSession.aggregate([
        { $match: matchFilter },
        { $unwind: { path: '$securityFlags', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$securityFlags.type',
            count: { $sum: 1 },
            critical: {
              $sum: { $cond: [{ $eq: ['$securityFlags.severity', 'critical'] }, 1, 0] }
            },
            high: {
              $sum: { $cond: [{ $eq: ['$securityFlags.severity', 'high'] }, 1, 0] }
            },
            medium: {
              $sum: { $cond: [{ $eq: ['$securityFlags.severity', 'medium'] }, 1, 0] }
            },
            low: {
              $sum: { $cond: [{ $eq: ['$securityFlags.severity', 'low'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return summary;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get security flags summary: ${error.message}`);
    }
  }

  /**
   * Get sessions by date range
   * @param {string} organizationId - Organization ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} - Array of exam sessions
   */
  async findByDateRange(organizationId, startDate, endDate) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      if (!startDate || !endDate) {
        throw AppError.badRequest('Start date and end date are required');
      }

      return await ExamSession.find({
        organizationId,
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
        .populate('examId', 'title subject')
        .populate('studentId', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find sessions by date range: ${error.message}`);
    }
  }

  /**
   * Get sessions with high security risk
   * @param {string} organizationId - Organization ID
   * @param {number} threshold - Minimum number of security flags
   * @returns {Promise<Array>} - Array of high-risk sessions
   */
  async findHighRiskSessions(organizationId, threshold = 3) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      return await ExamSession.find({
        organizationId,
        $expr: {
          $gte: [{ $size: { $ifNull: ['$securityFlags', []] } }, threshold]
        }
      })
        .populate('examId', 'title')
        .populate('studentId', 'profile.firstName profile.lastName email')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find high-risk sessions: ${error.message}`);
    }
  }

  /**
   * Get session progress statistics
   * @param {string} examId - Exam ID
   * @returns {Promise<Object>} - Progress statistics
   */
  async getProgressStatistics(examId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(examId)) {
        throw AppError.badRequest('Invalid exam ID format');
      }

      const stats = await ExamSession.aggregate([
        { $match: { examId: mongoose.Types.ObjectId(examId) } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            averageProgress: {
              $avg: {
                $cond: [
                  { $gt: ['$progress.totalQuestions', 0] },
                  {
                    $multiply: [
                      { $divide: ['$progress.answeredQuestions', '$progress.totalQuestions'] },
                      100
                    ]
                  },
                  0
                ]
              }
            },
            averageTimeSpent: {
              $avg: '$completionInfo.totalTimeSpent'
            },
            completionRate: {
              $avg: {
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return stats[0] || {
        totalSessions: 0,
        averageProgress: 0,
        averageTimeSpent: 0,
        completionRate: 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get progress statistics: ${error.message}`);
    }
  }

  /**
   * Cleanup inactive sessions
   * @param {number} maxAgeMinutes - Maximum age in minutes (default: 30)
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupInactiveSessions(maxAgeMinutes = 30) {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

      const result = await ExamSession.updateMany(
        {
          status: { $in: ['waiting', 'active', 'paused'] },
          lastActivity: { $lt: cutoffTime }
        },
        {
          $set: {
            status: 'terminated',
            endTime: new Date(),
            'completionInfo.submissionType': 'timeout'
          }
        }
      );

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount
      };
    } catch (error) {
      throw AppError.internal(`Failed to cleanup inactive sessions: ${error.message}`);
    }
  }

  /**
   * Get sessions by status
   * @param {string} organizationId - Organization ID
   * @param {string} status - Session status
   * @returns {Promise<Array>} - Array of exam sessions
   */
  async findByStatus(organizationId, status) {
    try {
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        throw AppError.badRequest('Invalid organization ID format');
      }

      if (!status) {
        throw AppError.badRequest('Status is required');
      }

      return await ExamSession.find({
        organizationId,
        status
      })
        .populate('examId', 'title subject')
        .populate('studentId', 'profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to find sessions by status: ${error.message}`);
    }
  }

  /**
   * Count sessions by filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<number>} - Count of matching sessions
   */
  async count(filter = {}) {
    try {
      return await ExamSession.countDocuments(filter);
    } catch (error) {
      throw AppError.internal(`Failed to count sessions: ${error.message}`);
    }
  }
}

module.exports = new ExamSessionAdvancedRepository();






