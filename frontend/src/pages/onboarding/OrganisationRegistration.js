import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  Fade,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Business,
  Security,
  Settings,
  CheckCircle,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, GRADIENTS } from '../../theme/constants';
import Step1OrganisationDetails from '../../components/registration/OrganisationForm/Step1OrganisationDetails';
import Step2AdminDetails from '../../components/registration/OrganisationForm/Step2AdminDetails';
import Step3SetupPreferences from '../../components/registration/OrganisationForm/Step3SetupPreferences';
import { organizationAPI, healthAPI } from '../../services/api';
import '../../styles/registration/organisation.css';

const OrganisationRegistration = ({ onNavigateToLanding, onNavigateToLogin }) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgCode, setOrgCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [registrationToken, setRegistrationToken] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
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
    emailOTP: '',
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

  // Notification handler
  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      await healthAPI.check();
      setBackendConnected(true);
      // Backend connection successful - no notification needed
    } catch (error) {
      setBackendConnected(false);
      showNotification('Backend server is not running. Please start the backend server.', 'error');
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    checkBackendConnection();
    
    // Validate registration session with backend before restoring
    const validateAndRestoreSession = async () => {
      const savedToken = localStorage.getItem('orgRegistrationToken');
      
      // RULE 1: If no token, start from step 1
      if (!savedToken) {
        console.log('🔄 [FRONTEND] No saved registration token - starting from step 1');
        setActiveStep(0);
        return;
      }
      
      console.log('🔄 [FRONTEND] Found saved registration token - validating with backend...');
      
      try {
        // RULE 2: Backend must decide the step
        const sessionStatus = await organizationAPI.getRegistrationSessionStatus(savedToken);
        
        console.log('🔄 [FRONTEND] Session status response:', sessionStatus);
        
        // RULE 3: Conditional step restoration based on backend response
        if (!sessionStatus.data?.sessionValid) {
          // Session invalid - clear everything and start from step 1
          console.log('❌ [FRONTEND] Session invalid - clearing and starting from step 1');
          console.log('❌ [FRONTEND] Reason:', sessionStatus.data?.reason);
          
          localStorage.removeItem('orgRegistrationToken');
          localStorage.removeItem('orgRegistrationStep');
          setRegistrationToken(null);
          setActiveStep(0);
          return;
        }
        
        // Session is valid - restore token and step based on backend response
        console.log('✅ [FRONTEND] Session valid');
        console.log('✅ [FRONTEND] Last completed step:', sessionStatus.data?.lastCompletedStep);
        
        setRegistrationToken(savedToken);
        
        // Only restore step if backend confirms step 1 was completed
        const lastCompletedStep = sessionStatus.data?.lastCompletedStep || 0;
        
        if (lastCompletedStep >= 1) {
          // Step 1 completed - go to step 2 (admin details)
          console.log('✅ [FRONTEND] Step 1 completed - restoring to step 2');
          setActiveStep(1);
          if (sessionStatus.data?.orgCode) {
            setOrgCode(sessionStatus.data.orgCode);
          }
        } else {
          // Step 1 not completed - start from step 1
          console.log('⚠️ [FRONTEND] Step 1 not completed - starting from step 1');
          setActiveStep(0);
        }
        
      } catch (error) {
        console.error('❌ [FRONTEND] Failed to validate session:', error);
        // On error, clear and start fresh
        localStorage.removeItem('orgRegistrationToken');
        localStorage.removeItem('orgRegistrationStep');
        setRegistrationToken(null);
        setActiveStep(0);
      }
    };
    
    validateAndRestoreSession();
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
      icon: <Security />,
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

  const handleNext = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    if (!backendConnected) {
      showNotification('Backend server is not connected. Please start the backend server.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (activeStep === 0) {
        // Step 1: Organization Details
        const step1Data = {
          organisationName: formData.organisationName,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
          organisationType: formData.organisationType,
          studentStrength: formData.studentStrength,
          isGovernmentRecognized: formData.isGovernmentRecognized
        };

        const response = await organizationAPI.registerStep1(step1Data);
        
        if (response.success) {
          console.log('Step 1 response:', response.data);
          const token = response.data.registrationToken;
          setRegistrationToken(token);
          setOrgCode(response.data.orgCode);
          
          // Persist token to localStorage to survive page refreshes
          // NOTE: Step is NOT saved - backend will determine step on reload
          if (token) {
            localStorage.setItem('orgRegistrationToken', token);
            // Do NOT save step - backend is the source of truth
            console.log('💾 [FRONTEND] Registration token saved to localStorage (step NOT saved)');
          }
          
          showNotification('Organization details saved successfully!', 'success');
          setActiveStep(1);
        }
        } else if (activeStep === 1) {
          // Step 2: Admin Details - save admin details before proceeding
          if (!formData.emailVerified) {
            showNotification('Please verify your email before proceeding', 'warning');
            return;
          }

          // Validate required fields before saving
          if (!formData.adminName || !formData.adminName.trim()) {
            showNotification('Please enter admin name', 'warning');
            return;
          }

          // Check if password fields are filled before proceeding
          if (!formData.password || !formData.confirmPassword) {
            showNotification('Please fill in password and confirm password before proceeding', 'warning');
            return;
          }
          if (formData.password !== formData.confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
          }

          // Save admin details to backend (registerStep2)
          try {
            console.log('📝 [FRONTEND] Preparing to save admin details...');
            console.log('📝 [FRONTEND] Registration token:', registrationToken ? registrationToken.substring(0, 10) + '...' : 'NULL/UNDEFINED');
            console.log('📝 [FRONTEND] Admin email:', formData.adminEmail);
            console.log('📝 [FRONTEND] Admin name:', formData.adminName);
            
            if (!registrationToken) {
              showNotification('Registration session expired. Please start registration from step 1.', 'error');
              return;
            }
            
            const step2Data = {
              adminName: formData.adminName,
              adminEmail: formData.adminEmail,
              registrationToken: registrationToken,
              password: formData.password,
              confirmPassword: formData.confirmPassword
            };

            // Only include phone fields if provided
            if (formData.adminPhone && formData.adminPhone.trim()) {
              step2Data.adminPhone = formData.adminPhone;
            }
            if (formData.countryCode) {
              step2Data.countryCode = formData.countryCode;
            }

            const registerResponse = await organizationAPI.registerStep2(step2Data);
            
            if (!registerResponse.success) {
              showNotification(registerResponse.message || 'Failed to save admin details', 'error');
              return;
            }

            showNotification('Moving to setup preferences!', 'success');
            setActiveStep(2);
          } catch (error) {
            console.error('Failed to save admin details:', error);
            showNotification(error.message || 'Failed to save admin details', 'error');
            return;
          }
        } else if (activeStep === 2) {
        // Step 3: Complete Registration
        if (!registrationToken) {
          showNotification('Registration session expired. Please start over.', 'error');
          return;
        }

        const completeData = {
          registrationToken: registrationToken,
          emailVerified: formData.emailVerified || false,
          phoneVerified: false // Phone verification removed
        };

        const response = await organizationAPI.registerStep3(completeData);
        
        if (response.success) {
          console.log('Registration completed:', response.data);
          showNotification('Organization registered successfully!', 'success');
          
          // Store the auth token and redirect to dashboard
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('userType', 'organization_admin');
          localStorage.setItem('organizationId', response.data.organization.id);
          
          // Clear registration token from localStorage (registration complete)
          localStorage.removeItem('orgRegistrationToken');
          localStorage.removeItem('orgRegistrationStep');
          console.log('🧹 [FRONTEND] Cleared registration token from localStorage');
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        }
      } else {
        // Step 4: Success page (if needed)
        setActiveStep(3);
      }

      // Scroll to top when moving to next step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Registration error:', error);
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
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
        // Phone number is now optional - no validation required
        if (!formData.password) errors.password = 'Password Is Required';
        if (formData.password.length < 8) errors.password = 'Password Must Be At Least 8 Characters';
        if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords Do Not Match';
        if (!formData.emailVerified) errors.emailVerified = 'Please Verify Your Email';
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

    if (!backendConnected) {
      showNotification('Backend server is not connected. Please start the backend server.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Step 3: Complete Registration
      const step3Data = {
        institutionStructure: formData.institutionStructure,
        departments: formData.departments,
        addSubAdmins: formData.addSubAdmins,
        timeZone: formData.timeZone,
        twoFactorAuth: formData.twoFactorAuth,
        logo: formData.logo || null, // Send base64 logo string directly
        registrationToken: registrationToken
      };

      const response = await organizationAPI.registerStep3(step3Data);
      
      if (response.success) {
        showNotification('Organization registered successfully!', 'success');
        setShowSuccess(true);
        
        // Store the JWT token for future use
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('organizationId', response.data.organization.id);
          localStorage.setItem('adminId', response.data.admin.id);
        }
      }
    } catch (error) {
      console.error('Final registration error:', error);
      showNotification(error.message || 'Failed to complete registration. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
        // console.log('Rendering Step2 with registrationToken:', registrationToken);
        return (
          <Step2AdminDetails
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
            registrationToken={registrationToken}
          />
        );
      case 2:
        return (
          <Step3SetupPreferences
            formData={formData}
            formErrors={formErrors}
            onFormChange={handleFormChange}
            orgCode={orgCode}
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
    <>
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

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
    </>
  );
};

export default OrganisationRegistration;
