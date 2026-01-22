import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, authService } from '../services/authService';
import { locationAPI } from '../services/api';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Lock,
  Person,
  CheckCircle,
  ArrowForward,
  ArrowBack,
  Logout
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, GRADIENTS } from '../theme/constants';

const FirstTimeLoginWizard = () => {
  const { user, refreshUser, logout, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);

  // SAFETY CHECK: Organization admins MUST NEVER see this wizard
  // This is a safety net in case routing logic fails
  React.useEffect(() => {
    if (user?.userType === 'organization_admin') {
      // Immediately redirect organization admins to dashboard
      // They do NOT require first-time login setup
      window.location.href = '/';
      return;
    }
  }, [user?.userType]);
  
  // Country management
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [errorCountries, setErrorCountries] = useState(null);
  
  
  // Initialize profile data only once when user is available
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    // Student-specific mandatory fields
    dateOfBirth: '',
    gender: '',
    country: '',
    city: '',
    pincode: '',
    academicYear: '',
    rollNumber: ''
  });
  
  // Update profile data when user changes - only run once when component mounts
  React.useEffect(() => {
    if (user?.profile) {
      setProfileData({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        department: user.profile.department || '',
        // Student-specific fields
        dateOfBirth: user.profile.dateOfBirth || user.dateOfBirth || '',
        gender: user.profile.gender || user.gender || '',
        country: user.profile.country || user.country || '',
        city: user.profile.city || user.city || '',
        pincode: user.profile.pincode || user.pincode || '',
        academicYear: user.profile.academicYear || user.academicYear || '',
        rollNumber: user.profile.rollNumber || user.rollNumber || ''
      });
    }
  }, []); // Empty dependency array to run only once

  // Auto-proceed to next step if email is already verified
  React.useEffect(() => {
    if (user?.isEmailVerified && step === 1) {
      // Small delay to show the "Email Already Verified" message
      const timer = setTimeout(() => {
        setStep(2);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.isEmailVerified, step]);
  
  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await locationAPI.getCountries();
        if (response.success && response.data && Array.isArray(response.data)) {
          setCountries(response.data);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
        setErrorCountries('Failed to load countries');
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);
  
  // Form data
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
    color: '#e2e8f0'
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = '';
    let color = '#e2e8f0';
    
    if (password.length === 0) {
      return { score: 0, feedback: '', color: '#e2e8f0' };
    }
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) {
      feedback = 'Weak';
      color = '#ef4444';
    } else if (score <= 4) {
      feedback = 'Medium';
      color = '#f59e0b';
    } else {
      feedback = 'Strong';
      color = '#10b981';
    }
    
    return { score, feedback, color };
  };

  const handlePasswordChange = (e) => {
    const newData = {
      ...passwordData,
      [e.target.name]: e.target.value
    };
    setPasswordData(newData);
    
    if (e.target.name === 'newPassword') {
      const strength = checkPasswordStrength(e.target.value);
      setPasswordStrength(strength);
    }
  };

  const handleProfileChange = (e) => {
    const fieldName = e.target.name;
    const fieldValue = e.target.value;
    
    setProfileData(prev => ({
      ...prev,
      [fieldName]: fieldValue
    }));
  };

  const validatePassword = () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Both password fields are required');
      return false;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateProfile = () => {
    if (!profileData.firstName || !profileData.lastName) {
      setError('First name and last name are required');
      return false;
    }
    
    // Additional validation for students
    if (user?.userType === 'student') {
      if (!profileData.dateOfBirth) {
        setError('Date of birth is required for students');
        return false;
      }
      
      // Validate age (must be at least 5 years old)
      if (profileData.dateOfBirth) {
        const birthDate = new Date(profileData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 5) {
          setError('Student must be at least 5 years old');
          return false;
        }
      }
      
      if (!profileData.gender) {
        setError('Gender is required for students');
        return false;
      }
      if (!profileData.country) {
        setError('Country is required for students');
        return false;
      }
      if (!profileData.city) {
        setError('City is required for students');
        return false;
      }
      if (!profileData.pincode) {
        setError('Pincode is required for students');
        return false;
      }
      if (!profileData.academicYear) {
        setError('Academic year is required for students');
        return false;
      }
      if (!profileData.department) {
        setError('Department is required for students');
        return false;
      }
      if (!profileData.rollNumber) {
        setError('Roll number is required for students');
        return false;
      }
    }
    
    return true;
  };

  const handleSendEmailVerification = async () => {
    setLoading(true);
    setError('');
    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        setError('You must be logged in to send email verification. Please refresh the page and try again.');
        return;
      }

      // Check if token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        return;
      }
      
      // Call API to send email verification
      const response = await authService.sendEmailVerification();
      
      if (response.success) {
        setEmailVerificationSent(true);
        setOtpExpiresIn(response.data?.expiresIn || 600000); // 10 minutes default
        // Start countdown timer
        startOtpCountdown();
      } else {
        setError(response.message || 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('❌ Email verification error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('User not found. Please contact support.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startOtpCountdown = () => {
    const interval = setInterval(() => {
      setOtpExpiresIn(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authService.verifyEmailWithOTP(otpCode);
      
      if (response.success) {
        // Email verified successfully, move to next step
        setStep(2);
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      // Email verification step - check if email is already verified
      if (user?.isEmailVerified) {
        setStep(2);
      } else if (emailVerificationSent && user?.isEmailVerified) {
        setStep(2);
      } else {
        setError('Please verify your email with OTP before proceeding.');
      }
    } else if (step === 2 && validatePassword()) {
      if (user?.userType === 'student') {
        // For students, go directly to completion - no step 3
        handleComplete();
      } else {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      // Only non-students can reach step 3, so normal navigation
      setStep(2);
    }
    setError('');
  };

  const handleComplete = async () => {
    setError('');
    
    // Only validate profile for non-students (students bypass step 3)
    if (user?.userType !== 'student' && !validateProfile()) return;
    
    setLoading(true);
    try {
      const response = await authAPI.put('/complete-first-login', {
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
        profileData: user?.userType === 'student' ? {} : profileData
      });
      
      if (response.data.success) {
        console.log('✅ Wizard completed successfully, refreshing user data...');
        // Refresh user data to get updated firstLogin status
        await refreshUser();
        console.log('✅ User data refreshed, checking firstLogin status...');
        
        // Wait a bit more for the state to update, then force redirect
        setTimeout(() => {
          console.log('🔄 Forcing redirect to dashboard...');
          // Clear any cached data and force a hard redirect
          window.location.href = '/';
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to complete setup');
      }
    } catch (error) {
      console.error('❌ Wizard completion error:', error);
      setError(error.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const steps = ['Set Password', 'Profile Information'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Animations like Login Page */}
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

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
        {/* Header with Sign Out Button */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          mb={{ xs: 3, sm: 4 }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: COLORS.TEXT_PRIMARY, 
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
            Complete Your Setup
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' } }}
            >
            Welcome! Let's set up your account with a secure password and profile information.
            </Typography>
          </Box>
          <Button
            variant="text"
            startIcon={<Logout />}
            onClick={handleSignOut}
            sx={{
              color: COLORS.TEXT_SECONDARY,
              textTransform: 'none',
              fontSize: '0.875rem',
              alignSelf: { xs: 'flex-start', sm: 'center' },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Sign Out
          </Button>
        </Box>

          {/* Simple Progress Indicator */}
          <Box sx={{ 
            mb: { xs: 3, sm: 4 }, 
            textAlign: 'center' 
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Step {step} of {user?.userType === 'student' ? 2 : 3}
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1 
            }}>
              <Box
                sx={{
                  width: { xs: 6, sm: 8 },
                  height: { xs: 6, sm: 8 },
                  borderRadius: '50%',
                  backgroundColor: step >= 1 ? COLORS.PRIMARY : '#e2e8f0',
                  transition: 'all 0.3s ease'
                }}
              />
              <Box
                sx={{
                  width: { xs: 6, sm: 8 },
                  height: { xs: 6, sm: 8 },
                  borderRadius: '50%',
                  backgroundColor: step >= 2 ? COLORS.PRIMARY : '#e2e8f0',
                  transition: 'all 0.3s ease'
                }}
              />
            </Box>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: BORDER_RADIUS.MD }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Email Verification */}
          {step === 1 && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography 
                  variant="h5" 
                  component="h2" 
                  sx={{ 
                    color: COLORS.TEXT_PRIMARY, 
                    mb: 1, 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}
                >
                  {user?.isEmailVerified ? 'Email Already Verified' : 'Verify Your Email'}
                </Typography>
                
                {user?.isEmailVerified ? (
                  <Box sx={{ 
                    bgcolor: '#d1ecf1', 
                    border: '1px solid #bee5eb', 
                    borderRadius: 1, 
                    p: 3, 
                    mt: 2,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body1" sx={{ color: '#0c5460', fontSize: '1rem', mb: 2 }}>
                      ✅ Your email <strong>{user?.email}</strong> is already verified!
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0c5460', fontSize: '0.875rem' }}>
                      You can proceed to the next step to set up your password and complete your profile.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      We'll send a verification code to
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: COLORS.PRIMARY,
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        mt: 0.5
                      }}
                    >
                      {user?.email}
                    </Typography>
                  </>
                )}
              </Box>

              <Box component="form" sx={{ '& > *': { mb: 2 } }}>
                {user?.isEmailVerified ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" sx={{ color: COLORS.TEXT_SECONDARY, mb: 3 }}>
                      No action needed - your email is verified!
                    </Typography>
                  </Box>
                ) : !emailVerificationSent ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSendEmailVerification}
                    disabled={loading}
                    sx={{
                      background: GRADIENTS.primary,
                      '&:hover': {
                        background: GRADIENTS.primaryHover,
                      },
                      borderRadius: BORDER_RADIUS.button,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '16px'
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Code'}
                  </Button>
                ) : (
                  <Box>
                    <Box sx={{ 
                      bgcolor: COLORS.BACKGROUND_LIGHT, 
                      p: 2, 
                      borderRadius: BORDER_RADIUS.MD, 
                      mb: 3,
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: COLORS.BORDER
                    }}>
                      <Typography variant="body2" sx={{ 
                        color: COLORS.TEXT_PRIMARY, 
                        fontWeight: 500
                      }}>
                        ✓ Verification code sent to your email
                      </Typography>
                    </Box>
                    
                    {otpExpiresIn > 0 && (
                      <Typography variant="body2" sx={{ 
                        mb: 3, 
                        textAlign: 'center', 
                        color: COLORS.TEXT_SECONDARY,
                        fontWeight: 500
                      }}>
                        Code expires in: {Math.floor(otpExpiresIn / 60000)}:{(otpExpiresIn % 60000 / 1000).toFixed(0).padStart(2, '0')}
                      </Typography>
                    )}
                    
                    <Box sx={{ mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Enter 6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        inputProps={{ 
                          maxLength: 6,
                          style: { 
                            textAlign: 'center', 
                            fontSize: '20px', 
                            letterSpacing: '3px',
                            fontWeight: 700
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: BORDER_RADIUS.MD,
                            '& fieldset': {
                              borderColor: COLORS.BORDER,
                            },
                            '&:hover fieldset': {
                              borderColor: COLORS.PRIMARY,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: COLORS.PRIMARY,
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEmailVerificationSent(false);
                          setOtpCode('');
                          setOtpExpiresIn(0);
                        }}
                        sx={{
                          flex: 1,
                          textTransform: 'none',
                          borderRadius: BORDER_RADIUS.button,
                          borderColor: COLORS.BORDER,
                          color: COLORS.TEXT_SECONDARY,
                          py: 1.5,
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: COLORS.PRIMARY,
                            backgroundColor: COLORS.PRIMARY_LIGHT,
                            color: COLORS.PRIMARY,
                          }
                        }}
                      >
                        Resend
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleVerifyOTP}
                        disabled={loading || otpCode.length !== 6}
                        sx={{
                          background: GRADIENTS.primary,
                          '&:hover': {
                            background: GRADIENTS.primaryHover,
                          },
                          borderRadius: BORDER_RADIUS.button,
                          flex: 1,
                          textTransform: 'none',
                          fontWeight: 600,
                          py: 1.5,
                          fontSize: '16px'
                        }}
                      >
                        {loading ? 'Verifying...' : 'Verify'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center',
                mt: 4,
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider'
              }}>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  disabled={!user?.isEmailVerified && !emailVerificationSent}
                  sx={{
                    background: GRADIENTS.primary,
                    '&:hover': {
                      background: GRADIENTS.primaryHover,
                    },
                    borderRadius: BORDER_RADIUS.button,
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {user?.isEmailVerified ? 'Continue' : 'Continue'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Password Setup */}
          {step === 2 && (
            <Box>
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{ 
                  color: COLORS.TEXT_PRIMARY, 
                  mb: 2, 
                  fontWeight: 500,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Create Your Password
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' }
                }}
              >
                Choose a secure password for your account.
              </Typography>

              <Box component="form" sx={{ '& > *': { mb: 2 } }}>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: BORDER_RADIUS.MD,
                      },
                    }}
                  />
                </Box>
                
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box
                        sx={{
                          flex: 1,
                          height: 4,
                          backgroundColor: '#e2e8f0',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color,
                            transition: 'all 0.3s ease'
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: passwordStrength.color,
                          fontWeight: 500,
                          minWidth: 50
                        }}
                      >
                        {passwordStrength.feedback}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Use at least 8 characters with a mix of letters, numbers, and symbols
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mb: 3, mt: 1 }}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                    variant="outlined"
                    error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                    helperText={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : ''}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: BORDER_RADIUS.MD,
                      },
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                onClick={handleNext}
                  disabled={!passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordStrength.score < 3}
                  sx={{ 
                    mt: 3, 
                    py: 1.5,
                    borderRadius: BORDER_RADIUS.MD,
                    background: GRADIENTS.PRIMARY,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      background: GRADIENTS.PRIMARY,
                      opacity: 0.9,
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#9ca3af'
                    }
                  }}
                >
                  Continue
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Profile Information - Not shown to students */}
          {step === 3 && user?.userType !== 'student' && (
            <Box>
              <Typography 
                variant="h6" 
                component="h2" 
                sx={{ 
                  color: COLORS.TEXT_PRIMARY, 
                  mb: 2, 
                  fontWeight: 500,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                Profile Information
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' }
                }}
              >
                {user?.userType === 'student' 
                  ? 'Please provide your complete student information to complete your profile.'
                  : 'Please provide some basic information about yourself.'
                }
              </Typography>

              <Box component="form" sx={{ '& > *': { mb: 2 } }}>
                <Box 
                  display="flex" 
                  gap={2}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  sx={{ mb: 2 }}
                >
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    placeholder="First name"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: BORDER_RADIUS.MD,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    placeholder="Last name"
                    required
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: BORDER_RADIUS.MD,
                      },
                    }}
                  />
                </Box>


                <Box sx={{ mb: 2 }}>
                  <FormControl fullWidth variant="outlined" required sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderRadius: '9999px !important',
                    },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '9999px !important',
                    },
                    '& .MuiSelect-select': {
                      borderRadius: '9999px !important',
                    },
                    '& fieldset': {
                      borderRadius: '9999px !important',
                    },
                  }}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      label="Department"
                      sx={{
                        borderRadius: '9999px !important',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiSelect-select': {
                          borderRadius: '9999px !important',
                        },
                      }}
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      <MenuItem value="Computer Science">Computer Science</MenuItem>
                      <MenuItem value="Electronics">Electronics</MenuItem>
                      <MenuItem value="Mechanical">Mechanical</MenuItem>
                      <MenuItem value="Civil">Civil</MenuItem>
                      <MenuItem value="Electrical">Electrical</MenuItem>
                      <MenuItem value="Aerospace">Aerospace</MenuItem>
                      <MenuItem value="Chemical">Chemical</MenuItem>
                      <MenuItem value="Biotechnology">Biotechnology</MenuItem>
                      <MenuItem value="Mathematics">Mathematics</MenuItem>
                      <MenuItem value="Physics">Physics</MenuItem>
                      <MenuItem value="Chemistry">Chemistry</MenuItem>
                      <MenuItem value="Biology">Biology</MenuItem>
                      <MenuItem value="Commerce">Commerce</MenuItem>
                      <MenuItem value="Arts">Arts</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Student-specific fields */}
                {user?.userType === 'student' && (
                  <>
                    <Box 
                      display="flex" 
                      gap={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      sx={{ mb: 2 }}
                    >
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        name="dateOfBirth"
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={handleProfileChange}
                        required
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                        helperText="dd/mm/yyyy"
                        inputProps={{
                          max: new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split('T')[0],
                          placeholder: "dd/mm/yyyy"
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: BORDER_RADIUS.MD,
                          },
                          '& .MuiFormHelperText-root': {
                            color: '#999999 !important',
                            fontSize: '12px',
                            marginTop: '4px',
                            opacity: '0.7',
                            fontWeight: 400,
                          },
                        }}
                        FormHelperTextProps={{
                          sx: {
                            color: '#999999',
                            opacity: 0.7,
                            fontSize: '12px',
                            mt: 0.5,
                          }
                        }}
                      />
                      <FormControl fullWidth variant="outlined" required sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiSelect-select': {
                          borderRadius: '9999px !important',
                        },
                        '& fieldset': {
                          borderRadius: '9999px !important',
                        },
                      }}>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          name="gender"
                          value={profileData.gender}
                          onChange={handleProfileChange}
                          label="Gender"
                          sx={{
                            borderRadius: '9999px !important',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiSelect-select': {
                              borderRadius: '9999px !important',
                            },
                          }}
                        >
                          <MenuItem value="">Select Gender</MenuItem>
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box 
                      display="flex" 
                      gap={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      sx={{ mb: 2 }}
                    >
                      <FormControl fullWidth variant="outlined" required sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiSelect-select': {
                          borderRadius: '9999px !important',
                        },
                        '& fieldset': {
                          borderRadius: '9999px !important',
                        },
                      }}>
                        <InputLabel>Country</InputLabel>
                        <Select
                          name="country"
                          value={profileData.country || ""}
                          onChange={handleProfileChange}
                          label="Country"
                          disabled={loadingCountries}
                          displayEmpty
                          sx={{
                            borderRadius: '9999px !important',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiSelect-select': {
                              borderRadius: '9999px !important',
                            },
                          }}
                        >
                          {loadingCountries && (
                            <MenuItem disabled>
                              <CircularProgress size={16} sx={{ mr: 2 }} />
                              Loading countries...
                            </MenuItem>
                          )}
                          
                          {!loadingCountries && (
                            <MenuItem value="">
                              <em>Select Country</em>
                            </MenuItem>
                          )}
                          
                          {!loadingCountries && countries.map((country, index) => (
                            <MenuItem 
                              key={country.code || index} 
                              value={country.name}
                            >
                              {country.name}
                            </MenuItem>
                          ))}
                          
                          {errorCountries && (
                            <MenuItem disabled sx={{ color: 'error.main' }}>
                              {errorCountries}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        placeholder="City"
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: BORDER_RADIUS.MD,
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Pincode"
                        name="pincode"
                        value={profileData.pincode}
                        onChange={handleProfileChange}
                        placeholder="Pincode"
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: BORDER_RADIUS.MD,
                          },
                        }}
                      />
                    </Box>

                    <Box 
                      display="flex" 
                      gap={2}
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      sx={{ mb: 2 }}
                    >
                      <FormControl fullWidth variant="outlined" required sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '9999px !important',
                        },
                        '& .MuiSelect-select': {
                          borderRadius: '9999px !important',
                        },
                        '& fieldset': {
                          borderRadius: '9999px !important',
                        },
                      }}>
                        <InputLabel>Academic Year</InputLabel>
                        <Select
                          name="academicYear"
                          value={profileData.academicYear}
                          onChange={handleProfileChange}
                          label="Academic Year"
                          sx={{
                            borderRadius: '9999px !important',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '9999px !important',
                            },
                            '& .MuiSelect-select': {
                              borderRadius: '9999px !important',
                            },
                          }}
                        >
                          <MenuItem value="">Select Academic Year</MenuItem>
                          <MenuItem value="2024-25">2024-25</MenuItem>
                          <MenuItem value="2025-26">2025-26</MenuItem>
                          <MenuItem value="2026-27">2026-27</MenuItem>
                          <MenuItem value="2027-28">2027-28</MenuItem>
                          <MenuItem value="2028-29">2028-29</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        fullWidth
                        label="Roll Number"
                        name="rollNumber"
                        value={profileData.rollNumber}
                        onChange={handleProfileChange}
                        placeholder="Roll Number"
                        required
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: BORDER_RADIUS.MD,
                          },
                        }}
                      />
                    </Box>
                  </>
                )}

                <Box 
                  display="flex" 
                  gap={2} 
                  sx={{ 
                    mt: 3,
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}
                >
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleBack}
                    sx={{ 
                      flex: 1,
                      borderRadius: BORDER_RADIUS.MD,
                      borderColor: '#e2e8f0',
                      color: COLORS.TEXT_SECONDARY,
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1.5,
                      '&:hover': {
                        borderColor: COLORS.TEXT_SECONDARY,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                >
                  Back
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                  onClick={handleComplete}
                    disabled={loading}
                    sx={{ 
                      flex: 1,
                      borderRadius: BORDER_RADIUS.MD,
                      background: GRADIENTS.PRIMARY,
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1.5,
                      '&:hover': {
                        background: GRADIENTS.PRIMARY,
                        opacity: 0.9,
                      },
                      '&:disabled': {
                        background: '#e2e8f0',
                        color: '#9ca3af'
                      }
                    }}
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

      </Container>
    </Box>
  );
};

export default FirstTimeLoginWizard;
