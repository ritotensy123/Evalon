import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import OrganisationRegistration from './pages/onboarding/OrganisationRegistration';
import TeacherRegistration from './pages/onboarding/TeacherRegistration';
import StudentRegistration from './pages/onboarding/StudentRegistration';



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
      default:
        return (
          <LandingPage
            onNavigateToOnboarding={handleNavigateToOnboarding}
            onNavigateToLogin={handleNavigateToLogin}
          />
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
