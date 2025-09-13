import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import OrganizationDashboard from './dashboard/OrganizationDashboard';
import TeacherDashboard from './dashboard/TeacherDashboard';
import StudentDashboard from './dashboard/StudentDashboard';
import SubAdminDashboard from './dashboard/SubAdminDashboard';

const Dashboard = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 500 }}>
          Loading Dashboard...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  // Render appropriate dashboard based on user type
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.userType) {
      case 'organization_admin':
        return <OrganizationDashboard />;
      case 'sub_admin':
        return <SubAdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
              Unknown User Type
            </Typography>
            <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
              Please contact support for assistance.
            </Typography>
          </Box>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;
