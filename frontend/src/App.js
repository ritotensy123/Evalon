import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  const handleNavigateToOnboarding = () => {
    setCurrentPage('onboarding');
  };

  const handleNavigateToLogin = () => {
    setCurrentPage('login');
  };

  const handleNavigateToLanding = () => {
    setCurrentPage('landing');
  };

  const handleNavigateToRegister = () => {
    setCurrentPage('register');
  };

  // Onboarding navigation functions
  const handleNavigateToOrgOnboarding = () => {
    setCurrentPage('org-onboarding');
  };

  const handleNavigateToTeacherOnboarding = () => {
    setCurrentPage('teacher-onboarding');
  };

  const handleNavigateToStudentOnboarding = () => {
    setCurrentPage('student-onboarding');
  };

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
            onNavigateToRegister={handleNavigateToRegister}
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
      case 'org-onboarding':
        return <div>Organisation Onboarding (Coming Soon)</div>;
      case 'teacher-onboarding':
        return <div>Teacher Onboarding (Coming Soon)</div>;
      case 'student-onboarding':
        return <div>Student Onboarding (Coming Soon)</div>;
      case 'register':
        return <div>Register Page (Coming Soon)</div>;
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
