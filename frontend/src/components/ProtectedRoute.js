import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

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
          Verifying Authentication...
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
          Please log in to access this page.
        </Typography>
      </Box>
    );
  }

  // Check role-based access if required
  if (requiredRole && user?.userType !== requiredRole) {
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
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ color: 'white', opacity: 0.8 }}>
          You don't have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
