import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { organizationAPI } from '../services/api';

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
          
          // CRITICAL: Auto-rehydrate organization data if incomplete
          let orgData = organizationData && Object.keys(organizationData).length > 0 ? organizationData : null;
          console.log('🔍 [LOGO DEBUG] Organization data from localStorage:', orgData ? Object.keys(orgData) : 'NULL');
          console.log('🔍 [LOGO DEBUG] Logo in localStorage data:', orgData?.logo ? 'EXISTS' : 'MISSING', orgData?.logo?.substring(0, 50) || 'N/A');
          
          // AUTO-REHYDRATION: Check if organizationData is incomplete (normalized/partial object)
          // localStorage is only a cache - backend is the source of truth
          const organizationId = userData.organizationId;
          
          // Detect if organizationData looks like a normalized/partial object
          // Full organization objects should have many fields (logo, email, phone, address, etc.)
          // Normalized objects typically only have: id, name, code (3-4 fields)
          const hasOnlyBasicFields = orgData && Object.keys(orgData).length <= 4 && 
            orgData.id && orgData.name && (orgData.code || orgData.orgCode) && !orgData.logo;
          
          // Also check if critical fields are missing (indicates old/incomplete data)
          const isIncomplete = orgData && organizationId && (
            hasOnlyBasicFields || // Only has id, name, code (normalized)
            (!orgData.logo && !orgData.email) || // Missing both logo and email (very incomplete)
            Object.keys(orgData).length < 5 // Heuristic: full org object should have many fields
          );
          
          if (isIncomplete) {
            console.log('🔄 [AUTO-REHYDRATE] Organization data incomplete, fetching from backend...');
            console.log('🔄 [AUTO-REHYDRATE] Missing fields:', {
              logo: !orgData.logo,
              email: !orgData.email,
              orgCode: !orgData.orgCode,
              fieldCount: Object.keys(orgData).length
            });
            try {
              // Fetch full organization object from backend (source of truth)
              const response = await organizationAPI.getOrganizationById(organizationId);
              if (response.success && response.data) {
                const fullOrgData = response.data;
                console.log('✅ [AUTO-REHYDRATE] Full organization data fetched:', Object.keys(fullOrgData));
                console.log('✅ [AUTO-REHYDRATE] Logo in fetched data:', fullOrgData.logo ? 'EXISTS' : 'MISSING', fullOrgData.logo?.substring(0, 50) || 'N/A');
                
                // Update localStorage with complete data (backend is source of truth)
                localStorage.setItem('organizationData', JSON.stringify(fullOrgData));
                
                // Use the complete organization data
                orgData = fullOrgData;
                console.log('✅ [AUTO-REHYDRATE] Organization data rehydrated and saved to localStorage');
              } else {
                console.warn('⚠️ [AUTO-REHYDRATE] Backend response missing data, using incomplete localStorage data');
              }
            } catch (error) {
              console.error('❌ [AUTO-REHYDRATE] Failed to rehydrate organization data:', error);
              // Continue with incomplete data if fetch fails (graceful degradation)
            }
          } else if (orgData) {
            console.log('✅ [AUTO-REHYDRATE] Organization data appears complete, using localStorage cache');
          }
          
          // Store organization data (either from localStorage or rehydrated from backend)
          setOrganizationData(orgData);
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
        console.log('🔍 [LOGO DEBUG] Organization logo in login response:', result.organization?.logo ? 'EXISTS' : 'MISSING', result.organization?.logo?.substring(0, 50) || 'N/A');
        
        // Set all state synchronously
        setUser(result.user);
        setDashboardData(result.dashboard);
        // CRITICAL: Store the FULL organization object from response - never normalize
        // Only set organization data if it's not null and not an empty object
        const orgData = result.organization && Object.keys(result.organization).length > 0 ? result.organization : null;
        console.log('🔍 [LOGO DEBUG] Full organization object from login:', orgData ? Object.keys(orgData) : 'NULL');
        console.log('🔍 [LOGO DEBUG] Organization logo in object:', orgData?.logo ? 'EXISTS' : 'MISSING', orgData?.logo?.substring(0, 50) || 'N/A');
        setOrganizationData(orgData); // Store FULL object - includes logo and all fields
        console.log('🔍 [LOGO DEBUG] Organization data set in context:', orgData?.logo ? 'EXISTS' : 'MISSING');
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
    console.log('🔍 [LOGO DEBUG] Updating organization data in context:', data?.logo ? 'EXISTS' : 'MISSING', data?.logo?.substring(0, 50) || 'N/A');
    console.log('🔍 [LOGO DEBUG] Full organization data keys:', data ? Object.keys(data) : 'NULL');
    // CRITICAL: Store the FULL organization object - never normalize or reconstruct
    setOrganizationData(data);
    localStorage.setItem('organizationData', JSON.stringify(data));
    console.log('🔍 [LOGO DEBUG] Organization data saved to localStorage');
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
