import axios from 'axios';

// Flag to prevent multiple redirects
let isRedirecting = false;

// Utility function to handle token expiration
const handleTokenExpiration = (apiName) => {
  if (isRedirecting) {
    console.log(`Already redirecting due to token expiration, skipping ${apiName}`);
    return;
  }
  
  console.log(`Token expired or invalid for ${apiName}, clearing auth data`);
  isRedirecting = true;
  
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  localStorage.removeItem('dashboardData');
  localStorage.removeItem('organizationData');
  
  // Use setTimeout to allow other API calls to complete
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api/organizations',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For session handling
});

// Create separate instances for different API endpoints
const examApiInstance = axios.create({
  baseURL: 'http://localhost:5001/api/exams',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add authentication interceptor for exam API
examApiInstance.interceptors.request.use(
  (config) => {
    console.log(`📝 Exam API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Exam API: Authorization header set');
    } else {
      console.warn('⚠️ Exam API: No auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Exam API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for exam API
examApiInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Exam API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Exam API Response Error:', error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      handleTokenExpiration('exam API');
    }
    
    return Promise.reject(error);
  }
);

const questionApiInstance = axios.create({
  baseURL: 'http://localhost:5001/api/questions',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add authentication interceptor for question API
questionApiInstance.interceptors.request.use(
  (config) => {
    console.log(`❓ Question API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Question API Request Error:', error);
    return Promise.reject(error);
  }
);

const questionBankApiInstance = axios.create({
  baseURL: 'http://localhost:5001/api/question-banks',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add authentication interceptor for question bank API
questionBankApiInstance.interceptors.request.use(
  (config) => {
    console.log(`📚 Question Bank API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    console.log('🔑 Auth token available:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set');
    } else {
      console.warn('⚠️ No auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Question Bank API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for question bank API
questionBankApiInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Question Bank API Response: ${response.status} ${response.config.url}`);
    console.log('📚 Question Bank Response data:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Question Bank API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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
    
    // Handle token expiration
    if (error.response?.status === 401) {
      handleTokenExpiration('main API');
    }
    
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
      // Preserve the original error structure for better error handling
      const errorData = error.response?.data || { message: 'Failed to register teacher basic details' };
      const apiError = new Error(errorData.message || 'Failed to register teacher basic details');
      apiError.response = error.response;
      apiError.data = errorData;
      throw apiError;
    }
  },

  // Step 2: Professional Details
  registerStep2: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step2', data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to register teacher professional details' };
      const apiError = new Error(errorData.message || 'Failed to register teacher professional details');
      apiError.response = error.response;
      apiError.data = errorData;
      throw apiError;
    }
  },

  // Step 3: Organization Link
  registerStep3: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step3', data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to link teacher to organization' };
      const apiError = new Error(errorData.message || 'Failed to link teacher to organization');
      apiError.response = error.response;
      apiError.data = errorData;
      throw apiError;
    }
  },

  // Step 4: Security Verification
  registerStep4: async (data) => {
    try {
      const response = await teacherAxios.post('/register/step4', data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to complete teacher registration' };
      const apiError = new Error(errorData.message || 'Failed to complete teacher registration');
      apiError.response = error.response;
      apiError.data = errorData;
      throw apiError;
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

  // Get all teachers
  getAll: async (params = {}) => {
    try {
      const response = await teacherAxios.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get teachers' };
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
    
    // Handle token expiration
    if (error.response?.status === 401) {
      handleTokenExpiration('user management API');
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

  // Get users with filters (for department management)
  getUsers: async (params = {}) => {
    try {
      // Get organization ID from user context or params
      const organizationId = params.organizationId || localStorage.getItem('organizationId');
      if (!organizationId) {
        throw new Error('Organization ID is required');
      }
      
      const response = await userManagementApi.get(`/organization/${organizationId}/users`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  },

  // Import users from CSV
  importUsers: async (formData) => {
    try {
      const response = await userManagementApi.post('/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to import users' };
    }
  },

  // Export users to CSV
  exportUsers: async (params = {}) => {
    try {
      const response = await userManagementApi.get('/users/export', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export users' };
    }
  },

  // Remove user from department
  removeUserFromDepartment: async (departmentId, userId) => {
    try {
      const response = await userManagementApi.delete(`/departments/${departmentId}/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove user from department' };
    }
  },

  // Bulk actions on users
  bulkAction: async (actionData) => {
    try {
      const response = await userManagementApi.post('/users/bulk-action', actionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to perform bulk action' };
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

  deleteUser: async (userId) => {
    try {
      const response = await userManagementApi.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  },

  toggleUserStatus: async (userId, action) => {
    try {
      const response = await userManagementApi.patch(`/users/${userId}/status`, { action });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user status' };
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

  // Bulk delete users
  bulkDeleteUsers: async (userIds) => {
    try {
      const response = await userManagementApi.delete('/users/bulk', { data: { userIds } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to bulk delete users' };
    }
  },

  // Bulk toggle user status
  bulkToggleUserStatus: async (userIds, action) => {
    try {
      const response = await userManagementApi.patch('/users/bulk/status', { userIds, action });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to bulk update user status' };
    }
  },

  // Send invitation
  sendInvitation: async (organizationId, invitationData) => {
    try {
      const response = await userManagementApi.post(`/organization/${organizationId}/invitations`, invitationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send invitation' };
    }
  },

  // Get invitations for organization
  getInvitations: async (organizationId, status = 'all') => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/invitations`, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get invitations' };
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

  // Registration completion methods
  getRegistrationDetails: async (token) => {
    try {
      const response = await userManagementApi.get(`/registration/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get registration details' };
    }
  },

  completeRegistration: async (token, data) => {
    try {
      const response = await userManagementApi.post(`/registration/${token}/complete`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete registration' };
    }
  },

  validateOrganizationCode: async (token, organizationCode) => {
    try {
      const response = await userManagementApi.post('/registration/validate-code', {
        token,
        organizationCode
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to validate organization code' };
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

  // Get online users
  getOnlineUsers: async (organizationId, limit = 100) => {
    try {
      const response = await userManagementApi.get(`/organization/${organizationId}/online-users`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch online users' };
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

  // Cancel invitation
  cancelInvitation: async (invitationId) => {
    try {
      const response = await userManagementApi.put(`/invitations/${invitationId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel invitation' };
    }
  },

  // Resend invitation
  resendInvitation: async (invitationId) => {
    try {
      const response = await userManagementApi.post(`/invitations/${invitationId}/resend`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to resend invitation' };
    }
  },

  // Bulk send invitations
  bulkSendInvitations: async (organizationId, invitations) => {
    try {
      const response = await userManagementApi.post(`/organization/${organizationId}/invitations/bulk`, { invitations });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send bulk invitations' };
    }
  },
};

// Question Bank API
export const questionAPI = {
  createQuestion: async (questionData) => {
    try {
      const response = await questionApiInstance.post('/', questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create question' };
    }
  },

  getQuestions: async (params = {}) => {
    try {
      const response = await questionApiInstance.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch questions' };
    }
  },

  getQuestionById: async (questionId) => {
    try {
      const response = await questionApiInstance.get(`/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch question' };
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await questionApiInstance.put(`/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update question' };
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      const response = await questionApiInstance.delete(`/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete question' };
    }
  },

  duplicateQuestion: async (questionId) => {
    try {
      const response = await questionApiInstance.post(`/${questionId}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to duplicate question' };
    }
  },

  validateQuestion: async (questionId) => {
    try {
      const response = await questionApiInstance.post(`/${questionId}/validate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to validate question' };
    }
  },

  bulkImportQuestions: async (questions) => {
    try {
      const response = await questionApiInstance.post('/bulk-import', { questions });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to bulk import questions' };
    }
  },

  exportQuestions: async (format = 'json', filters = {}) => {
    try {
      const response = await questionApiInstance.get('/export', { 
        params: { format, ...filters } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export questions' };
    }
  },

  getQuestionStatistics: async () => {
    try {
      const response = await questionApiInstance.get('/statistics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch question statistics' };
    }
  },
  getAvailableQuestionsForExam: async (params = {}) => {
    try {
      const response = await questionApiInstance.get('/available-for-exam', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch available questions' };
    }
  }
};

// Question Bank Management API
export const questionBankAPI = {
  createQuestionBank: async (questionBankData) => {
    try {
      const response = await questionBankApiInstance.post('/', questionBankData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create question bank' };
    }
  },
  getQuestionBanks: async (params = {}) => {
    try {
      const response = await questionBankApiInstance.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch question banks' };
    }
  },
  getQuestionBankById: async (questionBankId) => {
    try {
      const response = await questionBankApiInstance.get(`/${questionBankId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch question bank' };
    }
  },
  updateQuestionBank: async (questionBankId, questionBankData) => {
    try {
      const response = await questionBankApiInstance.put(`/${questionBankId}`, questionBankData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update question bank' };
    }
  },
  deleteQuestionBank: async (questionBankId) => {
    try {
      const response = await questionBankApiInstance.delete(`/${questionBankId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete question bank' };
    }
  },
  addQuestionsToBank: async (questionBankId, questions) => {
    try {
      const response = await questionBankApiInstance.post(`/${questionBankId}/questions`, { questions });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add questions to bank' };
    }
  },
  getQuestionsInBank: async (questionBankId) => {
    try {
      const response = await questionBankApiInstance.get(`/${questionBankId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch questions in bank' };
    }
  },
  removeQuestionFromBank: async (questionBankId, questionId) => {
    try {
      const response = await questionBankApiInstance.delete(`/${questionBankId}/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove question from bank' };
    }
  },
  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await questionApiInstance.put(`/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update question' };
    }
  },
  getQuestionBankStatistics: async (questionBankId) => {
    try {
      const response = await questionBankApiInstance.get(`/${questionBankId}/statistics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch question bank statistics' };
    }
  },
  duplicateQuestionBank: async (questionBankId) => {
    try {
      const response = await questionBankApiInstance.post(`/${questionBankId}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to duplicate question bank' };
    }
  }
};

// Exam Management API
export const examAPI = {
  createExam: async (examData) => {
    try {
      const response = await examApiInstance.post('/', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create exam' };
    }
  },
  getExams: async (params = {}) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBust = Date.now();
      const response = await examApiInstance.get('/', { 
        params: { ...params, _t: cacheBust }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exams' };
    }
  },
  getExamById: async (examId) => {
    try {
      const response = await examApiInstance.get(`/${examId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exam' };
    }
  },
  updateExam: async (examId, examData) => {
    try {
      const response = await examApiInstance.put(`/${examId}`, examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update exam' };
    }
  },
  deleteExam: async (examId) => {
    try {
      const response = await examApiInstance.delete(`/${examId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete exam' };
    }
  },
  updateExamStatus: async (examId, status) => {
    try {
      const response = await examApiInstance.patch(`/${examId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update exam status' };
    }
  },
  getExamCountdown: async (examId) => {
    try {
      const response = await examApiInstance.get(`/${examId}/countdown`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get exam countdown' };
    }
  },
  assignQuestionBankToExam: async (examId, questionBankId) => {
    try {
      const response = await examApiInstance.post(`/${examId}/assign-question-bank`, { questionBankId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign question bank to exam' };
    }
  },
  getExamQuestions: async (examId) => {
    try {
      const response = await examApiInstance.get(`/${examId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exam questions' };
    }
  },
  removeQuestionBankFromExam: async (examId) => {
    try {
      const response = await examApiInstance.delete(`/${examId}/question-bank`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove question bank from exam' };
    }
  },
  getExamStatistics: async (examId) => {
    try {
      const response = await examApiInstance.get(`/${examId}/statistics`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exam statistics' };
    }
  },
  duplicateExam: async (examId) => {
    try {
      const response = await examApiInstance.post(`/${examId}/duplicate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to duplicate exam' };
    }
  },
  scheduleExam: async (examId, scheduleData) => {
    try {
      const response = await examApiInstance.post(`/${examId}/schedule`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to schedule exam' };
    }
  },
  getExamResults: async (examId) => {
    try {
      const response = await examApiInstance.get(`/${examId}/results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exam results' };
    }
  },
  getExamsByTeacher: async (params = {}) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBust = Date.now();
      const response = await examApiInstance.get('/teacher', { 
        params: { ...params, _t: cacheBust }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teacher exams' };
    }
  },
  getExamsByStudent: async (params = {}) => {
    try {
      const response = await examApiInstance.get('/student', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch student exams' };
    }
  },
  assignTeachersToExam: async (examId, teacherIds) => {
    try {
      const response = await examApiInstance.post(`/${examId}/assign-teachers`, { teacherIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign teachers to exam' };
    }
  },
  updateExam: async (examId, examData) => {
    try {
      const response = await examApiInstance.put(`/${examId}`, examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update exam' };
    }
  }
};

const teacherClassApiInstance = axios.create({
  baseURL: 'http://localhost:5001/api/teacher-classes',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add authentication interceptor for teacher class API
teacherClassApiInstance.interceptors.request.use(
  (config) => {
    console.log(`🎓 Teacher Class API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Teacher Class API Request Error:', error);
    return Promise.reject(error);
  }
);

export const teacherClassAPI = {
  // Get all classes for a teacher
  getAll: async (params = {}) => {
    try {
      const response = await teacherClassApiInstance.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teacher classes' };
    }
  },

  // Get single class by ID
  getById: async (classId) => {
    try {
      const response = await teacherClassApiInstance.get(`/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch teacher class' };
    }
  },

  // Create new class
  create: async (classData) => {
    try {
      const response = await teacherClassApiInstance.post('/', classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create teacher class' };
    }
  },

  // Update class
  update: async (classId, classData) => {
    try {
      const response = await teacherClassApiInstance.put(`/${classId}`, classData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update teacher class' };
    }
  },

  // Delete class
  delete: async (classId) => {
    try {
      const response = await teacherClassApiInstance.delete(`/${classId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete teacher class' };
    }
  },

  // Get available students for a department
  getAvailableStudents: async (departmentId) => {
    try {
      const response = await teacherClassApiInstance.get(`/department/${departmentId}/students`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch available students' };
    }
  },

  // Add students to class
  addStudents: async (classId, studentIds) => {
    try {
      const response = await teacherClassApiInstance.post(`/${classId}/students`, { studentIds });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add students to class' };
    }
  },

  // Remove student from class
  removeStudent: async (classId, studentId) => {
    try {
      const response = await teacherClassApiInstance.delete(`/${classId}/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove student from class' };
    }
  }
};

// Department Management API
const departmentApi = axios.create({
  baseURL: 'http://localhost:5001/api/departments',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptors for department API
departmentApi.interceptors.request.use(
  (config) => {
    console.log(`🏢 Department API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Department API Request Error:', error);
    return Promise.reject(error);
  }
);

departmentApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Department API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Department API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const departmentAPI = {
  // Create department
  create: async (departmentData) => {
    try {
      const response = await departmentApi.post('/', departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create department' };
    }
  },

  // Get all departments
  getAll: async (params = {}) => {
    try {
      const response = await departmentApi.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch departments' };
    }
  },

  // Get department tree
  getTree: async (params = {}) => {
    try {
      const response = await departmentApi.get('/tree', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch department tree' };
    }
  },

  // Get single department by ID
  getById: async (id) => {
    try {
      const response = await departmentApi.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch department' };
    }
  },


  // Update department
  update: async (departmentId, departmentData) => {
    try {
      const response = await departmentApi.put(`/${departmentId}`, departmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update department' };
    }
  },

  // Delete department
  delete: async (departmentId) => {
    try {
      const response = await departmentApi.delete(`/${departmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete department' };
    }
  },

  // Assign teacher to department
  assignTeacher: async (departmentId, teacherData) => {
    try {
      const response = await departmentApi.post(`/${departmentId}/assign-teacher`, teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign teacher to department' };
    }
  },

  // Get department statistics
  getStats: async () => {
    try {
      const response = await departmentApi.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch department statistics' };
    }
  }
};

// Subject Management API
const subjectApi = axios.create({
  baseURL: 'http://localhost:5001/api/subjects',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add interceptors for subject API
subjectApi.interceptors.request.use(
  (config) => {
    console.log(`📚 Subject API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Subject API Request Error:', error);
    return Promise.reject(error);
  }
);

subjectApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Subject API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Subject API Response Error:', error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      handleTokenExpiration('subject API');
    }
    
    return Promise.reject(error);
  }
);

export const subjectAPI = {
  // Create subject
  create: async (subjectData) => {
    try {
      const response = await subjectApi.post('/', subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create subject' };
    }
  },

  // Get all subjects
  getAll: async (params = {}) => {
    try {
      const response = await subjectApi.get('/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subjects' };
    }
  },

  // Get subjects by department
  getByDepartment: async (departmentId, params = {}) => {
    try {
      const response = await subjectApi.get(`/department/${departmentId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subjects by department' };
    }
  },

  // Get subjects by category
  getByCategory: async (category, params = {}) => {
    try {
      const response = await subjectApi.get(`/category/${category}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subjects by category' };
    }
  },

  // Get subject by ID
  getById: async (subjectId) => {
    try {
      const response = await subjectApi.get(`/${subjectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subject' };
    }
  },

  // Update subject
  update: async (subjectId, subjectData) => {
    try {
      const response = await subjectApi.put(`/${subjectId}`, subjectData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update subject' };
    }
  },

  // Delete subject
  delete: async (subjectId) => {
    try {
      const response = await subjectApi.delete(`/${subjectId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete subject' };
    }
  },

  // Assign coordinator to subject
  assignCoordinator: async (subjectId, teacherData) => {
    try {
      const response = await subjectApi.post(`/${subjectId}/assign-coordinator`, teacherData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign coordinator to subject' };
    }
  },

  // Get subject statistics
  getStats: async () => {
    try {
      const response = await subjectApi.get('/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch subject statistics' };
    }
  }
};

export default api;
