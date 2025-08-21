import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Fade,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Security,
  Email,
  Phone,
  Send,
  CheckCircle,
  Timer,
} from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const Step4SecurityVerification = ({ formData, formErrors, onFormChange }) => {
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);

  // Universal field styling
  const universalFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
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
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: COLORS.PRIMARY,
      },
    },
  };

  const handleSendEmailOTP = () => {
    setEmailOtpSent(true);
    setEmailTimer(60);
    const interval = setInterval(() => {
      setEmailTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendPhoneOTP = () => {
    setPhoneOtpSent(true);
    setPhoneTimer(60);
    const interval = setInterval(() => {
      setPhoneTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyEmailOTP = () => {
    setVerifyingEmail(true);
    setTimeout(() => {
      onFormChange('emailVerified', true);
      setVerifyingEmail(false);
    }, 1000);
  };

  const handleVerifyPhoneOTP = () => {
    setVerifyingPhone(true);
    setTimeout(() => {
      onFormChange('phoneVerified', true);
      setVerifyingPhone(false);
    }, 1000);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            🔐 Security Verification
          </Typography>
          <Typography
            variant="body1"
            sx={{ 
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.9rem',
            }}
          >
            <Security sx={{ fontSize: 16, color: COLORS.PRIMARY }} />
            Verify your email and phone number for account security
          </Typography>
        </Box>
      </Fade>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Email Verification */}
        <Fade in timeout={800}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Email sx={{ color: COLORS.PRIMARY, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                Email Verification
              </Typography>
              {formData.emailVerified && (
                <Chip
                  icon={<CheckCircle />}
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              {formData.emailAddress}
            </Typography>

            {!formData.emailVerified ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSendEmailOTP}
                  disabled={emailOtpSent && emailTimer > 0}
                  startIcon={emailOtpSent && emailTimer > 0 ? <Timer /> : <Send />}
                  sx={{ 
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  {emailOtpSent && emailTimer > 0 ? `Resend (${emailTimer}s)` : 'Send OTP'}
                </Button>
                
                {emailOtpSent && (
                  <TextField
                    size="small"
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={handleVerifyEmailOTP}
                            disabled={!emailOtp || verifyingEmail}
                            sx={{
                              minWidth: 'auto',
                              p: 0.5,
                              color: COLORS.PRIMARY,
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.04)',
                              },
                            }}
                          >
                            {verifyingEmail ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CheckCircle sx={{ fontSize: 16 }} />
                            )}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 150,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                )}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                ✅ Email verified successfully
              </Typography>
            )}
          </Box>
        </Fade>

        {/* Phone Verification */}
        <Fade in timeout={900}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Phone sx={{ color: COLORS.PRIMARY, fontSize: 20 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                Phone Verification
              </Typography>
              {formData.phoneVerified && (
                <Chip
                  icon={<CheckCircle />}
                  label="Verified"
                  color="success"
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
              {formData.countryCode} {formData.phoneNumber}
            </Typography>

            {!formData.phoneVerified ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSendPhoneOTP}
                  disabled={phoneOtpSent && phoneTimer > 0}
                  startIcon={phoneOtpSent && phoneTimer > 0 ? <Timer /> : <Send />}
                  sx={{ 
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  {phoneOtpSent && phoneTimer > 0 ? `Resend (${phoneTimer}s)` : 'Send OTP'}
                </Button>
                
                {phoneOtpSent && (
                  <TextField
                    size="small"
                    placeholder="Enter OTP"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            onClick={handleVerifyPhoneOTP}
                            disabled={!phoneOtp || verifyingPhone}
                            sx={{
                              minWidth: 'auto',
                              p: 0.5,
                              color: COLORS.PRIMARY,
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.04)',
                              },
                            }}
                          >
                            {verifyingPhone ? (
                              <CircularProgress size={16} />
                            ) : (
                              <CheckCircle sx={{ fontSize: 16 }} />
                            )}
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: 150,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                )}
              </Box>
            ) : (
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                ✅ Phone verified successfully
              </Typography>
            )}
          </Box>
        </Fade>

        {/* Instructions */}
        <Fade in timeout={1000}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Verification Process:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • Click "Send OTP" to receive verification codes
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • Enter the codes to verify your contact information
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • Both email and phone must be verified to proceed
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • You can resend OTP after 60 seconds if needed
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default Step4SecurityVerification;
