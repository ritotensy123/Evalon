import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  School,
  TrendingUp,
  Security,
  AdminPanelSettings,
  Person,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme/constants';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = ({ onNavigateToLanding, onNavigateToRegister, onNavigateToDashboard }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [userType, setUserType] = useState('organization_admin');

  useEffect(() => {
    // Quick loading animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  const handleCheckboxChange = (event) => {
    setFormData({
      ...formData,
      rememberMe: event.target.checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setFormErrors({});
    
    // Basic validation
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', { email: formData.email, userType });
      const result = await login(formData.email, formData.password, userType);
      
      console.log('Login result:', result);
      if (result.success) {
        console.log('Login successful, calling onNavigateToDashboard');
        // Login successful - navigate to dashboard
        if (onNavigateToDashboard) {
          console.log('Calling onNavigateToDashboard callback');
          onNavigateToDashboard();
          console.log('onNavigateToDashboard callback called');
        } else {
          console.log('onNavigateToDashboard callback is not available');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Minimal Floating Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 8,
          height: 8,
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
          left: '15%',
          width: 6,
          height: 6,
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
          right: '20%',
          width: 4,
          height: 4,
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
      <Box
        sx={{
          position: 'absolute',
          bottom: '30%',
          left: '10%',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #43e97b, #38f9d7)',
          opacity: 0.2,
          animation: 'float4 9s ease-in-out infinite',
          '@keyframes float4': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-18px) translateX(-12px)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          left: '5%',
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #fa709a, #fee140)',
          opacity: 0.15,
          animation: 'float5 11s ease-in-out infinite',
          '@keyframes float5': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-10px) translateX(8px)' },
          },
        }}
      />

      {/* Subtle Background Gradients */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%)',
          zIndex: 0,
          opacity: 0.3,
          animation: 'pulse 15s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
            '50%': { transform: 'scale(1.05) rotate(180deg)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #fef3c7 0%, #fde68a 100%)',
          zIndex: 0,
          opacity: 0.25,
          animation: 'pulse 18s ease-in-out infinite reverse',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
            '50%': { transform: 'scale(1.05) rotate(-180deg)' },
          },
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
          }}
        >
          {/* Left Section - Enhanced Illustration with Subtle Animations */}
          {!isMobile && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pr: 4,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? 'translateX(0)' : 'translateX(-20px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 500,
                  height: 500,
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 30% 20%, ${COLORS.PRIMARY}08 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, ${COLORS.SECONDARY}08 0%, transparent 50%)
                    `,
                  },
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  },
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  animation: 'cardFloat 4s ease-in-out infinite',
                  '@keyframes cardFloat': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                  },
                }}
              >
                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1, px: 4 }}>
                  {/* Enhanced Animated Logo */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      background: GRADIENTS.PRIMARY,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: SHADOWS.LG,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        left: -2,
                        right: -2,
                        bottom: -2,
                        borderRadius: 22,
                        background: GRADIENTS.PRIMARY,
                        zIndex: -1,
                        opacity: 0.2,
                      },
                      '&:hover': {
                        transform: 'scale(1.05)',
                        '& .logo-icon': {
                          transform: 'scale(1.1)',
                        },
                      },
                      transition: 'transform 0.3s ease',
                      animation: 'logoPulse 3s ease-in-out infinite',
                      '@keyframes logoPulse': {
                        '0%, 100%': { 
                          transform: 'scale(1)',
                          boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                        },
                        '50%': { 
                          transform: 'scale(1.05)',
                          boxShadow: '0 20px 40px rgba(102, 126, 234, 0.5)',
                        },
                      },
                    }}
                  >
                    <School 
                      className="logo-icon"
                      sx={{ 
                        fontSize: 40, 
                        color: 'white',
                        transition: 'transform 0.3s ease',
                        animation: 'iconFloat 2.5s ease-in-out infinite',
                        '@keyframes iconFloat': {
                          '0%, 100%': { transform: 'translateY(0px)' },
                          '50%': { transform: 'translateY(-4px)' },
                        },
                      }} 
                    />
                  </Box>
                  
                  {/* Enhanced Brand Name Animation */}
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      background: GRADIENTS.PRIMARY,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                      letterSpacing: '-0.02em',
                      animation: 'textGlow 4s ease-in-out infinite',
                      '@keyframes textGlow': {
                        '0%, 100%': { 
                          filter: 'brightness(1)',
                          transform: 'scale(1)',
                        },
                        '50%': { 
                          filter: 'brightness(1.1)',
                          transform: 'scale(1.03)',
                        },
                      },
                    }}
                  >
                    Evalon
                  </Typography>
                  
                  {/* Enhanced Tagline Animation */}
                  <Typography
                    variant="h6"
                    sx={{
                      color: COLORS.TEXT_SECONDARY,
                      fontWeight: 500,
                      mb: 3,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      animation: 'fadeInOut 3s ease-in-out infinite',
                      '@keyframes fadeInOut': {
                        '0%, 100%': { opacity: 0.6 },
                        '50%': { opacity: 1 },
                      },
                    }}
                  >
                    Next-Gen Education
                  </Typography>

                  {/* Enhanced Feature Icons with More Visible Animation */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 3 }}>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
                        },
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: 'iconFloat1 2.5s ease-in-out infinite',
                        '@keyframes iconFloat1': {
                          '0%, 100%': { transform: 'translateY(0px)' },
                          '50%': { transform: 'translateY(-6px)' },
                        },
                      }}
                    >
                      <TrendingUp 
                        sx={{ 
                          fontSize: 24, 
                          color: COLORS.SUCCESS,
                          animation: 'iconRotate 4s ease-in-out infinite',
                          '@keyframes iconRotate': {
                            '0%, 100%': { transform: 'rotate(0deg)' },
                            '50%': { transform: 'rotate(8deg)' },
                          },
                        }} 
                      />
                    </Box>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                        },
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                        animation: 'iconFloat2 3s ease-in-out infinite',
                        '@keyframes iconFloat2': {
                          '0%, 100%': { transform: 'translateY(0px)' },
                          '50%': { transform: 'translateY(-6px)' },
                        },
                      }}
                    >
                      <Security 
                        sx={{ 
                          fontSize: 24, 
                          color: COLORS.INFO,
                          animation: 'iconRotate 4s ease-in-out infinite reverse',
                          '@keyframes iconRotate': {
                            '0%, 100%': { transform: 'rotate(0deg)' },
                            '50%': { transform: 'rotate(-8deg)' },
                          },
                        }} 
                      />
                    </Box>
                  </Box>

                  {/* Enhanced Description Animation */}
                  <Typography
                    variant="body1"
                    sx={{
                      color: COLORS.TEXT_SECONDARY,
                      maxWidth: 280,
                      mx: 'auto',
                      lineHeight: 1.5,
                      fontSize: '1rem',
                      animation: 'textBreath 5s ease-in-out infinite',
                      '@keyframes textBreath': {
                        '0%, 100%': { 
                          opacity: 0.7,
                          transform: 'scale(1)',
                        },
                        '50%': { 
                          opacity: 1,
                          transform: 'scale(1.03)',
                        },
                      },
                    }}
                  >
                    Sign in to your Evalon account and continue your educational journey.
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Right Section - Login Form with Minimal Animations */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: { xs: 0, md: 4 },
              maxWidth: { xs: '100%', md: 400 },
              mx: 'auto',
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? 'translateX(0)' : 'translateX(20px)',
              transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
            }}
          >
            <Box>
              {/* Back Button */}
              <Button
                startIcon={<ArrowBack />}
                onClick={onNavigateToLanding}
                sx={{
                  color: COLORS.TEXT_SECONDARY,
                  mb: 3,
                  '&:hover': {
                    backgroundColor: COLORS.GREY_100,
                    transform: 'translateX(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Back to Home
              </Button>

              {/* Logo and Header */}
              <Box 
                sx={{ 
                  mb: 3,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: GRADIENTS.PRIMARY,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: 'white',
                      fontWeight: 800,
                    }}
                  >
                    E
                  </Typography>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: COLORS.TEXT_PRIMARY,
                    mb: 1,
                  }}
                >
                  Login
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: COLORS.TEXT_SECONDARY,
                    lineHeight: 1.5,
                  }}
                >
                  Login to your account
                </Typography>
              </Box>

              {/* User Type Selection - Horizontal Compact Design */}
              <Box 
                sx={{ 
                  mb: 3,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
                }}
              >
                <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', fontWeight: 500, fontSize: '0.875rem' }}>
                  I am a:
                </Typography>
                
                {/* Horizontal Compact Selection */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                  {/* Organization Admin */}
                  <Box
                    onClick={() => setUserType('organization_admin')}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: BORDER_RADIUS.MD,
                      border: userType === 'organization_admin' ? `2px solid ${COLORS.PRIMARY}` : '1px solid #e2e8f0',
                      backgroundColor: userType === 'organization_admin' ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      '&:hover': {
                        borderColor: COLORS.PRIMARY,
                        backgroundColor: userType === 'organization_admin' ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: userType === 'organization_admin' ? COLORS.PRIMARY : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <AdminPanelSettings 
                        sx={{ 
                          fontSize: 14, 
                          color: userType === 'organization_admin' ? 'white' : COLORS.TEXT_SECONDARY,
                          transition: 'color 0.2s ease',
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      fontWeight: userType === 'organization_admin' ? 600 : 500, 
                      color: userType === 'organization_admin' ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                    }}>
                      Admin
                    </Typography>
                  </Box>

                  {/* Teacher */}
                  <Box
                    onClick={() => setUserType('teacher')}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: BORDER_RADIUS.MD,
                      border: userType === 'teacher' ? `2px solid ${COLORS.PRIMARY}` : '1px solid #e2e8f0',
                      backgroundColor: userType === 'teacher' ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      '&:hover': {
                        borderColor: COLORS.PRIMARY,
                        backgroundColor: userType === 'teacher' ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: userType === 'teacher' ? COLORS.PRIMARY : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <School 
                        sx={{ 
                          fontSize: 14, 
                          color: userType === 'teacher' ? 'white' : COLORS.TEXT_SECONDARY,
                          transition: 'color 0.2s ease',
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      fontWeight: userType === 'teacher' ? 600 : 500, 
                      color: userType === 'teacher' ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                    }}>
                      Teacher
                    </Typography>
                  </Box>

                  {/* Student */}
                  <Box
                    onClick={() => setUserType('student')}
                    sx={{
                      flex: 1,
                      p: 1.5,
                      borderRadius: BORDER_RADIUS.MD,
                      border: userType === 'student' ? `2px solid ${COLORS.PRIMARY}` : '1px solid #e2e8f0',
                      backgroundColor: userType === 'student' ? 'rgba(102, 126, 234, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                      '&:hover': {
                        borderColor: COLORS.PRIMARY,
                        backgroundColor: userType === 'student' ? 'rgba(102, 126, 234, 0.12)' : 'rgba(102, 126, 234, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: userType === 'student' ? COLORS.PRIMARY : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Person 
                        sx={{ 
                          fontSize: 14, 
                          color: userType === 'student' ? 'white' : COLORS.TEXT_SECONDARY,
                          transition: 'color 0.2s ease',
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ 
                      fontWeight: userType === 'student' ? 600 : 500, 
                      color: userType === 'student' ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY,
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                    }}>
                      Student
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                  mb: 3,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s',
                }}
              >
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: BORDER_RADIUS.MD,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: COLORS.PRIMARY,
                        borderWidth: '2px',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: COLORS.PRIMARY,
                        borderWidth: '2px',
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          sx={{ 
                            color: COLORS.TEXT_SECONDARY,
                            '&:hover': {
                              color: COLORS.PRIMARY,
                              transform: 'scale(1.05)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: BORDER_RADIUS.MD,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: COLORS.PRIMARY,
                        borderWidth: '2px',
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: COLORS.PRIMARY,
                        borderWidth: '2px',
                      },
                    },
                  }}
                />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.rememberMe}
                        onChange={handleCheckboxChange}
                        sx={{
                          color: COLORS.PRIMARY,
                          '&.Mui-checked': {
                            color: COLORS.PRIMARY,
                          },
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    }
                    label="Remember Me"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: COLORS.TEXT_SECONDARY,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                  <Link
                    href="#"
                    sx={{
                      color: COLORS.PRIMARY,
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: BORDER_RADIUS.LG,
                    background: GRADIENTS.PRIMARY,
                    boxShadow: SHADOWS.LG,
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      boxShadow: SHADOWS.XL,
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#a0aec0',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isLoading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      LOGGING IN...
                    </Box>
                  ) : (
                    'LOGIN'
                  )}
                </Button>
              </Box>

              {/* Divider */}
              <Box 
                sx={{ 
                  mb: 3,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'opacity 0.4s ease 0.4s, transform 0.4s ease 0.4s',
                }}
              >
                <Divider sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: COLORS.TEXT_SECONDARY,
                      px: 2,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    OR
                  </Typography>
                </Divider>
              </Box>

              {/* Google Sign In Button */}
              <Box
                sx={{
                  mb: 3,
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
                }}
              >
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    // Handle Google sign in
                    console.log('Google sign in clicked');
                  }}
                  sx={{
                    border: '1px solid #dadce0',
                    borderRadius: '24px',
                    color: '#3c4043',
                    backgroundColor: '#ffffff',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    py: 1.5,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    minHeight: '48px',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      borderColor: COLORS.PRIMARY,
                      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
                      transform: 'translateY(-1px)',
                    },
                    '&:active': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      borderColor: COLORS.PRIMARY,
                      boxShadow: '0 1px 4px rgba(102, 126, 234, 0.2)',
                    },
                    transition: 'all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)',
                  }}
                >
                  {/* Google G Logo */}
                  <Box
                    sx={{
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  </Box>
                  Sign in with Google
                </Button>
              </Box>

              {/* Sign Up Link */}
              <Box 
                sx={{ 
                  textAlign: 'center',
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease 0.6s, transform 0.4s ease 0.6s',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    color: COLORS.TEXT_SECONDARY,
                    mb: 1,
                  }}
                >
                  Don't have an account?
                </Typography>
                <Link
                  href="#"
                  onClick={onNavigateToRegister}
                  sx={{
                    color: COLORS.PRIMARY,
                    textDecoration: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Get Started
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 