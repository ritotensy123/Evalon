import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const teacherAPI = axios.create({
  baseURL: `${API_BASE_URL}/teachers`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
teacherAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
teacherAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const teacherService = {
  // Get all teachers with filters
  getTeachers: async (params = {}) => {
    const response = await teacherAPI.get('/', { params });
    return response.data;
  },

  // Get teacher by ID
  getTeacherById: async (id) => {
    const response = await teacherAPI.get(`/${id}`);
    return response.data;
  },

  // Create new teacher
  createTeacher: async (teacherData) => {
    const response = await teacherAPI.post('/', teacherData);
    return response.data;
  },

  // Update teacher
  updateTeacher: async (id, teacherData) => {
    const response = await teacherAPI.put(`/${id}`, teacherData);
    return response.data;
  },

  // Delete teacher
  deleteTeacher: async (id) => {
    const response = await teacherAPI.delete(`/${id}`);
    return response.data;
  },

  // Get teacher statistics
  getTeacherStats: async () => {
    const response = await teacherAPI.get('/stats');
    return response.data;
  },

  // Bulk operations
  bulkCreateTeachers: async (teachersData) => {
    const response = await teacherAPI.post('/bulk', teachersData);
    return response.data;
  },

  // Export teachers
  exportTeachers: async (filters = {}) => {
    const response = await teacherAPI.get('/export', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  },

  // Suspend/Activate teacher
  toggleTeacherStatus: async (id, action) => {
    const response = await teacherAPI.patch(`/${id}/status`, { action });
    return response.data;
  },

  // Bulk status update
  bulkUpdateStatus: async (teacherIds, action) => {
    const response = await teacherAPI.patch('/bulk/status', { teacherIds, action });
    return response.data;
  },

  // Assign teacher role
  assignRole: async (id, roleData) => {
    const response = await teacherAPI.patch(`/${id}/role`, roleData);
    return response.data;
  },

  // Assign teacher to department
  assignToDepartment: async (id, departmentId) => {
    const response = await teacherAPI.patch(`/${id}/department`, { departmentId });
    return response.data;
  },

  // Remove teacher from department
  removeFromDepartment: async (id, departmentId) => {
    const response = await teacherAPI.delete(`/${id}/department/${departmentId}`);
    return response.data;
  },

  // Bulk role assignment
  bulkAssignRole: async (teacherIds, roleData) => {
    const response = await teacherAPI.patch('/bulk/role', { teacherIds, ...roleData });
    return response.data;
  },

  // Bulk department assignment
  bulkAssignToDepartment: async (teacherIds, departmentId) => {
    const response = await teacherAPI.patch('/bulk/department', { teacherIds, departmentId });
    return response.data;
  }
};

export default teacherService;
