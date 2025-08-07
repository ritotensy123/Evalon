import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Business,
  School,
  Person,
} from '@mui/icons-material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme/constants';

const OnboardingPage = ({ selectedUserType, onNavigateToLanding }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleContinue = () => {
    if (selectedOption) {
      console.log('Selected option:', selectedOption);
      // Here you would proceed to the next step
    }
  };

  const options = [
    {
      id: 'organisation',
      title: 'Organisation',
      description: 'Institutions & Exam Bodies',
      illustration: '🏢',
      color: COLORS.PRIMARY,
      gradient: GRADIENTS.PRIMARY,
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'Educators & Examiners',
      illustration: '👨‍🏫',
      color: COLORS.SECONDARY,
      gradient: GRADIENTS.SECONDARY,
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Learners & Test Takers',
      illustration: '🎓',
      color: COLORS.SUCCESS,
      gradient: GRADIENTS.SUCCESS,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: { xs: 3, sm: 4, md: 5 },
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={onNavigateToLanding}
            sx={{
              color: '#6b7280',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s, all 0.2s ease',
              '&:hover': {
                backgroundColor: '#f3f4f6',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Main Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            py: { xs: 2, sm: 4, md: 6 },
            minHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 160px)', md: 'calc(100vh - 200px)' },
            justifyContent: 'center',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              mb: { xs: 6, sm: 8, md: 10 },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s',
            }}
          >
            <Typography
              variant={isSmallMobile ? 'h3' : 'h2'}
              sx={{
                fontWeight: TYPOGRAPHY.FONT_WEIGHT_EXTRABOLD,
                color: COLORS.TEXT_PRIMARY,
                mb: 2,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
              }}
            >
              What kind of user are you?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: COLORS.TEXT_SECONDARY,
                fontWeight: TYPOGRAPHY.FONT_WEIGHT_REGULAR,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                maxWidth: 600,
                mx: 'auto',
              }}
            >
              Choose the user type that best describes your role in the exam management system
            </Typography>
          </Box>

          {/* Options Cards */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 3, sm: 4, md: 6 },
              mb: { xs: 6, sm: 8, md: 10 },
              width: '100%',
              maxWidth: { xs: '100%', sm: 900, md: 1200 },
            }}
          >
            {options.map((option, index) => (
              <Paper
                key={option.id}
                elevation={0}
                sx={{
                  flex: 1,
                  borderRadius: BORDER_RADIUS.LG,
                  border: `2px solid ${selectedOption === option.id ? option.color : COLORS.GREY_200}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: selectedOption === option.id 
                    ? `${option.color}05`
                    : COLORS.BACKGROUND_PAPER,
                  '&:hover': {
                    borderColor: option.color,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 20px ${option.color}15`,
                  },
                }}
                onClick={() => handleOptionSelect(option.id)}
              >
                <Box
                  sx={{
                    p: { xs: 4, sm: 5, md: 6 },
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {/* Large Illustration */}
                  <Box
                    sx={{
                      fontSize: { xs: '4rem', sm: '5rem', md: '6rem' },
                      mb: 3,
                      opacity: selectedOption === option.id ? 1 : 0.8,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    {option.illustration}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant={isSmallMobile ? 'h4' : 'h3'}
                    sx={{
                      fontWeight: TYPOGRAPHY.FONT_WEIGHT_BOLD,
                      color: COLORS.TEXT_PRIMARY,
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    }}
                  >
                    {option.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: COLORS.TEXT_SECONDARY,
                      lineHeight: TYPOGRAPHY.LINE_HEIGHT_EXTRA_LOOSE,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                    }}
                  >
                    {option.description}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Navigation Dots */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              mb: { xs: 4, sm: 6, md: 8 },
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.6s ease 0.8s, transform 0.6s ease 0.8s',
            }}
          >
            {[1, 2, 3].map((dot, index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: index === 0 ? COLORS.PRIMARY : COLORS.GREY_300,
                  transition: 'background-color 0.3s ease',
                }}
              />
            ))}
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              maxWidth: 400,
              gap: 2,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.6s ease 1s, transform 0.6s ease 1s',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={onNavigateToLanding}
              sx={{
                borderColor: COLORS.GREY_300,
                color: COLORS.TEXT_SECONDARY,
                '&:hover': {
                  borderColor: COLORS.GREY_400,
                  backgroundColor: COLORS.GREY_50,
                },
              }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              endIcon={<ArrowForward />}
              onClick={handleContinue}
              disabled={!selectedOption}
              sx={{
                background: selectedOption ? GRADIENTS.PRIMARY : COLORS.GREY_300,
                color: 'white',
                '&:hover': {
                  background: selectedOption ? GRADIENTS.PRIMARY : COLORS.GREY_300,
                },
                '&:disabled': {
                  background: COLORS.GREY_300,
                  color: COLORS.GREY_400,
                },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default OnboardingPage; 