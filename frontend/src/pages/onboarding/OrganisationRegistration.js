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
  Business,
  Person,
  Settings,
  ArrowBack,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, GRADIENTS } from '../../theme/constants';
import Step1OrganisationDetails from '../../components/registration/OrganisationForm/Step1OrganisationDetails';
import Step2AdminDetails from '../../components/registration/OrganisationForm/Step2AdminDetails';
import Step3SetupPreferences from '../../components/registration/OrganisationForm/Step3SetupPreferences';
import '../../styles/registration/organisation.css';

const OrganisationRegistration = ({ onNavigateToLanding, onNavigateToLogin }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgCode, setOrgCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Enhanced form data structure
  const [formData, setFormData] = useState({
    // Step 1: Organisation Details
    organisationName: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    organisationType: '',
    studentStrength: '',
    isGovernmentRecognized: false,
    
    // Step 2: Admin Details
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    countryCode: '+91',
    password: '',
    confirmPassword: '',
    emailVerified: false,
    phoneVerified: false,
    
    // Step 3: Setup Preferences
    logo: null,
    institutionStructure: '',
    departments: [],
    addSubAdmins: false,
    timeZone: '',
    twoFactorAuth: false,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    { 
      label: 'Organisation Details', 
      icon: <Business />,
      title: "Let's register your institution",
      subtitle: "Provide basic organisation information to get started"
    },
    { 
      label: 'Admin Details', 
      icon: <Person />,
      title: "Who will manage your institution?",
      subtitle: "This person will act as the primary admin for Evalon"
    },
    { 
      label: 'Setup & Preferences', 
      icon: <Settings />,
      title: "Configure your institution",
      subtitle: "Let's customize how Evalon works for you"
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
      case 0: // Organisation Details
        if (!formData.organisationName.trim()) errors.organisationName = 'Organisation Name Is Required';
        if (!formData.country) errors.country = 'Country Is Required';
        if (!formData.state) errors.state = 'State Is Required';
        if (!formData.city.trim()) errors.city = 'City Is Required';
        if (!formData.pincode.trim()) errors.pincode = 'Pincode Is Required';
        if (!formData.organisationType) errors.organisationType = 'Organisation Type Is Required';
        break;
      case 1: // Admin Details
        if (!formData.adminName.trim()) errors.adminName = 'Admin Name Is Required';
        if (!formData.adminEmail.trim()) errors.adminEmail = 'Email Is Required';
        if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) errors.adminEmail = 'Please Enter A Valid Email';
        if (!formData.adminPhone.trim()) errors.adminPhone = 'Phone Number Is Required';
        if (!formData.password) errors.password = 'Password Is Required';
        if (formData.password.length < 8) errors.password = 'Password Must Be At Least 8 Characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords Do Not Match';
        // Temporarily commented out for development - uncomment for production
        // if (!formData.emailVerified) errors.emailVerified = 'Please Verify Your Email';
        // if (!formData.phoneVerified) errors.phoneVerified = 'Please Verify Your Phone Number';
        break;
      case 2: // Setup Preferences
        if (!formData.institutionStructure) errors.institutionStructure = 'Please Select Institution Structure';
        if (!formData.timeZone) errors.timeZone = 'Please Select Time Zone';
        break;
      default:
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateOrgCode = () => {
    // Get country code from form data (first 2 letters of country)
    const countryCode = formData.country ? formData.country.substring(0, 2).toUpperCase() : 'XX';
    
    // Generate 3-letter institution abbreviation from organisation name
    const orgName = formData.organisationName || 'ORG';
    const orgAbbrev = orgName
      .replace(/[^A-Za-z]/g, '') // Remove non-letters
      .substring(0, 3)
      .toUpperCase()
      .padEnd(3, 'X'); // Pad with X if less than 3 characters
    
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Generate 3-character random alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const randomPart = Array.from({ length: 3 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
    
    return `${countryCode}-${orgAbbrev}-${currentYear}-${randomPart}`;
  };

  const handleSubmit = async () => {
    // Validate Step 3 before submitting
    if (!validateStep(2)) {
      return; // Don't submit if validation fails
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const generatedCode = generateOrgCode();
      setOrgCode(generatedCode);
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 2000);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Step1OrganisationDetails
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 1:
        return (
          <Step2AdminDetails
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
          />
        );
      case 2:
        return (
          <Step3SetupPreferences
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
              Your institution <strong style={{ color: '#1f2937' }}>{formData.organisationName}</strong> has been successfully registered.
            </Typography>
            
            {/* Institution Code */}
            <Box
              sx={{
                p: 3,
                backgroundColor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                mb: 4,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1,
                  fontSize: '0.875rem',
                }}
              >
                Institution Code
              </Typography>
              
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: COLORS.PRIMARY,
                  fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
                  letterSpacing: '0.05em',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                {orgCode}
              </Typography>
              
              <Typography
                variant="caption"
                sx={{
                  color: '#6b7280',
                  display: 'block',
                  mt: 1,
                  fontSize: '0.75rem',
                }}
              >
                Save this code for future access
              </Typography>
            </Box>
            
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
                Register Institution
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
                  {isSubmitting ? 'Creating...' : 'Finish Setup'}
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

export default OrganisationRegistration;
