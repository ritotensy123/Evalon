import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      if (authService.isAuthenticated()) {
        const userData = authService.getStoredUserData();
        const dashboardData = authService.getStoredDashboardData();
        const organizationData = authService.getStoredOrganizationData();
        
        if (userData) {
          setUser(userData);
          setDashboardData(dashboardData);
          // Only set organization data if it's not null and not an empty object
          setOrganizationData(organizationData && Object.keys(organizationData).length > 0 ? organizationData : null);
          setIsAuthenticated(true);
        } else {
          // Clear invalid data
          await logout();
        }
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, userType, googleCredential = null) => {
    try {
      console.log('AuthContext: Starting login process');
      console.log('AuthContext: Login params:', { email, userType, hasGoogleCredential: !!googleCredential });
      const result = await authService.login(email, password, userType, googleCredential);
      
      console.log('AuthContext: Login API result:', result);
      if (result.success) {
        console.log('AuthContext: Setting user and auth state');
        console.log('AuthContext: User data:', result.user);
        console.log('AuthContext: Dashboard data:', result.dashboard);
        console.log('AuthContext: Organization data:', result.organization);
        
        // Set all state synchronously
        setUser(result.user);
        setDashboardData(result.dashboard);
        // Only set organization data if it's not null and not an empty object
        setOrganizationData(result.organization && Object.keys(result.organization).length > 0 ? result.organization : null);
        setIsAuthenticated(true);
        
        console.log('AuthContext: Auth state updated, isAuthenticated should be true');
        
        // Return the result immediately
        return result;
      }
      
      throw new Error(result.message || 'Login failed');
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setDashboardData(null);
      setOrganizationData(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const updateDashboardData = (data) => {
    setDashboardData(data);
    localStorage.setItem('dashboardData', JSON.stringify(data));
  };

  const updateOrganizationData = (data) => {
    setOrganizationData(data);
    localStorage.setItem('organizationData', JSON.stringify(data));
  };

  const refreshUser = async () => {
    try {
      console.log('🔄 Refreshing user data from server...');
      // Fetch fresh user data from server instead of just checking localStorage
      const response = await authService.getProfile();
      if (response.success) {
        const userData = response.data;
        console.log('✅ Fresh user data received:', userData);
        
        // Update the user state with fresh data
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('✅ User data updated in state and localStorage');
      } else {
        console.log('❌ Failed to refresh user data, falling back to localStorage');
        await checkAuthStatus();
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      // Fallback to localStorage check
      await checkAuthStatus();
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    dashboardData,
    organizationData,
    login,
    logout,
    updateUser,
    updateDashboardData,
    updateOrganizationData,
    checkAuthStatus,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
