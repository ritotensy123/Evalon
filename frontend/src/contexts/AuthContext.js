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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      if (authService.isAuthenticated()) {
        const userData = authService.getStoredUserData();
        const dashboardData = authService.getStoredDashboardData();
        
        if (userData) {
          setUser(userData);
          setDashboardData(dashboardData);
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

  const login = async (email, password, userType) => {
    try {
      console.log('AuthContext: Starting login process');
      const result = await authService.login(email, password, userType);
      
      console.log('AuthContext: Login API result:', result);
      if (result.success) {
        console.log('AuthContext: Setting user and auth state');
        setUser(result.user);
        setDashboardData(result.dashboard);
        setIsAuthenticated(true);
        console.log('AuthContext: Auth state updated, isAuthenticated should be true');
        
        // Force a re-render to ensure state is updated
        setTimeout(() => {
          console.log('AuthContext: State update timeout - checking if authenticated:', authService.isAuthenticated());
        }, 100);
        
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

  const value = {
    user,
    isAuthenticated,
    isLoading,
    dashboardData,
    login,
    logout,
    updateUser,
    updateDashboardData,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
