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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Main app content component that uses auth context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [manualNavigation, setManualNavigation] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Check authentication status on app load
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLoading, currentPage, manualNavigation });
    
    // Only auto-redirect if not manually navigating
    if (!manualNavigation) {
      if (isAuthenticated && currentPage === 'landing') {
        console.log('User is authenticated, setting page to dashboard');
        setCurrentPage('dashboard');
      } else if (!isAuthenticated && !isLoading && currentPage === 'dashboard') {
        console.log('User is not authenticated, setting page to landing');
        setCurrentPage('landing');
      }
    }
  }, [isAuthenticated, isLoading, manualNavigation]);

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

  // Handle successful login
  const handleLoginSuccess = React.useCallback(() => {
    console.log('Login successful, redirecting to dashboard...');
    console.log('Current page before redirect:', currentPage);
    // Set manual navigation flag to prevent useEffect from overriding
    setManualNavigation(true);
    // Force navigation to dashboard
    setCurrentPage('dashboard');
    console.log('Current page after redirect should be: dashboard');
  }, [currentPage]);

  const renderPage = () => {
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
      case 'dashboard':
        return (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        );
      default:
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
