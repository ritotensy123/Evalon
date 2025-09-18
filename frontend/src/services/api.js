import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api/organizations',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session handling
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Organization Registration API
export const organizationAPI = {
  // Step 1: Organization Details
  registerStep1: async (data) => {
    try {
      const response = await api.post('/register/step1', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register organization details' };
    }
  },

  // Step 2: Admin Details
  registerStep2: async (data) => {
    try {
      const response = await api.post('/register/step2', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register admin details' };
    }
  },

  // Step 3: Complete Registration
  registerStep3: async (data) => {
    try {
      const response = await api.post('/register/step3', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete registration' };
    }
  },

  // Get Registration Status
  getRegistrationStatus: async (registrationToken) => {
    try {
      const response = await api.get(`/register/status?registrationToken=${registrationToken}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get registration status' };
    }
  },

  // Check Organization Code
  checkOrgCode: async (orgCode) => {
    try {
      const response = await api.get(`/check-code/${orgCode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to check organization code' };
    }
  },

  // Send Email OTP
  sendEmailOTP: async (data) => {
    try {
      const response = await api.post('/auth/send-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email OTP' };
    }
  },

  // Verify Email OTP
  verifyEmailOTP: async (data) => {
    try {
      const response = await api.post('/register/verify-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email OTP' };
    }
  },

  // Send Phone OTP
  sendPhoneOTP: async (data) => {
    try {
      const response = await api.post('/auth/send-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send phone OTP' };
    }
  },

  // Verify Phone OTP
  verifyPhoneOTP: async (data) => {
    try {
      const response = await api.post('/register/verify-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify phone OTP' };
    }
  },

  // Get Organization by Code
  getOrganizationByCode: async (orgCode) => {
    try {
      const response = await api.get(`/code/${orgCode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get organization' };
    }
  },

  // Clear Registration Session
  clearRegistrationSession: async () => {
    try {
      const response = await api.delete('/register/session');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to clear registration session' };
    }
  },

  // Upload Logo
  uploadLogo: async (file, organizationContext = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file); // Changed from 'logo' to 'file' to match middleware
      formData.append('fileType', 'logo');
      
      // Add organization context for custom naming
      if (organizationContext.orgCode) {
        formData.append('orgCode', organizationContext.orgCode);
      }
      if (organizationContext.orgName) {
        formData.append('orgName', organizationContext.orgName);
      }
      
      const response = await api.post('/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload logo' };
    }
  },

  // Upload Document
  uploadDocument: async (file, organizationContext = {}, documentType = 'general') => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', 'document');
      formData.append('documentType', documentType);
      
      // Add organization context for custom naming
      if (organizationContext.orgCode) {
        formData.append('orgCode', organizationContext.orgCode);
      }
      if (organizationContext.orgName) {
        formData.append('orgName', organizationContext.orgName);
      }
      
      const response = await api.post('/upload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload document' };
    }
  },
};

// Create separate axios instance for location API
const locationApi = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for location API logging
locationApi.interceptors.request.use(
  (config) => {
    console.log(`🌍 Location API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Location API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for location API error handling
locationApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Location API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Location API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Create separate axios instance for teacher API
const teacherApi = axios.create({
  baseURL: 'http://localhost:5001/api/teachers',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for teacher API logging
teacherApi.interceptors.request.use(
  (config) => {
    console.log(`🚀 Teacher API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Teacher API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for teacher API error handling
teacherApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Teacher API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Teacher API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Location API
export const locationAPI = {
  // Get all countries
  getCountries: async () => {
    try {
      const response = await locationApi.get('/locations/countries');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch countries' };
    }
  },

  // Get states by country code
  getStatesByCountry: async (countryCode) => {
    try {
      const response = await locationApi.get(`/locations/countries/${countryCode}/states`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch states' };
    }
  },

  // Get cities by country code and state code
  getCitiesByState: async (countryCode, stateCode) => {
    try {
      const response = await locationApi.get(`/locations/countries/${countryCode}/states/${stateCode}/cities`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch cities' };
    }
  },

  // Get country details by country code
  getCountryByCode: async (countryCode) => {
    try {
      const response = await locationApi.get(`/locations/countries/${countryCode}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch country details' };
    }
  },
};

// OTP API
export const otpAPI = {
  // Send Email OTP
  sendEmailOTP: async (data) => {
    try {
      const response = await api.post('/auth/send-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email OTP' };
    }
  },

  // Verify Email OTP
  verifyEmailOTP: async (data) => {
    try {
      const response = await api.post('/register/verify-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email OTP' };
    }
  },

  // Send Phone OTP
  sendPhoneOTP: async (data) => {
    try {
      const response = await api.post('/auth/send-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send phone OTP' };
    }
  },

  // Verify Phone OTP
  verifyPhoneOTP: async (data) => {
    try {
      const response = await api.post('/register/verify-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify phone OTP' };
    }
  },

  // Resend OTP
  resendOTP: async (data) => {
    try {
      const response = await api.post('/auth/resend-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend OTP' };
    }
  },
};


// Health Check API
export const healthAPI = {
  check: async () => {
    try {
      const response = await axios.get('http://localhost:5001/health');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Backend server is not running' };
    }
  },
};

// Teacher Registration API
const teacherAxios = axios.create({
  baseURL: 'http://localhost:5001/api/teachers',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Student Registration API
const studentAxios = axios.create({
  baseURL: 'http://localhost:5001/api/students',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptors for teacher API
teacherAxios.interceptors.request.use(
  (config) => {
    console.log(`🚀 Teacher API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Teacher API Request Error:', error);
    return Promise.reject(error);
  }
);

teacherAxios.interceptors.response.use(
  (response) => {
    console.log(`✅ Teacher API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Teacher API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add interceptors for student API
studentAxios.interceptors.request.use(
  (config) => {
    console.log(`🚀 Student API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Student API Request Error:', error);
    return Promise.reject(error);
  }
);

studentAxios.interceptors.response.use(
  (response) => {
    console.log(`✅ Student API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Student API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const teacherAPI = {
  // Step 1: Basic Details
  registerStep1: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step1', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register teacher basic details' };
    }
  },

  // Step 2: Professional Details
  registerStep2: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step2', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register teacher professional details' };
    }
  },

  // Step 3: Organization Link
  registerStep3: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step3', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to link teacher to organization' };
    }
  },

  // Step 4: Security Verification
  registerStep4: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step4', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete teacher registration' };
    }
  },

  // Send Email OTP
  sendEmailOTP: async (data) => {
    try {
      const response = await teacherAxios.post('/send-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email OTP' };
    }
  },

  // Send Phone OTP
  sendPhoneOTP: async (data) => {
    try {
      const response = await teacherAxios.post('/send-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send phone OTP' };
    }
  },

  // Verify Email OTP
  verifyEmailOTP: async (data) => {
    try {
      const response = await teacherAxios.post('/verify-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email OTP' };
    }
  },

  // Verify Phone OTP
  verifyPhoneOTP: async (data) => {
    try {
      const response = await teacherAxios.post('/verify-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify phone OTP' };
    }
  },

  // Get Registration Status
  getRegistrationStatus: async (sessionId) => {
    try {
      const response = await teacherAxios.get('/registration-status', {
        params: { sessionId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get registration status' };
    }
  },
};

// Student Registration API
export const studentAPI = {
  // Step 1: Basic Details
  registerStep1: async (data) => {
    try {
      const response = await studentAxios.post('/register/step1', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register basic details' };
    }
  },

  // Step 2: Organization Verification
  registerStep2: async (data) => {
    try {
      const response = await studentAxios.post('/register/step2', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify organization' };
    }
  },

  // Step 3: Security Verification
  registerStep3: async (data) => {
    try {
      const response = await studentAxios.post('/register/step3', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete security verification' };
    }
  },

  // Step 4: Auto Mapping & Complete Registration
  registerStep4: async (data) => {
    try {
      const response = await studentAxios.post('/register/step4', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete student registration' };
    }
  },

  // Send Email OTP
  sendEmailOTP: async (data) => {
    try {
      const response = await studentAxios.post('/send-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email OTP' };
    }
  },

  // Send Phone OTP
  sendPhoneOTP: async (data) => {
    try {
      const response = await studentAxios.post('/send-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send phone OTP' };
    }
  },

  // Verify Email OTP
  verifyEmailOTP: async (data) => {
    try {
      const response = await studentAxios.post('/verify-email-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email OTP' };
    }
  },

  // Verify Phone OTP
  verifyPhoneOTP: async (data) => {
    try {
      const response = await studentAxios.post('/verify-phone-otp', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify phone OTP' };
    }
  },

  // Get Registration Status
  getRegistrationStatus: async (sessionId) => {
    try {
      const response = await studentAxios.get('/registration-status', {
        params: { sessionId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get registration status' };
    }
  },
};

// User Management API
const userManagementApi = axios.create({
  baseURL: 'http://localhost:5001/api/user-management',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptors for user management API
userManagementApi.interceptors.request.use(
  (config) => {
    console.log(`👥 User Management API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ User Management API Request Error:', error);
    return Promise.reject(error);
  }
);

userManagementApi.interceptors.response.use(
  (response) => {
    console.log(`✅ User Management API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ User Management API Response Error:', error.response?.data || error.message);
    
    // Handle token expiration - let AuthContext handle logout
    if (error.response?.status === 401) {
      // Don't automatically redirect, let the AuthContext handle it
      console.log('Token expired or invalid, AuthContext will handle logout');
    }
    
    return Promise.reject(error);
  }
);

export const userManagementAPI = {
  // Get all users for organization
  getAllUsers: async (organizationId, params = {}) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/users`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await userManagementApi.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await userManagementApi.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await userManagementApi.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  },

  // Delete user (deactivate)
  deleteUser: async (userId) => {
    try {
      const response = await userManagementApi.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  // Bulk create users
  bulkCreateUsers: async (users, organizationId) => {
    try {
      const response = await userManagementApi.post('/users/bulk', { users, organizationId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to bulk create users' };
    }
  },

  // Send invitation
  sendInvitation: async (invitationData) => {
    try {
      const response = await userManagementApi.post('/invitations', invitationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send invitation' };
    }
  },

  // Get invitation by token
  getInvitation: async (token) => {
    try {
      const response = await userManagementApi.get(`/invitations/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get invitation' };
    }
  },

  // Accept invitation
  acceptInvitation: async (token, userData) => {
    try {
      const response = await userManagementApi.post(`/invitations/${token}/accept`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to accept invitation' };
    }
  },

  // Get user statistics
  getUserStats: async (organizationId) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user statistics' };
    }
  },

  // Get role distribution
  getRoleDistribution: async (organizationId) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/role-distribution`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch role distribution' };
    }
  },

  // Get recent activity
  getRecentActivity: async (organizationId, limit = 10) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/recent-activity`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent activity' };
    }
  },

  // Get users by role
  getUsersByRole: async (organizationId, role) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/users/role/${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users by role' };
    }
  },

  // Update user role
  updateUserRole: async (userId, roleData) => {
    try {
      const response = await userManagementApi.put(`/users/${userId}/role`, roleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  },
};

export default api;
