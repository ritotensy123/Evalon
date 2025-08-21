import React, { useState, Suspense, lazy, memo } from 'react';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import theme from './theme/theme';
import './App.css';

// Lazy load all page components for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const OrganisationRegistration = lazy(() => import('./pages/onboarding/OrganisationRegistration'));
const TeacherRegistration = lazy(() => import('./pages/onboarding/TeacherRegistration'));

// Loading component for page transitions
const PageLoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    bgcolor="background.default"
  >
    <CircularProgress size={40} sx={{ color: 'primary.main' }} />
  </Box>
);

// Memoized page components to prevent unnecessary re-renders
const MemoizedLandingPage = memo(LandingPage);
const MemoizedLoginPage = memo(LoginPage);
const MemoizedOnboardingPage = memo(OnboardingPage);

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  // Memoized navigation functions to prevent unnecessary re-renders
  const handleNavigateToOnboarding = React.useCallback(() => {
    setCurrentPage('onboarding');
  }, []);

  const handleNavigateToLogin = React.useCallback(() => {
    setCurrentPage('login');
  }, []);

  const handleNavigateToLanding = React.useCallback(() => {
    setCurrentPage('landing');
  }, []);

  const handleNavigateToRegister = React.useCallback(() => {
    setCurrentPage('register');
  }, []);

  // Onboarding navigation functions
  const handleNavigateToOrgOnboarding = React.useCallback(() => {
    setCurrentPage('organisation-registration');
  }, []);

  const handleNavigateToTeacherOnboarding = React.useCallback(() => {
    setCurrentPage('teacher-onboarding');
  }, []);

  const handleNavigateToStudentOnboarding = React.useCallback(() => {
    setCurrentPage('student-onboarding');
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <MemoizedLandingPage
              onNavigateToOnboarding={handleNavigateToOnboarding}
              onNavigateToLogin={handleNavigateToLogin}
            />
          </Suspense>
        );
      case 'login':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <MemoizedLoginPage
              onNavigateToLanding={handleNavigateToLanding}
              onNavigateToRegister={handleNavigateToOnboarding}
            />
          </Suspense>
        );
      case 'onboarding':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <MemoizedOnboardingPage
              onNavigateToLanding={handleNavigateToLanding}
              onNavigateToLogin={handleNavigateToLogin}
              onNavigateToOrgOnboarding={handleNavigateToOrgOnboarding}
              onNavigateToTeacherOnboarding={handleNavigateToTeacherOnboarding}
              onNavigateToStudentOnboarding={handleNavigateToStudentOnboarding}
            />
          </Suspense>
        );
      case 'organisation-registration':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <OrganisationRegistration
              onNavigateToLanding={handleNavigateToLanding}
              onNavigateToLogin={handleNavigateToLogin}
            />
          </Suspense>
        );
      case 'teacher-onboarding':
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <TeacherRegistration
              onNavigateToLanding={handleNavigateToLanding}
              onNavigateToLogin={handleNavigateToLogin}
            />
          </Suspense>
        );
      case 'student-onboarding':
        return <div>Student Onboarding (Coming Soon)</div>;
      case 'register':
        return <div>Register Page (Coming Soon)</div>;
      default:
        return (
          <Suspense fallback={<PageLoadingFallback />}>
            <MemoizedLandingPage
              onNavigateToOnboarding={handleNavigateToOnboarding}
              onNavigateToLogin={handleNavigateToLogin}
            />
          </Suspense>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {renderPage()}
    </ThemeProvider>
  );
}

export default App;
