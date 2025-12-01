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
import DepartmentDetailPage from './pages/dashboard/DepartmentDetailPage';
import MonitoringTest from './pages/dashboard/MonitoringTest';
import AIModelTestPage from './pages/AIModelTestPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Main app content component that uses auth context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [manualNavigation, setManualNavigation] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  // Initialize app state on load
  useEffect(() => {
    
    // Check if we're on a department detail page
    const path = window.location.pathname;
    if (path.startsWith('/dashboard/departments/') && path !== '/dashboard/departments') {
      const departmentId = path.split('/')[3];
      setCurrentPage(`department-detail/${departmentId}`);
      setManualNavigation(true);
    } else if (path === '/monitoring-test') {
      setCurrentPage('monitoring-test');
      setManualNavigation(true);
    } else if (path === '/ai-model-test') {
      setCurrentPage('ai-model-test');
      setManualNavigation(true);
    } else {
      setCurrentPage('landing');
      setManualNavigation(false);
    }
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    
    // Only auto-redirect if not manually navigating
    if (!manualNavigation) {
      // If not authenticated and loading is complete, go to landing
      if (!isAuthenticated && !isLoading) {
        setCurrentPage('landing');
        return;
      }
      
      // If authenticated, check where to go
      if (isAuthenticated && user && (currentPage === 'landing' || currentPage === 'login')) {
        
        // Check if this is a first-time login - only if user is actually authenticated AND has firstLogin true
        if (user.firstLogin === true) {
          setCurrentPage('first-time-login');
        } else {
          setCurrentPage('dashboard');
        }
      }
    } else {
    }
  }, [isAuthenticated, isLoading, manualNavigation, currentPage, user]);

  // Debug authentication state changes
  useEffect(() => {
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

  const handleNavigateToDepartmentDetail = React.useCallback((departmentId) => {
    setManualNavigation(true);
    setCurrentPage(`department-detail/${departmentId}`);
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
    
    // Clear manual navigation flag to allow auto-redirect
    setManualNavigation(false);
    
    // Immediately check authentication state and redirect
    if (isAuthenticated && user) {
      if (user.firstLogin === true) {
        setCurrentPage('first-time-login');
      } else {
        setCurrentPage('dashboard');
      }
    }
  }, [currentPage, user, isAuthenticated]);

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
            onNavigateToDashboard={handleNavigateToDashboard}
            onLoginSuccess={handleLoginSuccess}
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
            <Dashboard onNavigateToDepartmentDetail={handleNavigateToDepartmentDetail} />
          </ProtectedRoute>
        );
      case 'monitoring-test':
        return (
          <ProtectedRoute>
            <MonitoringTest />
          </ProtectedRoute>
        );
      case 'ai-model-test':
        return (
          <ProtectedRoute>
            <AIModelTestPage />
          </ProtectedRoute>
        );
      default:
        // Check if it's a complete-registration route
        if (currentPage.startsWith('complete-registration/')) {
          const token = currentPage.split('/')[1];
          return <CompleteRegistration token={token} />;
        }
        // Check if it's a department detail route
        if (currentPage.startsWith('department-detail/')) {
          const departmentId = currentPage.split('/')[1];
          console.log('App.js: Rendering DepartmentDetailPage with departmentId:', departmentId);
          return (
            <ProtectedRoute>
              <DepartmentDetailPage 
                departmentId={departmentId} 
                onBack={() => setCurrentPage('dashboard')}
              />
            </ProtectedRoute>
          );
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
