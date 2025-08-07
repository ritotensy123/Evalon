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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Facebook,
  Twitter,
  Google,
  ArrowBack,
  School,
  TrendingUp,
  Security,
} from '@mui/icons-material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../theme/constants';

const LoginPage = ({ onNavigateToLanding, onNavigateToRegister }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Login attempt:', formData);
    // Handle login logic here
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
                    transition: 'all 0.2s ease',
                  }}
                >
                  LOGIN
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

              {/* Social Login Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  mb: 3,
                  justifyContent: 'center',
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s',
                }}
              >
                <IconButton
                  sx={{
                    width: 48,
                    height: 48,
                    border: `1px solid ${COLORS.GREY_200}`,
                    borderRadius: BORDER_RADIUS.MD,
                    '&:hover': {
                      backgroundColor: COLORS.GREY_50,
                      borderColor: COLORS.PRIMARY,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Facebook sx={{ color: '#1877f2' }} />
                </IconButton>
                <IconButton
                  sx={{
                    width: 48,
                    height: 48,
                    border: `1px solid ${COLORS.GREY_200}`,
                    borderRadius: BORDER_RADIUS.MD,
                    '&:hover': {
                      backgroundColor: COLORS.GREY_50,
                      borderColor: COLORS.PRIMARY,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Twitter sx={{ color: '#1da1f2' }} />
                </IconButton>
                <IconButton
                  sx={{
                    width: 48,
                    height: 48,
                    border: `1px solid ${COLORS.GREY_200}`,
                    borderRadius: BORDER_RADIUS.MD,
                    '&:hover': {
                      backgroundColor: COLORS.GREY_50,
                      borderColor: COLORS.PRIMARY,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Google sx={{ color: '#db4437' }} />
                </IconButton>
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
                  Create an Account
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