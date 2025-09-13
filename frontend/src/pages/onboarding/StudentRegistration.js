import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  Fade,
  LinearProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Person,
  Business,
  Security,
  School,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, GRADIENTS } from '../../theme/constants';
import Step1BasicDetails from '../../components/registration/StudentForm/Step1BasicDetails';
import Step2OrganizationVerification from '../../components/registration/StudentForm/Step2OrganizationVerification';
import Step3SecurityVerification from '../../components/registration/StudentForm/Step3SecurityVerification';
import Step4AutoMapping from '../../components/registration/StudentForm/Step4AutoMapping';
import { studentAPI } from '../../services/api';
import '../../styles/registration/organisation.css';

const StudentRegistration = ({ onNavigateToLanding, onNavigateToLogin }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Enhanced form data structure
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    fullName: '',
    phoneNumber: '',
    countryCode: '+91',
    emailAddress: '',
    dateOfBirth: '',
    gender: '',
    country: '',
    city: '',
    pincode: '',
    
    // Step 2: Organization Verification
    registrationType: 'organization', // 'organization' | 'standalone'
    organizationCode: '',
    organizationName: '',
    isOrganizationValid: false,
    studentVerificationStatus: '', // 'verified' | 'pending' | 'not_found'
    isStandalone: false,
    currentInstitution: '',
    academicLevel: '',
    
    // Step 3: Security Verification
    emailVerified: false,
    phoneVerified: false,
    password: '',
    confirmPassword: '',
    
    // Step 4: Auto Mapping
    department: '',
    batch: '',
    year: '',
    isAutoMapped: false,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto redirect effect
  useEffect(() => {
    if (showSuccess) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/dashboard';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSuccess, onNavigateToLogin]);

  const steps = [
    { 
      label: 'Basic Details', 
      icon: <Person />,
      title: "Let's get to know you",
      subtitle: "Provide your personal information to get started"
    },
    { 
      label: 'Organization Verification', 
      icon: <Business />,
      title: "Link to your institution",
      subtitle: "Connect with your educational organization"
    },
    { 
      label: 'Security Verification', 
      icon: <Security />,
      title: "Secure your account",
      subtitle: "Verify your email and phone number"
    },
    { 
      label: 'Auto Mapping', 
      icon: <School />,
      title: "Department & Batch Mapping",
      subtitle: "Your academic details will be automatically mapped"
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // If this is the last step, submit the form
      handleSubmit();
    } else if (validateStep(activeStep)) {
      // Call step-specific handlers
      switch (activeStep) {
        case 0:
          handleStep1Submit();
          break;
        case 1:
          handleStep2Submit();
          break;
        case 2:
          handleStep3Submit();
          break;
        default:
          setActiveStep((prevStep) => prevStep + 1);
      }
      
      // Scroll to top when moving to next step with smoother animation
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    // Scroll to top when going back to previous step with smoother animation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing - with debounce to prevent excessive re-renders
    if (formErrors[field]) {
      setTimeout(() => {
        setFormErrors(prev => ({
          ...prev,
          [field]: ''
        }));
      }, 100);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Basic Details
        if (!formData.fullName.trim()) errors.fullName = 'Full Name Is Required';
        if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone Number Is Required';
        if (!formData.emailAddress.trim()) errors.emailAddress = 'Email Address Is Required';
        if (!/\S+@\S+\.\S+/.test(formData.emailAddress)) errors.emailAddress = 'Please Enter A Valid Email';
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of Birth Is Required';
        if (!formData.gender) errors.gender = 'Gender Is Required';
        if (!formData.country) errors.country = 'Country Is Required';
        if (!formData.city.trim()) errors.city = 'City Is Required';
        if (!formData.pincode.trim()) errors.pincode = 'Pincode Is Required';
        if (formData.pincode.length !== 6) errors.pincode = 'Pincode Must Be 6 Digits';
        break;
      case 1: // Organization Verification
        // Skip validation if user is standalone
        if (!formData.isStandalone) {
          if (!formData.organizationCode.trim()) errors.organizationCode = 'Organization Code Is Required';
          if (!formData.isOrganizationValid) errors.organizationCode = 'Please Enter A Valid Organization Code';
        }
        break;
      case 2: // Security Verification
        // Require OTP verification before proceeding
        if (!formData.emailVerified) errors.emailVerified = 'Please Verify Your Email';
        if (!formData.phoneVerified) errors.phoneVerified = 'Please Verify Your Phone Number';
        if (!formData.password.trim()) errors.password = 'Password Is Required';
        if (!formData.confirmPassword.trim()) errors.confirmPassword = 'Confirm Password Is Required';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords Do Not Match';
        break;
      case 3: // Auto Mapping
        // No validation required as this is auto-filled or skipped for standalone
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate effective step for progress and display
  const getEffectiveStep = () => {
    return activeStep;
  };

  const getTotalSteps = () => {
    return 4; // Now 4 steps for students
  };

  const getStepLabel = (stepIndex) => {
    return steps[stepIndex]?.label || '';
  };

  const handleSubmit = async () => {
    // Validate the current step before submitting
    if (!validateStep(activeStep)) {
      return; // Don't submit if validation fails
    }
    
    setIsSubmitting(true);
    
    try {
      // Step 4: Complete registration
      const response = await studentAPI.registerStep4({
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        academicYear: formData.year || '2024-25',
        grade: formData.academicLevel || '10',
        section: formData.batch || 'A',
        subjects: formData.department ? [formData.department] : ['Mathematics', 'Physics', 'Chemistry', 'English'],
        registrationToken: registrationToken
      });

      console.log('Student registration completed:', response);
      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Student registration failed:', error);
      setIsSubmitting(false);
      // Handle error - you might want to show an error message to the user
    }
  };

  // Step-specific handlers
  const handleStep1Submit = async () => {
    try {
      // Validate date of birth format
      if (!formData.dateOfBirth || formData.dateOfBirth.trim() === '') {
        setNotification({
          open: true,
          message: 'Please enter a valid date of birth',
          severity: 'error'
        });
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        setNotification({
          open: true,
          message: 'Please enter a valid date format (YYYY-MM-DD)',
          severity: 'error'
        });
        return;
      }

      // Validate age (must be between 5 and 100 years)
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      
      // Check if the birthday has occurred this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 5) {
        setNotification({
          open: true,
          message: 'You must be at least 5 years old to register. Please enter a valid birth date.',
          severity: 'error'
        });
        return;
      }
      
      if (age > 100) {
        setNotification({
          open: true,
          message: 'Please enter a valid birth date. Age must be less than 100 years.',
          severity: 'error'
        });
        return;
      }

      // Debug: Log the date being sent
      console.log('Date of birth being sent:', formData.dateOfBirth);
      console.log('Date type:', typeof formData.dateOfBirth);
      console.log('Calculated age:', age);

      const response = await studentAPI.registerStep1({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        countryCode: formData.countryCode,
        emailAddress: formData.emailAddress,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        country: formData.country,
        city: formData.city,
        pincode: formData.pincode
      });

      // Store registration token for subsequent requests
      if (response.success && response.data.registrationToken) {
        setRegistrationToken(response.data.registrationToken);
        setNotification({
          open: true,
          message: 'Basic details saved successfully!',
          severity: 'success'
        });
      }

      setActiveStep(1);
    } catch (error) {
      console.error('Step 1 failed:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Step 1 failed. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleStep2Submit = async () => {
    try {
      const response = await studentAPI.registerStep2({
        organizationCode: formData.organizationCode,
        registrationToken: registrationToken,
        registrationType: formData.registrationType,
        academicLevel: formData.academicLevel
      });

      setFormData(prev => ({
        ...prev,
        organizationName: response.data.organizationName,
        isOrganizationValid: response.data.isOrganizationValid,
        studentVerificationStatus: response.data.associationStatus,
        isStandalone: response.data.isStandalone
      }));

      setActiveStep(2);
    } catch (error) {
      console.error('Step 2 failed:', error);
      setNotification({
        open: true,
        message: error.response?.data?.message || 'Step 2 failed. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleStep3Submit = async () => {
    // Just move to step 3 - OTP sending is handled by the Step3SecurityVerification component
    setActiveStep(3);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Step1BasicDetails
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 1:
        return (
          <Step2OrganizationVerification
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
            registrationToken={registrationToken}
          />
        );
      case 2:
        return (
          <Step3SecurityVerification
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
            registrationToken={registrationToken}
          />
        );
      case 3:
        return (
          <Step4AutoMapping
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      default:
        return null;
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Success Icon */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 32,
                  color: 'white',
                }}
              />
            </Box>
            
            {/* Success Title */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#1f2937',
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
              }}
            >
              Welcome to Evalon! 🎉
            </Typography>
            
            {/* Success Message */}
            <Typography
              variant="body1"
              sx={{
                color: '#4b5563',
                mb: 4,
                fontSize: '1rem',
                lineHeight: 1.5,
              }}
            >
              You're now ready to take secure assessments.
            </Typography>

            {/* Countdown Message */}
            <Typography
              variant="body2"
              sx={{
                color: '#6b7280',
                mb: 3,
                fontSize: '0.9rem',
                fontStyle: 'italic',
              }}
            >
              Redirecting to dashboard in {redirectCountdown} seconds...
            </Typography>
            
            {/* Action Button */}
            <Button
              variant="contained"
              size="large"
              onClick={() => window.location.href = '/dashboard'}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        py: 3,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: COLORS.PRIMARY,
          opacity: 0.4,
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
          bottom: '20%',
          left: '15%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: COLORS.SECONDARY,
          opacity: 0.3,
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
          top: '60%',
          left: '5%',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: COLORS.SUCCESS,
          opacity: 0.25,
          animation: 'float3 12s ease-in-out infinite',
          '@keyframes float3': {
            '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
            '50%': { transform: 'translateY(-10px) translateX(8px)' },
          },
        }}
      />

      <Container maxWidth="md">
        <Fade in={isLoaded} timeout={800}>
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Background Animation for Form Container */}
            <Box
              sx={{
                position: 'absolute',
                top: '5%',
                right: '5%',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: COLORS.PRIMARY,
                opacity: 0.2,
                animation: 'float4 15s ease-in-out infinite',
                '@keyframes float4': {
                  '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
                  '50%': { transform: 'translateY(-8px) translateX(5px)' },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: '10%',
                left: '8%',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: COLORS.SECONDARY,
                opacity: 0.15,
                animation: 'float5 18s ease-in-out infinite',
                '@keyframes float5': {
                  '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
                  '50%': { transform: 'translateY(-6px) translateX(-4px)' },
                },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '70%',
                right: '15%',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: COLORS.SUCCESS,
                opacity: 0.12,
                animation: 'float6 20s ease-in-out infinite',
                '@keyframes float6': {
                  '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
                  '50%': { transform: 'translateY(-5px) translateX(3px)' },
                },
              }}
            />

            {/* Header */}
            <Box sx={{ 
              p: 3, 
              borderBottom: '1px solid #e2e8f0',
              position: 'relative',
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'relative',
              }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={onNavigateToLanding}
                  sx={{
                    color: '#4b5563',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 1,
                    px: 1.5,
                    fontSize: '0.9rem',
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                      color: COLORS.PRIMARY,
                    },
                    transition: 'all 0.2s ease',
                    zIndex: 1,
                  }}
                >
                  Back to Home
                </Button>
                
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center',
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                    zIndex: 0,
                  }}
                >
                  Student Registration
                </Typography>
                
                <Box sx={{ width: 100, visibility: 'hidden', zIndex: 1 }} />
              </Box>
              
              {/* Progress Bar */}
              <Box sx={{ mb: 1, mt: 3 }}>
                <LinearProgress
                  variant="determinate"
                  value={((getEffectiveStep() + 1) / getTotalSteps()) * 100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      background: GRADIENTS.PRIMARY,
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#4b5563',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                  }}
                >
                  Step {getEffectiveStep() + 1} of {getTotalSteps()}
                </Typography>
                
                <Typography
                  variant="body2"
                  sx={{
                    color: '#4b5563',
                    fontWeight: 500,
                    fontSize: '0.8rem',
                  }}
                >
                  {Math.round(((getEffectiveStep() + 1) / getTotalSteps()) * 100)}% Complete
                </Typography>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3 }}>
              {/* Step Title */}
              <Box sx={{ 
                mb: 3, 
                textAlign: 'center',
              }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: '#1f2937',
                    mb: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  {steps[activeStep]?.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                  }}
                >
                  {steps[activeStep]?.subtitle}
                </Typography>
              </Box>

              {/* Step Content */}
              <Box sx={{ mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: 2,
              }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  startIcon={<ArrowBack />}
                  sx={{
                    borderColor: '#d1d5db',
                    color: '#4b5563',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 1,
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      color: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                    '&:disabled': {
                      borderColor: '#e5e7eb',
                      color: '#9ca3af',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Back
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  endIcon={activeStep === steps.length - 1 ? (isSubmitting ? null : <CheckCircle />) : <ArrowForward />}
                  sx={{
                    background: GRADIENTS.PRIMARY,
                    borderRadius: 1,
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    minWidth: activeStep === steps.length - 1 ? 160 : 100,
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    },
                    '&:disabled': {
                      background: '#9ca3af',
                      boxShadow: 'none',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {activeStep === steps.length - 1 
                    ? (isSubmitting ? 'Submitting...' : 'Complete Registration')
                    : 'Next'
                  }
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Login Link */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 3,
          p: 1,
        }}>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              display: 'inline',
              fontSize: '0.9rem',
            }}
          >
            Already have an account?{' '}
          </Typography>
          <Button
            onClick={onNavigateToLogin}
            sx={{
              color: COLORS.PRIMARY,
              textTransform: 'none',
              p: 0,
              minWidth: 'auto',
              fontWeight: 500,
              fontSize: '0.9rem',
              '&:hover': {
                color: '#5a6fd8',
                backgroundColor: 'transparent',
              },
              transition: 'color 0.2s ease',
            }}
          >
            Sign in
          </Button>
        </Box>
      </Container>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentRegistration;
