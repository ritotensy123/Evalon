import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

const studentAPI = axios.create({
  baseURL: API_ENDPOINTS.STUDENTS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
studentAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
studentAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('🔍 Student API 401 error - token might be invalid');
      localStorage.removeItem('authToken');
      // Temporarily disable redirect to prevent page refresh
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const studentService = {
  // Get all students with filters
  getStudents: async (params = {}) => {
    const response = await studentAPI.get('/', { params });
    return response.data;
  },

  // Get student by ID
  getStudentById: async (id) => {
    const response = await studentAPI.get(`/${id}`);
    return response.data;
  },

  // Create new student
  createStudent: async (studentData) => {
    const response = await studentAPI.post('/', studentData);
    return response.data;
  },

  // Update student
  updateStudent: async (id, studentData) => {
    const response = await studentAPI.put(`/${id}`, studentData);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id) => {
    const response = await studentAPI.delete(`/${id}`);
    return response.data;
  },

  // Get student statistics
  getStudentStats: async () => {
    const response = await studentAPI.get('/stats');
    return response.data;
  },

  // Bulk operations
  bulkCreateStudents: async (studentsData) => {
    const response = await studentAPI.post('/bulk', studentsData);
    return response.data;
  },

  // Export students
  exportStudents: async (filters = {}) => {
    const response = await studentAPI.get('/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Suspend/Activate student
  toggleStudentStatus: async (id, action) => {
    const response = await studentAPI.patch(`/${id}/status`, { action });
    return response.data;
  },

  // Bulk status update
  bulkUpdateStatus: async (studentIds, action) => {
    const response = await studentAPI.patch('/bulk/status', { studentIds, action });
    return response.data;
  },

  // Assign student to department
  assignToDepartment: async (id, departmentId) => {
    const response = await studentAPI.patch(`/${id}/department`, { departmentId });
    return response.data;
  },

  // Remove student from department
  removeFromDepartment: async (id, departmentId) => {
    const response = await studentAPI.delete(`/${id}/department/${departmentId}`);
    return response.data;
  },

  // Bulk department assignment
  bulkAssignToDepartment: async (studentIds, departmentId) => {
    const response = await studentAPI.patch('/bulk/department', { studentIds, departmentId });
    return response.data;
  }
};

export default studentService;
