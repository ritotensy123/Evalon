import { API_ENDPOINTS } from '../config/apiConfig';
import { createAxiosInstance } from '../utils/axiosConfig';

// Create axios instance for teacher dashboard API
const teacherDashboardApiInstance = createAxiosInstance(
  { baseURL: API_ENDPOINTS.TEACHERS },
  { apiName: 'Teacher Dashboard API', enableRetry: true, enableLogging: true }
);

/**
 * Teacher Dashboard API
 * All endpoints are for standalone teachers only
 */
export const teacherDashboardAPI = {
  /**
   * Get dashboard statistics
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Dashboard statistics
   */
  getStats: async (teacherId) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
    }
  },

  /**
   * Get recent exams
   * @param {string} teacherId - Teacher ID
   * @param {Object} params - Query parameters (limit, status)
   * @returns {Promise<Object>} Recent exams
   */
  getRecentExams: async (teacherId, params = {}) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/exams/recent`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent exams' };
    }
  },

  /**
   * Get recent question banks
   * @param {string} teacherId - Teacher ID
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise<Object>} Recent question banks
   */
  getRecentQuestionBanks: async (teacherId, params = {}) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/question-banks/recent`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent question banks' };
    }
  },

  /**
   * Get recent classes
   * @param {string} teacherId - Teacher ID
   * @param {Object} params - Query parameters (limit)
   * @returns {Promise<Object>} Recent classes
   */
  getRecentClasses: async (teacherId, params = {}) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/classes/recent`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent classes' };
    }
  },

  /**
   * Get recent assignments
   * @param {string} teacherId - Teacher ID
   * @param {Object} params - Query parameters (limit, status)
   * @returns {Promise<Object>} Recent assignments
   */
  getRecentAssignments: async (teacherId, params = {}) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/assignments/recent`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent assignments' };
    }
  },

  /**
   * Get navigation counts
   * @param {string} teacherId - Teacher ID
   * @returns {Promise<Object>} Navigation counts
   */
  getNavigationCounts: async (teacherId) => {
    try {
      const response = await teacherDashboardApiInstance.get(`/${teacherId}/dashboard/navigation-counts`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch navigation counts' };
    }
  }
};

export default teacherDashboardAPI;



