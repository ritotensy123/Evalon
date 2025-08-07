import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  useMediaQuery,
  Link,
  Fade,
  Grow,
} from '@mui/material';
import {
  Business,
  School,
  Person,
  Login,
  ArrowForward,
  Check,
} from '@mui/icons-material';
import { COLORS, GRADIENTS } from '../theme/constants';

const OnboardingPage = ({ onNavigateToLanding, onNavigateToLogin, onNavigateToOrgOnboarding, onNavigateToTeacherOnboarding, onNavigateToStudentOnboarding }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleCardSelect = (cardType) => {
    setSelectedCard(cardType);
  };

  const handleContinue = () => {
    if (!selectedCard) return;
    
    switch (selectedCard) {
      case 'organisation':
        onNavigateToOrgOnboarding();
        break;
      case 'teacher':
        onNavigateToTeacherOnboarding();
        break;
      case 'student':
        onNavigateToStudentOnboarding();
        break;
      default:
        break;
    }
  };

  const cards = [
    {
      type: 'organisation',
      title: 'Organization',
      description: 'Administer Your Institution',
      icon: <Business />,
      color: '#667eea',
    },
    {
      type: 'teacher',
      title: 'Teacher',
      description: 'Schedule & Monitor Assessments',
      icon: <School />,
      color: '#7dd87d',
    },
    {
      type: 'student',
      title: 'Student',
      description: 'Attend Secure Exams & Track Progress',
      icon: <Person />,
      color: '#4facfe',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 2, sm: 3, md: 0 },
      }}
    >
      {/* Subtle Background Elements - Matching Login/Landing */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: { xs: 200, sm: 250, md: 300 },
          height: { xs: 200, sm: 250, md: 300 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)',
          zIndex: 0,
          opacity: 0.3,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: { xs: 150, sm: 180, md: 200 },
          height: { xs: 150, sm: 180, md: 200 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)',
          zIndex: 0,
          opacity: 0.25,
        }}
      />

      {/* Floating Elements - Matching Login Page */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: { xs: '5%', sm: '10%' },
          width: { xs: 6, sm: 8 },
          height: { xs: 6, sm: 8 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          opacity: 0.3,
          animation: 'float1 8s ease-in-out infinite',
          '@keyframes float1': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-15px) translateX(10px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '25%',
          left: { xs: '10%', sm: '15%' },
          width: { xs: 4, sm: 6 },
          height: { xs: 4, sm: 6 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #f093fb, #f5576c)',
          opacity: 0.2,
          animation: 'float2 10s ease-in-out infinite',
          '@keyframes float2': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-12px) translateX(-8px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          right: { xs: '15%', sm: '20%' },
          width: { xs: 3, sm: 4 },
          height: { xs: 3, sm: 4 },
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
          opacity: 0.25,
          animation: 'float3 12s ease-in-out infinite',
          '@keyframes float3': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-8px) translateX(5px)' },
          },
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={isLoaded} timeout={600}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 5 } }}>
            <Grow in={isLoaded} timeout={800}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: { xs: 1, sm: 1.5, md: 2 },
                  fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem', lg: '2rem' },
                  letterSpacing: '0.02em',
                  lineHeight: 1.4,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: '1px',
                  },
                }}
              >
                Choose Your Role
              </Typography>
            </Grow>
            
            <Fade in={isLoaded} timeout={1000}>
              <Typography
                variant="body1"
                sx={{
                  color: COLORS.TEXT_SECONDARY,
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                  maxWidth: { xs: 280, sm: 350, md: 400 },
                  mx: 'auto',
                  lineHeight: 1.6,
                  px: { xs: 2, sm: 0 },
                  opacity: 0.8,
                }}
              >
                Select how you'll be using Evalon
              </Typography>
            </Fade>
          </Box>
        </Fade>

        <Grow in={isLoaded} timeout={1200}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 3.5, sm: 4, md: 5 },
              mb: { xs: 3, sm: 4, md: 5 },
              flexWrap: 'wrap',
              px: { xs: 1, sm: 0 },
            }}
          >
            {cards.map((card, index) => (
              <Fade in={isLoaded} timeout={1400 + index * 150} key={card.type}>
                <Card
                  onClick={() => handleCardSelect(card.type)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: 'white',
                    border: selectedCard === card.type 
                      ? `2px solid ${card.color}` 
                      : '2px solid transparent',
                    boxShadow: selectedCard === card.type 
                      ? `0 6px 20px ${card.color}25` 
                      : '0 3px 10px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    width: { xs: 160, sm: 180, md: 200 },
                    height: { xs: 160, sm: 180, md: 200 },
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      borderColor: card.color,
                      boxShadow: `0 6px 16px ${card.color}20`,
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {/* Selection Indicator - Top Border */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: card.color,
                      transform: selectedCard === card.type ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.3s ease',
                    }}
                  />

                  <CardContent 
                    sx={{ 
                      p: { xs: 2.5, sm: 3 }, 
                      textAlign: 'center', 
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      height: '100%',
                      flex: 1,
                    }}
                  >
                    {/* Icon Container */}
                    <Box
                      sx={{
                        width: { xs: 48, sm: 52, md: 56 },
                        height: { xs: 48, sm: 52, md: 56 },
                        borderRadius: 2,
                        background: selectedCard === card.type 
                          ? card.color
                          : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: { xs: 1.5, sm: 2 },
                        mx: 'auto',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        border: selectedCard === card.type 
                          ? 'none'
                          : '1px solid #e2e8f0',
                      }}
                    >
                      <Box
                        sx={{
                          color: selectedCard === card.type ? 'white' : COLORS.TEXT_SECONDARY,
                          fontSize: { xs: 26, sm: 28, md: 30 },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {card.icon}
                      </Box>
                      
                      {/* Check Mark Overlay */}
                      {selectedCard === card.type && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -3,
                            right: -3,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: 'white',
                            border: `2px solid ${card.color}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'slideIn 0.3s ease',
                          }}
                        >
                          <Check sx={{ fontSize: 8, color: card.color }} />
                        </Box>
                      )}
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: COLORS.TEXT_PRIMARY,
                        mb: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: COLORS.TEXT_SECONDARY,
                        fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                        lineHeight: 1.4,
                        mb: 'auto',
                      }}
                    >
                      {card.description}
                    </Typography>

                    {/* Bottom Selection Line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: selectedCard === card.type ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                        width: '60%',
                        height: '3px',
                        background: card.color,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>
        </Grow>

        <Fade in={isLoaded} timeout={1800}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              px: { xs: 2, sm: 0 },
            }}
          >
            {/* Clean Text "Already have an account" section */}
            <Box
              sx={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.TEXT_SECONDARY,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                Already have an account?
              </Typography>
              <Link
                onClick={onNavigateToLogin}
                sx={{
                  color: COLORS.PRIMARY,
                  textDecoration: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  padding: 0.5,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#5a67d8',
                    background: 'rgba(102, 126, 234, 0.05)',
                  },
                }}
              >
                <Login sx={{ fontSize: { xs: 12, sm: 14 } }} />
                Sign in to your account
              </Link>
            </Box>

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 2, sm: 2.5 },
                flexDirection: { xs: 'column', sm: 'row' },
                width: { xs: '100%', sm: 'auto' },
                maxWidth: { xs: 280, sm: 'none' },
              }}
            >
              <Button
                variant="outlined"
                onClick={onNavigateToLanding}
                fullWidth={isSmallMobile}
                sx={{
                  borderColor: '#d1d5db',
                  color: COLORS.TEXT_PRIMARY,
                  borderRadius: 2,
                  px: { xs: 3, sm: 3.5 },
                  py: { xs: 1, sm: 1.25 },
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '&:hover': {
                    borderColor: COLORS.PRIMARY,
                    background: 'rgba(102, 126, 234, 0.04)',
                  },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleContinue}
                disabled={!selectedCard}
                endIcon={<ArrowForward />}
                fullWidth={isSmallMobile}
                sx={{
                  background: selectedCard ? GRADIENTS.PRIMARY : '#e5e7eb',
                  color: selectedCard ? 'white' : '#9ca3af',
                  borderRadius: 2,
                  px: { xs: 3.5, sm: 4 },
                  py: { xs: 1, sm: 1.25 },
                  fontWeight: 500,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '&:hover': {
                    background: selectedCard ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)' : '#e5e7eb',
                  },
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af',
                  },
                }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default OnboardingPage; 