import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
} from '@mui/material';
import {
  ArrowForward,
} from '@mui/icons-material';

const LandingPage = ({ onNavigateToLogin, onNavigateToOnboarding }) => {
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
            Welcome to Evalon
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: '#6b7280',
              mb: 6,
              fontWeight: 400,
            }}
          >
            Exam Management System
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => onNavigateToOnboarding('organisation')}
              sx={{
                background: '#667eea',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  background: '#5a67d8',
                },
              }}
            >
              Get Started
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={onNavigateToLogin}
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
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 