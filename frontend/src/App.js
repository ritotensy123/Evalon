import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import OrganisationRegistration from './pages/onboarding/OrganisationRegistration';
import TeacherRegistration from './pages/onboarding/TeacherRegistration';
import StudentRegistration from './pages/onboarding/StudentRegistration';
import Dashboard from './pages/Dashboard';
import SystemSetupWizard from './components/setup/SystemSetupWizard';
import CompleteRegistration from './pages/CompleteRegistration';
import FirstTimeLoginWizard from './components/FirstTimeLoginWizard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Main app content component that uses auth context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [manualNavigation, setManualNavigation] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Initialize app state on load
  useEffect(() => {
    console.log('🚀 App initializing...');
    setCurrentPage('landing');
    setManualNavigation(false);
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    console.log('🔍 Auth state changed:', { 
      isAuthenticated, 
      isLoading, 
      currentPage, 
      manualNavigation, 
      hasUser: !!user,
      userFirstLogin: user?.firstLogin,
      userType: user?.userType
    });
    
    // Only auto-redirect if not manually navigating
    if (!manualNavigation) {
      // If not authenticated and loading is complete, go to landing
      if (!isAuthenticated && !isLoading) {
        console.log('❌ User is not authenticated, setting page to landing');
        setCurrentPage('landing');
        return;
      }
      
      // If authenticated, check where to go
      if (isAuthenticated && user && (currentPage === 'landing' || currentPage === 'login')) {
        console.log('🔍 User is authenticated, checking first-time login conditions...');
        console.log('🔍 User data:', {
          id: user.id,
          email: user.email,
          userType: user.userType,
          firstLogin: user.firstLogin,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider
        });
        
        // Check if this is a first-time login - only if user is actually authenticated AND has firstLogin true
        console.log('🔍 Checking firstLogin status:', user.firstLogin, typeof user.firstLogin);
        if (user.firstLogin === true) {
          console.log('✅ FIRST LOGIN DETECTED! User needs first-time setup, showing wizard');
          console.log('✅ Setting currentPage to first-time-login');
          setCurrentPage('first-time-login');
        } else {
          console.log('✅ User is authenticated but NOT first login, going to dashboard');
          console.log('✅ Setting currentPage to dashboard');
          setCurrentPage('dashboard');
        }
      }
    } else {
      console.log('🔍 Manual navigation is true, skipping auto-redirect');
    }
  }, [isAuthenticated, isLoading, manualNavigation, currentPage, user]);

  // Debug authentication state changes
  useEffect(() => {
    console.log('App: Authentication state changed:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  // Memoized navigation functions to prevent unnecessary re-renders
  const handleNavigateToOnboarding = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('onboarding');
  }, []);

  const handleNavigateToLogin = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('login');
  }, []);

  const handleNavigateToLanding = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('landing');
  }, []);

  // Onboarding navigation functions
  const handleNavigateToOrgOnboarding = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('organisation-registration');
  }, []);

  const handleNavigateToTeacherOnboarding = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('teacher-onboarding');
  }, []);

  const handleNavigateToStudentOnboarding = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('student-onboarding');
  }, []);

  const handleNavigateToDashboard = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('dashboard');
  }, []);

  const handleNavigateToSetup = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('setup-wizard');
  }, []);

  const handleNavigateToCompleteRegistration = React.useCallback((token) => {
    setManualNavigation(true);
    setCurrentPage(`complete-registration/${token}`);
  }, []);

  // Handle successful login
  const handleLoginSuccess = React.useCallback(() => {
    console.log('🎯 Login successful, checking user state...');
    console.log('🎯 Current page before redirect:', currentPage);
    console.log('🎯 User data after login:', user);
    
    // Clear manual navigation flag to allow auto-redirect
    setManualNavigation(false);
    
    // Add a small delay to ensure user data is properly set
    setTimeout(() => {
      console.log('🎯 Manual navigation cleared, letting useEffect handle routing');
    }, 100);
  }, [currentPage, user]);

  const renderPage = () => {
    console.log('🎯 renderPage called with currentPage:', currentPage);
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onNavigateToOnboarding={handleNavigateToOnboarding}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'login':
        return (
          <LoginPage
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToRegister={handleNavigateToOnboarding}
            onNavigateToDashboard={handleLoginSuccess}
          />
        );
      case 'onboarding':
        return (
          <OnboardingPage
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToLogin={handleNavigateToLogin}
            onNavigateToOrgOnboarding={handleNavigateToOrgOnboarding}
            onNavigateToTeacherOnboarding={handleNavigateToTeacherOnboarding}
            onNavigateToStudentOnboarding={handleNavigateToStudentOnboarding}
          />
        );
      case 'organisation-registration':
        return (
          <OrganisationRegistration
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'teacher-onboarding':
        return (
          <TeacherRegistration
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'student-onboarding':
        return (
          <StudentRegistration
            onNavigateToLanding={handleNavigateToLanding}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
      case 'setup-wizard':
        return (
          <ProtectedRoute>
            <SystemSetupWizard
              onComplete={handleNavigateToDashboard}
              onSkip={handleNavigateToDashboard}
            />
          </ProtectedRoute>
        );
      case 'first-time-login':
        console.log('🎯 Rendering first-time-login case with:', { 
          isAuthenticated, 
          hasUser: !!user, 
          firstLogin: user?.firstLogin,
          currentPage 
        });
        
        // Only show wizard if user is authenticated AND has firstLogin true
        if (!isAuthenticated || !user || user.firstLogin !== true) {
          console.log('🚫 Wizard conditions not met:', { 
            isAuthenticated, 
            hasUser: !!user, 
            firstLogin: user?.firstLogin 
          });
          // Redirect to landing if not authenticated, or dashboard if authenticated but not first login
          if (!isAuthenticated) {
            setCurrentPage('landing');
            return null;
          } else {
            setCurrentPage('dashboard');
            return null;
          }
        }
        
        console.log('✅ Wizard conditions met, rendering FirstTimeLoginWizard');
        return (
          <ProtectedRoute>
            <FirstTimeLoginWizard />
          </ProtectedRoute>
        );
      case 'dashboard':
        return (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        );
      default:
        // Check if it's a complete-registration route
        if (currentPage.startsWith('complete-registration/')) {
          const token = currentPage.split('/')[1];
          return <CompleteRegistration token={token} />;
        }
        return (
          <LandingPage
            onNavigateToOnboarding={handleNavigateToOnboarding}
            onNavigateToLogin={handleNavigateToLogin}
          />
        );
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <h2>Loading Evalon...</h2>
            <p>Please wait while we check your authentication status.</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderPage()}
    </ThemeProvider>
  );
};

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
