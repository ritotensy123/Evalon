import axios from 'axios';

// Create axios instance for authentication API
const authAPI = axios.create({
  baseURL: 'http://localhost:5001/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for logging
authAPI.interceptors.request.use(
  (config) => {
    console.log(`🔐 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Add token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Auth API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
authAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Auth API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Auth API Response Error:', error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('dashboardData');
      // Let the AuthContext handle the navigation
    }
    
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  // Login user
  login: async (email, password, userType = null, googleCredential = null) => {
    try {
      let response;
      
      if (googleCredential && googleCredential !== 'null' && googleCredential !== null) {
        // Google Sign-In
        console.log('🔐 Using Google Sign-In endpoint');
        response = await authAPI.post('/google', { 
          credential: googleCredential, 
          userType 
        });
      } else {
        // Regular login
        response = await authAPI.post('/login', { email, password, userType });
      }
      
      if (response.data.success) {
        const { token, user, dashboard, organization } = response.data.data;
        
        // Store token and user data
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('dashboardData', JSON.stringify(dashboard));
        if (organization) {
          localStorage.setItem('organizationData', JSON.stringify(organization));
        }
        
        return {
          success: true,
          user,
          dashboard,
          organization,
          token
        };
      }
      
      throw new Error(response.data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await authAPI.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('dashboardData');
      localStorage.removeItem('organizationData');
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await authAPI.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await authAPI.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await authAPI.put('/change-password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await authAPI.get('/verify-token');
      return response.data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error.response?.data || { message: 'Token verification failed' };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    return !!(token && userData);
  },

  // Get stored user data
  getStoredUserData: () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Get stored dashboard data
  getStoredDashboardData: () => {
    try {
      const dashboardData = localStorage.getItem('dashboardData');
      return dashboardData ? JSON.parse(dashboardData) : null;
    } catch (error) {
      console.error('Error parsing dashboard data:', error);
      return null;
    }
  },

  // Get stored organization data
  getStoredOrganizationData: () => {
    try {
      const organizationData = localStorage.getItem('organizationData');
      return organizationData ? JSON.parse(organizationData) : null;
    } catch (error) {
      console.error('Error parsing organization data:', error);
      return null;
    }
  },

  // Get user type
  getUserType: () => {
    const userData = authService.getStoredUserData();
    return userData?.userType || null;
  },

  // Check if user has specific role
  hasRole: (role) => {
    const userType = authService.getUserType();
    return userType === role;
  },

  // Get dashboard route based on user type
  getDashboardRoute: () => {
    const userType = authService.getUserType();
    
    switch (userType) {
      case 'organization_admin':
        return '/dashboard/organization';
      case 'sub_admin':
        return '/dashboard/sub-admin';
      case 'teacher':
        return '/dashboard/teacher';
      case 'student':
        return '/dashboard/student';
      default:
        return '/login';
    }
  },

  // Get dashboard route (for future use with React Router)
  redirectToDashboard: () => {
    const dashboardRoute = authService.getDashboardRoute();
    // This will be handled by the App component's state management
    return dashboardRoute;
  }
};

export default authService;
