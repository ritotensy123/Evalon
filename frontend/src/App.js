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
import CompleteRegistration from './pages/CompleteRegistration';
import FirstTimeLoginWizard from './components/FirstTimeLoginWizard';
import DepartmentDetailPage from './pages/dashboard/DepartmentDetailPage';
import MonitoringTest from './pages/dashboard/MonitoringTest';
import AIModelTestPage from './pages/AIModelTestPage';
import OrganizationProfile from './pages/dashboard/OrganizationProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * ROUTING ARCHITECTURE
 * ====================
 * 
 * This App.js handles TWO separate onboarding layers:
 * 
 * 1. USER-LEVEL ONBOARDING (password/profile setup)
 *    - Applies ONLY to: teachers, students, sub_admins
 *    - Blocks dashboard access until completed
 *    - Handled by: FirstTimeLoginWizard
 *    - Organization admins MUST bypass this
 * 
 * 2. ORGANIZATION ONBOARDING (departments/setup)
 *    - Applies ONLY to: organization_admin
 *    - Optional and non-blocking
 *    - Handled inside: Dashboard component
 *    - NEVER appears in App.js routing
 * 
 * ROUTING ORDER:
 * 1. Authentication guard
 * 2. User-level onboarding (ROLE-AWARE - excludes organization_admin)
 * 3. Normal application routing (dashboard, pages)
 * 
 * Organization onboarding is handled inside Dashboard and is completely
 * separate from App.js routing logic.
 */

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
    } else if (path === '/profile' || path === '/organization/profile') {
      setCurrentPage('profile');
      setManualNavigation(true);
    } else {
      setCurrentPage('landing');
      setManualNavigation(false);
    }
  }, []);

  // STEP 1: Authentication guard and routing logic
  useEffect(() => {
    // Only auto-redirect if not manually navigating
    if (!manualNavigation) {
      // STEP 1: Auth guard - if not authenticated, go to landing
      if (!isAuthenticated && !isLoading) {
        setCurrentPage('landing');
        return;
      }
      
      // STEP 2: User-level onboarding (ROLE-AWARE) - only for non-organization users
      if (isAuthenticated && user && (currentPage === 'landing' || currentPage === 'login')) {
        // IMPORTANT: Organization admins COMPLETELY bypass first-time login
        // Ignore firstLogin flag entirely for organization admins
        if (user.userType === 'organization_admin') {
          // Organization admins always go directly to dashboard
          // Organization onboarding (optional, non-blocking) is handled inside Dashboard
          setCurrentPage('dashboard');
          return;
        }
        
        // For teachers: FirstTimeLoginWizard ONLY for admin-created teachers
        // Business rule: Show wizard ONLY when:
        // - userType === 'teacher'
        // - firstLogin === true
        // - authProvider === 'temporary_password'
        if (user.userType === 'teacher') {
          const isAdminCreatedTeacher = user.firstLogin === true && 
                                       user.authProvider === 'temporary_password';
          
          if (isAdminCreatedTeacher) {
            setCurrentPage('first-time-login');
            return;
          } else {
            // Self-registered teachers skip FirstTimeLoginWizard
            setCurrentPage('dashboard');
            return;
          }
        }
        
        // For other user types: check if first-login wizard is needed
        const needsUserOnboarding = user.firstLogin === true;
        
        if (needsUserOnboarding) {
          setCurrentPage('first-time-login');
        } else {
          // STEP 4: Normal routing - go to dashboard
          setCurrentPage('dashboard');
        }
      }
    }
  }, [isAuthenticated, isLoading, manualNavigation, currentPage, user]);


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

  const handleNavigateToProfile = React.useCallback(() => {
    setManualNavigation(true);
    setCurrentPage('profile');
  }, []);

  const handleNavigateToCompleteRegistration = React.useCallback((token) => {
    setManualNavigation(true);
    setCurrentPage(`complete-registration/${token}`);
  }, []);

  // Handle successful login
  const handleLoginSuccess = React.useCallback(() => {
    // Clear manual navigation flag to allow auto-redirect
    setManualNavigation(false);
    
    // STEP 2: User-level onboarding (ROLE-AWARE)
    // IMPORTANT: Organization admins COMPLETELY bypass first-time login
    if (isAuthenticated && user) {
      // Organization admins always go directly to dashboard
      // Ignore firstLogin flag entirely for organization admins
      if (user.userType === 'organization_admin') {
        setCurrentPage('dashboard');
        return;
      }
      
      // For teachers: FirstTimeLoginWizard ONLY for admin-created teachers
      // Business rule: Show wizard ONLY when:
      // - userType === 'teacher'
      // - firstLogin === true
      // - authProvider === 'temporary_password'
      if (user.userType === 'teacher') {
        const isAdminCreatedTeacher = user.firstLogin === true && 
                                     user.authProvider === 'temporary_password';
        
        if (isAdminCreatedTeacher) {
          setCurrentPage('first-time-login');
          return;
        } else {
          // Self-registered teachers skip FirstTimeLoginWizard
          setCurrentPage('dashboard');
          return;
        }
      }
      
      // For other user types: check if first-login wizard is needed
      const needsUserOnboarding = user.firstLogin === true;
      
      if (needsUserOnboarding) {
        setCurrentPage('first-time-login');
      } else {
        // STEP 4: Normal routing - go to dashboard
        setCurrentPage('dashboard');
      }
    }
  }, [user, isAuthenticated]);

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
      case 'first-time-login':
        // STEP 2: User-level onboarding (ROLE-AWARE)
        // IMPORTANT: Organization admins COMPLETELY bypass first-time login
        if (!isAuthenticated || !user) {
          // Not authenticated - redirect to landing
          setCurrentPage('landing');
          return null;
        }
        
        // CRITICAL: Organization admins MUST NEVER see FirstTimeLoginWizard
        // Ignore firstLogin flag entirely - always redirect to dashboard
        if (user.userType === 'organization_admin') {
          setCurrentPage('dashboard');
          return null;
        }
        
        // Only show wizard if user needs first-login setup (password/profile)
        // This applies ONLY to: teachers, students, sub_admins
        if (user.firstLogin !== true) {
          // Already completed first login - go to dashboard
          setCurrentPage('dashboard');
          return null;
        }
        
        // Render FirstTimeLoginWizard for teachers/students/sub_admins only
        return (
          <ProtectedRoute>
            <FirstTimeLoginWizard />
          </ProtectedRoute>
        );
      case 'dashboard':
        return (
          <ProtectedRoute>
            <Dashboard 
              onNavigateToDepartmentDetail={handleNavigateToDepartmentDetail}
              onNavigateToProfile={handleNavigateToProfile}
            />
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
      case 'profile':
        return (
          <ProtectedRoute>
            <OrganizationProfile />
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
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {renderPage()}
        </div>
      </div>
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
