import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Email,
  Phone,
  VerifiedUser,
  CheckCircle,
  Send,
} from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const VerificationSection = ({ formData, onFormChange, onSubmit, isSubmitting, orgCode }) => {
  const [emailOTPSent, setEmailOTPSent] = useState(false);
  const [phoneOTPSent, setPhoneOTPSent] = useState(false);
  const [emailOTPVerified, setEmailOTPVerified] = useState(false);
  const [phoneOTPVerified, setPhoneOTPVerified] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  useEffect(() => {
    let emailTimer, phoneTimer;
    
    if (emailCountdown > 0) {
      emailTimer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    if (phoneCountdown > 0) {
      phoneTimer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
    }
    
    return () => {
      if (emailTimer) clearTimeout(emailTimer);
      if (phoneTimer) clearTimeout(phoneTimer);
    };
  }, [emailCountdown, phoneCountdown]);

  const handleSendEmailOTP = () => {
    setEmailOTPSent(true);
    setEmailCountdown(60);
    // Simulate API call
    setTimeout(() => {
      // OTP sent successfully
    }, 1000);
  };

  const handleSendPhoneOTP = () => {
    setPhoneOTPSent(true);
    setPhoneCountdown(60);
    // Simulate API call
    setTimeout(() => {
      // OTP sent successfully
    }, 1000);
  };

  const handleVerifyEmailOTP = () => {
    if (formData.emailOTP === '123456') { // Simulate verification
      setEmailOTPVerified(true);
    }
  };

  const handleVerifyPhoneOTP = () => {
    if (formData.phoneOTP === '123456') { // Simulate verification
      setPhoneOTPVerified(true);
    }
  };

  if (orgCode) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircle
          sx={{
            fontSize: 80,
            color: '#4caf50',
            mb: 3,
            animation: 'checkmarkBounce 0.6s ease-out',
          }}
        />
        
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            color: COLORS.TEXT_PRIMARY,
            mb: 2,
          }}
        >
          Organisation Created Successfully!
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            color: COLORS.TEXT_SECONDARY,
            mb: 4,
          }}
        >
          Your organisation has been registered with Evalon
        </Typography>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
            }}
          >
            Your Organisation Code
          </Typography>
          
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.2em',
              mb: 2,
            }}
          >
            {orgCode}
          </Typography>
          
          <Typography
            variant="body2"
            sx={{
              opacity: 0.9,
            }}
          >
            Share this code with teachers and students to join your organisation
          </Typography>
        </Paper>

        <Button
          variant="contained"
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
          }}
        >
          Go to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: COLORS.TEXT_PRIMARY,
          mb: 3,
          textAlign: 'center',
        }}
      >
        Verification
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: COLORS.TEXT_SECONDARY,
          mb: 4,
          textAlign: 'center',
        }}
      >
        Verify your email and phone number to complete registration
      </Typography>

      <Grid container spacing={3}>
        {/* Email Verification */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: emailOTPVerified ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
              borderColor: emailOTPVerified ? '#4caf50' : '#e0e0e0',
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Email sx={{ mr: 1, color: COLORS.PRIMARY }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Email Verification
              </Typography>
              {emailOTPVerified && (
                <CheckCircle sx={{ ml: 1, color: '#4caf50' }} />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT_SECONDARY }}>
              {formData.adminEmail}
            </Typography>

            {!emailOTPVerified ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Enter OTP"
                  value={formData.emailOTP}
                  onChange={(e) => onFormChange('emailOTP', e.target.value)}
                  placeholder="123456"
                  InputProps={{
                    inputProps: { maxLength: 6, pattern: '[0-9]*' }
                  }}
                  sx={{ 
                    flex: 1,
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: COLORS.PRIMARY,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleSendEmailOTP}
                  disabled={emailCountdown > 0}
                  startIcon={emailCountdown > 0 ? <CircularProgress size={16} /> : <Send />}
                  sx={{
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                    '&:disabled': {
                      borderColor: '#e0e0e0',
                      color: '#bdbdbd',
                    },
                  }}
                >
                  {emailCountdown > 0 ? `${emailCountdown}s` : 'Send OTP'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerifyEmailOTP}
                  disabled={!formData.emailOTP || formData.emailOTP.length !== 6}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    '&:disabled': {
                      background: '#e0e0e0',
                      color: '#bdbdbd',
                    },
                  }}
                >
                  Verify
                </Button>
              </Box>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                Email verified successfully!
              </Alert>
            )}
          </Box>
        </Grid>

        {/* Phone Verification */}
        <Grid item xs={12}>
          <Box
            sx={{
              p: 3,
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: phoneOTPVerified ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
              borderColor: phoneOTPVerified ? '#4caf50' : '#e0e0e0',
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Phone sx={{ mr: 1, color: COLORS.PRIMARY }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Phone Verification
              </Typography>
              {phoneOTPVerified && (
                <CheckCircle sx={{ ml: 1, color: '#4caf50' }} />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, color: COLORS.TEXT_SECONDARY }}>
              {formData.adminPhone}
            </Typography>

            {!phoneOTPVerified ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <TextField
                  label="Enter OTP"
                  value={formData.phoneOTP}
                  onChange={(e) => onFormChange('phoneOTP', e.target.value)}
                  placeholder="123456"
                  InputProps={{
                    inputProps: { maxLength: 6, pattern: '[0-9]*' }
                  }}
                  sx={{ 
                    flex: 1,
                    minWidth: 200,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#e0e0e0',
                      },
                      '&:hover fieldset': {
                        borderColor: COLORS.PRIMARY,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: COLORS.PRIMARY,
                      },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleSendPhoneOTP}
                  disabled={phoneCountdown > 0}
                  startIcon={phoneCountdown > 0 ? <CircularProgress size={16} /> : <Send />}
                  sx={{
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                    '&:disabled': {
                      borderColor: '#e0e0e0',
                      color: '#bdbdbd',
                    },
                  }}
                >
                  {phoneCountdown > 0 ? `${phoneCountdown}s` : 'Send OTP'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleVerifyPhoneOTP}
                  disabled={!formData.phoneOTP || formData.phoneOTP.length !== 6}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    },
                    '&:disabled': {
                      background: '#e0e0e0',
                      color: '#bdbdbd',
                    },
                  }}
                >
                  Verify
                </Button>
              </Box>
            ) : (
              <Alert severity="success" sx={{ mt: 2 }}>
                Phone verified successfully!
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Info Box */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderRadius: 2,
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: COLORS.TEXT_SECONDARY,
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <strong>Note:</strong> For testing purposes, use <strong>123456</strong> as the OTP code.
          <br />
          In production, real OTP codes will be sent to your email and phone.
        </Typography>
      </Box>
    </Box>
  );
};

export default VerificationSection;
