import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import {
  ArrowBack,
} from '@mui/icons-material';

const LoginPage = ({ onNavigateToLanding }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              color: '#111827',
              mb: 3,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
            }}
          >
            Sign In
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: '#6b7280',
              mb: 6,
              fontWeight: 400,
            }}
          >
            Welcome back to Evalon
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={onNavigateToLanding}
              sx={{
                borderColor: '#d1d5db',
                color: '#6b7280',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#9ca3af',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Back to Home
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 