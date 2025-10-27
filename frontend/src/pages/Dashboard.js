import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import OrganizationDashboard from './dashboard/OrganizationDashboard';
import TeacherDashboard from './dashboard/TeacherDashboard';
import StudentDashboard from './dashboard/StudentDashboard';
import SubAdminDashboard from './dashboard/SubAdminDashboard';
import SystemSetupWizard from '../components/setup/SystemSetupWizard';
import api from '../services/api';

const Dashboard = ({ onNavigateToDepartmentDetail }) => {
  const { user, isLoading, isAuthenticated, organizationData, updateUser, updateDashboardData } = useAuth();
  const [setupStatus, setSetupStatus] = useState(null);
  const [checkingSetup, setCheckingSetup] = useState(false);

  // Debug logging
  console.log('🏠 Dashboard component rendered');
  console.log('🏠 User data:', user);
  console.log('🏠 Is authenticated:', isAuthenticated);
  console.log('🏠 Is loading:', isLoading);
  console.log('🏠 Organization data:', organizationData);

  // Check setup status for organization admins
  useEffect(() => {
    const checkSetupStatus = async () => {
      if (user?.userType === 'organization_admin' && user?.organizationId && !setupStatus) {
        setCheckingSetup(true);
        try {
          // Use organization data from context if available, otherwise fetch from API
          if (organizationData) {
            setSetupStatus({
              setupCompleted: organizationData.setupCompleted || false,
              setupCompletedAt: organizationData.setupCompletedAt,
              hasLogo: !!organizationData.logo,
              departmentsCount: organizationData.departments?.length || 0,
              subAdminsCount: organizationData.subAdmins?.length || 0,
              permissionsConfigured: !!organizationData.adminPermissions
            });
          } else {
            const response = await api.get(`/organization/${user.organizationId}/setup-status`);
            if (response.data.success) {
              setSetupStatus(response.data.data);
            }
          }
        } catch (error) {
          console.error('Error checking setup status:', error);
        } finally {
          setCheckingSetup(false);
        }
      }
    };

    checkSetupStatus();
  }, [user, setupStatus, organizationData]);

  // Handle setup completion
  const handleSetupComplete = () => {
    setSetupStatus(prev => ({ ...prev, setupCompleted: true }));
    // Update user context
    updateUser({
      ...user,
      setupCompleted: true,
      firstLogin: false
    });
  };

  // Show loading spinner while checking authentication or setup status
  if (isLoading || checkingSetup) {
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
    // Use React state navigation instead of window.location
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
          Authentication Required
        </Typography>
        <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
          Please log in to access your dashboard.
        </Typography>
      </Box>
    );
  }

  // Check if organization admin needs to complete setup (only on first login)
  if (user?.userType === 'organization_admin' && user?.firstLogin) {
    // Show setup wizard if setup is not completed or if we don't have setup status yet
    if (!setupStatus || !setupStatus.setupCompleted) {
      return <SystemSetupWizard onComplete={handleSetupComplete} onSkip={handleSetupComplete} />;
    }
  }

  // Render appropriate dashboard based on user type
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.userType) {
      case 'organization_admin':
        return <OrganizationDashboard onNavigateToDepartmentDetail={onNavigateToDepartmentDetail} />;
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