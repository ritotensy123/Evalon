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

// Teacher Registration API
export const teacherAPI = {
  // Step 1: Basic Details
  registerStep1: async (data) => {
    try {
      const response = await teacherApi.post('/register/step1', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register basic details' };
    }
  },

  // Step 2: Professional Details
  registerStep2: async (data) => {
    try {
      const response = await teacherApi.post('/register/step2', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register professional details' };
    }
  },

  // Step 3: Organization Link
  registerStep3: async (data) => {
    try {
      const response = await teacherApi.post('/register/step3', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to link organization' };
    }
  },

  // Step 4: Complete Registration
  registerStep4: async (data) => {
    try {
      const response = await teacherApi.post('/register/step4', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to complete registration' };
    }
  },

  // Send Email OTP
  sendEmailOTP: async (emailAddress) => {
    try {
      const response = await teacherApi.post('/send-email-otp', { emailAddress });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send email OTP' };
    }
  },

  // Send Phone OTP
  sendPhoneOTP: async (phoneNumber, countryCode) => {
    try {
      const response = await teacherApi.post('/send-phone-otp', { phoneNumber, countryCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send phone OTP' };
    }
  },

  // Verify Email OTP
  verifyEmailOTP: async (emailOTP) => {
    try {
      const response = await teacherApi.post('/verify-email-otp', { emailOTP });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify email OTP' };
    }
  },

  // Verify Phone OTP
  verifyPhoneOTP: async (phoneOTP) => {
    try {
      const response = await teacherApi.post('/verify-phone-otp', { phoneOTP });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify phone OTP' };
    }
  },

  // Get Registration Status
  getRegistrationStatus: async () => {
    try {
      const response = await teacherApi.get('/registration-status');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get registration status' };
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

export default api;
