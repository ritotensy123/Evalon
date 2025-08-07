import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme/theme';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedUserType, setSelectedUserType] = useState(null);

  const handleNavigateToLanding = () => {
    setCurrentPage('landing');
  };

  const handleNavigateToLogin = () => {
    setCurrentPage('login');
  };

  const handleNavigateToOnboarding = (userType) => {
    setSelectedUserType(userType);
    setCurrentPage('onboarding');
    console.log('Navigating to onboarding for user type:', userType);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onNavigateToLogin={handleNavigateToLogin}
            onNavigateToOnboarding={handleNavigateToOnboarding}
          />
        );
      case 'login':
        return (
          <LoginPage
            onNavigateToLanding={handleNavigateToLanding}
          />
        );
      case 'onboarding':
        return (
          <OnboardingPage
            selectedUserType={selectedUserType}
            onNavigateToLanding={handleNavigateToLanding}
          />
        );
      default:
        return (
          <LandingPage
            onNavigateToLogin={handleNavigateToLogin}
            onNavigateToOnboarding={handleNavigateToOnboarding}
          />
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {renderCurrentPage()}
      </div>
    </ThemeProvider>
  );
}

export default App;
