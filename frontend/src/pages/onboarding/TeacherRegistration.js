import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  School,
  Business,
  Security,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../../theme/constants';
import Step1BasicDetails from '../../components/registration/TeacherForm/Step1BasicDetails';
import Step2ProfessionalDetails from '../../components/registration/TeacherForm/Step2ProfessionalDetails';
import Step3OrganizationLink from '../../components/registration/TeacherForm/Step3OrganizationLink';
import Step4SecurityVerification from '../../components/registration/TeacherForm/Step4SecurityVerification';
import Step5FinalConfirmation from '../../components/registration/TeacherForm/Step5FinalConfirmation';
import '../../styles/registration/organisation.css';

const TeacherRegistration = ({ onNavigateToLanding, onNavigateToLogin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Enhanced form data structure
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    fullName: '',
    phoneNumber: '',
    countryCode: '+91',
    emailAddress: '',
    country: '',
    city: '',
    pincode: '',
    
    // Step 2: Professional Details
    subjectExpertise: [],
    role: '',
    isFreelance: false,
    
    // Step 3: Organization Link
    organizationCode: '',
    organizationName: '',
    organizationLocation: '',
    isOrganizationValid: false,
    associationStatus: '', // 'direct' | 'pending' | 'none'
    
    // Step 4: Security Verification
    emailVerified: false,
    phoneVerified: false,
    
    // Step 5: Final Confirmation
    termsAccepted: false,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    { 
      label: 'Basic Details', 
      icon: <Person />,
      title: "Let's get to know you",
      subtitle: "Provide your personal information to get started"
    },
    { 
      label: 'Professional Details', 
      icon: <School />,
      title: "Tell us about your expertise",
      subtitle: "Share your teaching experience and role"
    },
    { 
      label: 'Organization Link', 
      icon: <Business />,
      title: "Connect with your institution",
      subtitle: "Link your account to your organization"
    },
    { 
      label: 'Security Verification', 
      icon: <Security />,
      title: "Secure your account",
      subtitle: "Verify your email and phone number"
    },
    { 
      label: 'Final Confirmation', 
      icon: <CheckCircle />,
      title: "Review and submit",
      subtitle: "Confirm your information and complete registration"
    },
  ];

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
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
        if (!formData.country) errors.country = 'Country Is Required';
        if (!formData.city.trim()) errors.city = 'City Is Required';
        if (!formData.pincode.trim()) errors.pincode = 'Pincode Is Required';
        if (formData.pincode.length !== 6) errors.pincode = 'Pincode Must Be 6 Digits';
        break;
      case 1: // Professional Details
        if (formData.subjectExpertise.length === 0) errors.subjectExpertise = 'At Least One Subject Is Required';
        if (!formData.role) errors.role = 'Role Is Required';
        break;
      case 2: // Organization Link (only if not freelance)
        if (!formData.isFreelance) {
          if (!formData.organizationCode.trim()) errors.organizationCode = 'Organization Code Is Required';
          // Temporarily comment out organization validation for development/testing
          // if (!formData.isOrganizationValid) errors.organizationCode = 'Please Enter A Valid Organization Code';
        }
        break;
      case 3: // Security Verification
        // Temporarily comment out OTP verification for development/testing
        // if (!formData.emailVerified) errors.emailVerified = 'Please Verify Your Email';
        // if (!formData.phoneVerified) errors.phoneVerified = 'Please Verify Your Phone Number';
        break;
      case 4: // Final Confirmation
        if (!formData.termsAccepted) errors.termsAccepted = 'Please Accept The Terms And Conditions';
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate Step 5 before submitting
    if (!validateStep(4)) {
      return; // Don't submit if validation fails
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 2000);
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
          <Step2ProfessionalDetails
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 2:
        return (
          <Step3OrganizationLink
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 3:
        return (
          <Step4SecurityVerification
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 4:
        return (
          <Step5FinalConfirmation
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
              You've been onboarded successfully! 🎉
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
              A confirmation has been sent to your email
              {!formData.isFreelance && formData.associationStatus === 'pending' && (
                <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 500 }}>
                  Check your inbox to activate your account
                </span>
              )}
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
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
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
          <Box
            sx={{
              p: 3,
              backgroundColor: 'white',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mb: 2,
              flexWrap: 'wrap',
              gap: 1,
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
                Teacher Registration
              </Typography>
              
              <Box sx={{ width: 100, visibility: 'hidden', zIndex: 1 }} />
            </Box>
            
            {/* Progress Bar */}
            <Box sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={((activeStep + 1) / steps.length) * 100}
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
                Step {activeStep + 1} of {steps.length}
              </Typography>
              
              <Typography
                variant="body2"
                sx={{
                  color: '#4b5563',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                }}
              >
                {Math.round(((activeStep + 1) / steps.length) * 100)}% Complete
              </Typography>
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ p: 3 }}>
            {/* Step Title */}
            <Box sx={{ 
              mb: 3, 
              textAlign: 'center',
              maxWidth: 500,
              mx: 'auto',
            }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: '#1f2937',
                  mb: 1,
                  lineHeight: 1.3,
                }}
              >
                {steps[activeStep].title}
              </Typography>
              
              <Typography
                variant="body1"
                sx={{
                  color: '#4b5563',
                  fontSize: '1rem',
                  lineHeight: 1.5,
                }}
              >
                {steps[activeStep].subtitle}
              </Typography>
            </Box>

            {/* Form Content */}
            <Box sx={{ 
              mb: 3,
              maxWidth: activeStep === 2 ? 600 : 700,
              mx: 'auto',
            }}>
              {renderStepContent(activeStep)}
            </Box>
            
            {/* Navigation */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2,
                borderTop: '1px solid #e2e8f0',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBack />}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#4b5563',
                  borderRadius: 1,
                  px: 2,
                  py: 1,
                  fontWeight: 500,
                  minWidth: 100,
                  fontSize: '0.9rem',
                  '&:hover': {
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    backgroundColor: '#f8fafc',
                  },
                  '&:disabled': {
                    borderColor: '#e2e8f0',
                    color: '#9ca3af',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  endIcon={isSubmitting ? null : <CheckCircle />}
                  sx={{
                    background: GRADIENTS.PRIMARY,
                    borderRadius: 1,
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    minWidth: 140,
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
                  {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                  sx={{
                    background: GRADIENTS.PRIMARY,
                    borderRadius: 1,
                    px: 3,
                    py: 1,
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    minWidth: 100,
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>

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
    </Box>
  );
};

export default TeacherRegistration;
