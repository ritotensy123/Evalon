import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Chip,
} from '@mui/material';
import {
  ArrowForward,
  Login,
  AutoAwesome,
  School,
} from '@mui/icons-material';

const LandingPage = ({ onNavigateToOnboarding, onNavigateToLogin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Faster loading with reduced delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200); // Reduced from 500ms to 200ms

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    onNavigateToOnboarding();
  };

  const handleLogin = () => {
    onNavigateToLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Simplified Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: -80, sm: -60, md: -100 },
          right: { xs: -80, sm: -60, md: -100 },
          width: { xs: 160, sm: 180, md: 300 },
          height: { xs: 160, sm: 180, md: 300 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)',
          zIndex: 0,
          opacity: 0.4, // Reduced opacity for better performance
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: -40, sm: -30, md: -50 },
          left: { xs: -40, sm: -30, md: -50 },
          width: { xs: 120, sm: 140, md: 200 },
          height: { xs: 120, sm: 140, md: 200 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)',
          zIndex: 0,
          opacity: 0.4, // Reduced opacity for better performance
        }}
      />

      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 1, 
          px: { xs: 3, sm: 4, md: 4 },
          py: { xs: 0, sm: 0, md: 0 }
        }}
      >
        {/* Header - Simplified Animation */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: { xs: 2, sm: 2, md: 3 },
            px: { xs: 0, sm: 0, md: 0 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            mb: { xs: 1, sm: 0, md: 0 },
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            {/* Logo */}
            <Box
              sx={{
                position: 'relative',
                width: { xs: 48, sm: 44, md: 48 },
                height: { xs: 48, sm: 44, md: 48 },
                mr: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: { xs: 40, sm: 36, md: 40 },
                  height: { xs: 40, sm: 36, md: 40 },
                  borderRadius: { xs: '12px', sm: '10px', md: '12px' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    borderRadius: { xs: '14px', sm: '12px', md: '14px' },
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    zIndex: -1,
                    opacity: 0.3,
                  },
                }}
              >
                <School sx={{ fontSize: { xs: 20, sm: 18, md: 24 }, color: 'white' }} />
              </Box>
            </Box>
            <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography
                variant={isSmallMobile ? 'h4' : 'h4'}
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                }}
              >
                Evalon
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block',
                  mt: { xs: 0.5, sm: 0 },
                }}
              >
                Next-Gen Education
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<Login />}
            onClick={handleLogin}
            sx={{
              borderColor: '#d1d5db',
              color: '#374151',
              borderRadius: '12px',
              px: { xs: 3, sm: 2.5, md: 3 },
              py: { xs: 1.5, sm: 1.25, md: 1.5 },
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
              minHeight: { xs: 44, sm: 40, md: 40 },
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                borderColor: '#667eea',
                backgroundColor: '#f8fafc',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </Button>
        </Box>

        {/* Hero Section - Optimized Animations */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: { xs: 3, sm: 4, md: 8 },
            px: { xs: 2, sm: 3, md: 0 },
            minHeight: { xs: 'calc(100vh - 120px)', sm: 'calc(100vh - 100px)', md: 'calc(100vh - 200px)' },
            justifyContent: 'center',
          }}
        >
          {/* Chip - Simplified Animation */}
          <Box 
            sx={{ 
              mb: { xs: 2, sm: 2 },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s',
            }}
          >
            <Chip
              icon={<AutoAwesome sx={{ fontSize: { xs: 14, sm: 16 } }} />}
              label="AI-Powered Platform"
              sx={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontWeight: 700,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                height: { xs: 28, sm: 32 },
                px: { xs: 1.5, sm: 1.5 },
                '& .MuiChip-label': {
                  px: { xs: 0.5, sm: 0.5 },
                },
              }}
            />
          </Box>

          {/* Main Title - Simplified Animation */}
          <Typography
            variant={isSmallMobile ? 'h2' : isMobile ? 'h1' : 'h1'}
            sx={{
              fontWeight: 800,
              mb: { xs: 2, sm: 2 },
              color: '#111827',
              maxWidth: { xs: '100%', sm: 800, md: 900 },
              lineHeight: { xs: 1.1, sm: 1.1 },
              letterSpacing: '-0.025em',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.75rem' },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
            }}
          >
            The Future of
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                ml: { xs: 0.5, sm: 1 },
                display: 'block',
                mt: { xs: 0.5, sm: 0 },
              }}
            >
              Educational Excellence
            </Box>
          </Typography>

          {/* Description - Simplified Animation */}
          <Typography
            variant={isSmallMobile ? 'body1' : 'h6'}
            color="text.secondary"
            sx={{ 
              mb: { xs: 3, sm: 4, md: 6 }, 
              maxWidth: { xs: '100%', sm: 500, md: 600 }, 
              lineHeight: { xs: 1.5, sm: 1.6 }, 
              fontWeight: 400,
              color: '#6b7280',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s',
            }}
          >
            Revolutionizing how institutions, educators, and students connect, learn, and grow together in the digital age.
          </Typography>

          {/* Buttons - Simplified Animation */}
          <Box 
            sx={{ 
              display: 'flex', 
              gap: { xs: 2, sm: 2 }, 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'auto' },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.4s ease 0.4s, transform 0.4s ease 0.4s',
            }}
          >
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                py: { xs: 2, sm: 2 },
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1rem' },
                fontWeight: 700,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                width: { xs: '100%', sm: 'auto' },
                minHeight: { xs: 48, sm: 48 },
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  boxShadow: '0 15px 35px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Start Your Journey
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                py: { xs: 2, sm: 2 },
                px: { xs: 3, sm: 4 },
                fontSize: { xs: '1rem', sm: '1rem' },
                fontWeight: 600,
                borderRadius: '16px',
                borderColor: '#d1d5db',
                color: '#374151',
                width: { xs: '100%', sm: 'auto' },
                minHeight: { xs: 48, sm: 48 },
                borderWidth: '2px',
                '&:hover': {
                  borderColor: '#667eea',
                  backgroundColor: '#f8fafc',
                  transform: 'translateY(-1px)',
                  borderWidth: '2px',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Watch Demo
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 