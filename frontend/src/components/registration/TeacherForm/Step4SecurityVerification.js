import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  CheckCircle,
  Send,
  Timer,
  Security,
  Visibility,
  VisibilityOff,
  Lock,
  Email,
  Phone,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';
import { teacherAPI } from '../../../services/api';

const Step4SecurityVerification = ({ formData, formErrors, onFormChange, registrationToken }) => {
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneTimer, setPhoneTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'default', percentage: 0 };
    
    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password),
      password.length >= 12,
    ];

    score = checks.filter(Boolean).length;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'error', percentage: 20 },
      1: { label: 'Weak', color: 'warning', percentage: 40 },
      2: { label: 'Fair', color: 'warning', percentage: 60 },
      3: { label: 'Good', color: 'info', percentage: 80 },
      4: { label: 'Strong', color: 'success', percentage: 90 },
      5: { label: 'Excellent', color: 'success', percentage: 100 },
    };

    return { score, ...strengthMap[Math.min(score, 5)] };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const getPasswordTips = (password) => {
    const tips = [];
    if (!password) return tips;
    
    if (password.length < 8) tips.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) tips.push('Include uppercase letter');
    if (!/[0-9]/.test(password)) tips.push('Include a number');
    if (!/[^A-Za-z0-9]/.test(password)) tips.push('Include special character');
    
    return tips;
  };

  const passwordTips = getPasswordTips(formData.password);

  // Enhanced field styling - matching organization registration
  const universalFieldStyle = {
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
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: COLORS.PRIMARY,
      },
    },
  };

  const handleSendEmailOTP = async () => {
    try {
      const response = await teacherAPI.sendEmailOTP({ 
        emailAddress: formData.emailAddress,
        registrationToken: registrationToken
      });
      if (response.success) {
        setEmailOtpSent(true);
        setEmailTimer(30);
        const interval = setInterval(() => {
          setEmailTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        // Show success notification
        console.log('Email OTP sent successfully');
      } else {
        throw new Error(response.message || 'Failed to send email OTP');
      }
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      // Show error notification
      alert(error.message || 'Failed to send email OTP. Please try again.');
    }
  };

  const handleSendPhoneOTP = async () => {
    try {
      const response = await teacherAPI.sendPhoneOTP({ 
        phoneNumber: formData.phoneNumber, 
        countryCode: formData.countryCode,
        registrationToken: registrationToken
      });
      if (response.success) {
        setPhoneOtpSent(true);
        setPhoneTimer(30);
        const interval = setInterval(() => {
          setPhoneTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        // Show success notification
        console.log('Phone OTP sent successfully');
      } else {
        throw new Error(response.message || 'Failed to send phone OTP');
      }
    } catch (error) {
      console.error('Failed to send phone OTP:', error);
      // Show error notification
      alert(error.message || 'Failed to send phone OTP. Please try again.');
    }
  };

  const handleVerifyEmailOTP = async () => {
    setVerifyingEmail(true);
    try {
      const response = await teacherAPI.verifyEmailOTP({ 
        emailOTP: emailOtp, 
        emailAddress: formData.emailAddress,
        registrationToken: registrationToken
      });
      if (response.success) {
        onFormChange('emailVerified', true);
        console.log('Email OTP verified successfully');
      } else {
        throw new Error(response.message || 'Failed to verify email OTP');
      }
    } catch (error) {
      console.error('Failed to verify email OTP:', error);
      alert(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    setVerifyingPhone(true);
    try {
      const response = await teacherAPI.verifyPhoneOTP({ 
        phoneOTP: phoneOtp, 
        phoneNumber: formData.phoneNumber, 
        countryCode: formData.countryCode,
        registrationToken: registrationToken
      });
      if (response.success) {
        onFormChange('phoneVerified', true);
        console.log('Phone OTP verified successfully');
      } else {
        throw new Error(response.message || 'Failed to verify phone OTP');
      }
    } catch (error) {
      console.error('Failed to verify phone OTP:', error);
      alert(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            mb: 0.5,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
          }}
        >
          Secure Your Account
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Verify your email and phone number for account security
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Email Verification */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Email Verification
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#666666', mb: 1.5, fontSize: '0.875rem' }}>
            {formData.emailAddress}
          </Typography>

          {!formData.emailVerified ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                sx={{ flex: 1, ...universalFieldStyle }}
                label="Email OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                }}
                disabled={!emailOtpSent}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                onClick={handleSendEmailOTP}
                disabled={emailOtpSent && emailTimer > 0}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY,
                  minWidth: 'auto',
                  px: 1.5,
                  py: 1.5,
                  height: '40px', // Match the small TextField height
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  },
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af',
                  },
                }}
              >
                {emailOtpSent && emailTimer > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer sx={{ fontSize: 16 }} />
                    {emailTimer}s
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Send sx={{ fontSize: 16 }} />
                    Send
                  </Box>
                )}
              </Button>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500 }}>
              Email verified successfully
            </Typography>
          )}

          {emailOtp && !formData.emailVerified && (
            <Box sx={{ mt: 1 }}>
              <Button
                onClick={handleVerifyEmailOTP}
                disabled={verifyingEmail}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: COLORS.PRIMARY,
                  '&:hover': {
                    backgroundColor: '#5a6fd8',
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                  },
                }}
              >
                {verifyingEmail ? (
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                ) : (
                  'Verify'
                )}
              </Button>
            </Box>
          )}

          {formData.emailVerified && (
            <Chip
              label="Email Verified"
              icon={<CheckCircle />}
              size="small"
              sx={{
                mt: 1,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontSize: '0.75rem',
              }}
            />
          )}

          {/* Email Verification Error */}
          {formErrors.emailVerified && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
              {formErrors.emailVerified}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Phone Verification */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Phone Verification
          </Typography>
          
          <Typography variant="body2" sx={{ color: '#666666', mb: 1.5, fontSize: '0.875rem' }}>
            {formData.countryCode} {formData.phoneNumber}
          </Typography>

          {!formData.phoneVerified ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                sx={{ flex: 1, ...universalFieldStyle }}
                label="Phone OTP"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                }}
                disabled={!phoneOtpSent}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                onClick={handleSendPhoneOTP}
                disabled={phoneOtpSent && phoneTimer > 0}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: COLORS.PRIMARY,
                  color: COLORS.PRIMARY,
                  minWidth: 'auto',
                  px: 1.5,
                  py: 1.5,
                  height: '40px', // Match the small TextField height
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    backgroundColor: 'rgba(102, 126, 234, 0.05)',
                  },
                  '&:disabled': {
                    borderColor: '#d1d5db',
                    color: '#9ca3af',
                  },
                }}
              >
                {phoneOtpSent && phoneTimer > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer sx={{ fontSize: 16 }} />
                    {phoneTimer}s
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Send sx={{ fontSize: 16 }} />
                    Send
                  </Box>
                )}
              </Button>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 500 }}>
              Phone verified successfully
            </Typography>
          )}

          {phoneOtp && !formData.phoneVerified && (
            <Box sx={{ mt: 1 }}>
              <Button
                onClick={handleVerifyPhoneOTP}
                disabled={verifyingPhone}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: COLORS.PRIMARY,
                  '&:hover': {
                    backgroundColor: '#5a6fd8',
                  },
                  '&:disabled': {
                    backgroundColor: '#9ca3af',
                  },
                }}
              >
                {verifyingPhone ? (
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                ) : (
                  'Verify'
                )}
              </Button>
            </Box>
          )}

          {formData.phoneVerified && (
            <Chip
              label="Phone Verified"
              icon={<CheckCircle />}
              size="small"
              sx={{
                mt: 1,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                fontSize: '0.75rem',
              }}
            />
          )}

          {/* Phone Verification Error */}
          {formErrors.phoneVerified && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
              {formErrors.phoneVerified}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Password */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Create Password *
          </Typography>
          {formErrors.password && (
            <Typography variant="caption" sx={{ color: '#ef4444', mb: 1, display: 'block', fontWeight: 500 }}>
              This Field Is Required
            </Typography>
          )}
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => onFormChange('password', e.target.value)}
            error={!!formErrors.password}
            helperText={formErrors.password || "Create a strong password for your account"}
            placeholder="Create a strong password"
            sx={universalFieldStyle}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ 
                      color: COLORS.TEXT_SECONDARY,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Enhanced Password Strength Indicator - Matching Organization Registration */}
          {formData.password && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: 'rgba(102, 126, 234, 0.03)', 
              borderRadius: 2, 
              border: '1px solid rgba(102, 126, 234, 0.1)',
              boxShadow: '0 2px 4px rgba(102, 126, 234, 0.05)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(102, 126, 234, 0.1)',
                transform: 'translateY(-1px)',
              }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY, fontWeight: 500 }}>
                  Password Strength:
                </Typography>
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={passwordStrength.percentage}
                color={passwordStrength.color}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${passwordStrength.color === 'error' ? '#f44336' : 
                                                       passwordStrength.color === 'warning' ? '#ff9800' : 
                                                       passwordStrength.color === 'info' ? '#2196f3' : 
                                                       passwordStrength.color === 'success' ? '#4caf50' : '#9e9e9e'}, 
                                                       ${passwordStrength.color === 'error' ? '#ff5722' : 
                                                       passwordStrength.color === 'warning' ? '#ffc107' : 
                                                       passwordStrength.color === 'info' ? '#03a9f4' : 
                                                       passwordStrength.color === 'success' ? '#8bc34a' : '#bdbdbd'})`,
                  },
                }}
              />
              
              {/* Password Requirements */}
              {passwordTips.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Typography variant="caption" sx={{ 
                    color: !passwordTips.includes('At least 8 characters') ? '#16a34a' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                  }}>
                    <CheckCircle sx={{ fontSize: 12 }} />
                    At Least 8 Characters
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: !passwordTips.includes('Include uppercase letter') ? '#16a34a' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                  }}>
                    <CheckCircle sx={{ fontSize: 12 }} />
                    Uppercase Letter
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: !passwordTips.includes('Include a number') ? '#16a34a' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                  }}>
                    <CheckCircle sx={{ fontSize: 12 }} />
                    Number
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: !passwordTips.includes('Include special character') ? '#16a34a' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.75rem',
                  }}>
                    <CheckCircle sx={{ fontSize: 12 }} />
                    Special Character
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Confirm Password */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Confirm Password *
          </Typography>
          {formErrors.confirmPassword && (
            <Typography variant="caption" sx={{ color: '#ef4444', mb: 1, display: 'block', fontWeight: 500 }}>
              This Field Is Required
            </Typography>
          )}
          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => onFormChange('confirmPassword', e.target.value)}
            error={!!formErrors.confirmPassword}
            helperText={formErrors.confirmPassword}
            placeholder="Confirm your password"
            sx={universalFieldStyle}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    sx={{ 
                      color: COLORS.TEXT_SECONDARY,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      },
                    }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {/* Password Match Indicator */}
          {formData.password && formData.confirmPassword && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ 
                color: formData.password === formData.confirmPassword ? '#16a34a' : '#ef4444',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}>
                <CheckCircle sx={{ fontSize: 14 }} />
                {formData.password === formData.confirmPassword ? 'Passwords Match' : 'Passwords Do Not Match'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Verification Status Warning */}
        {(formErrors.emailVerified || formErrors.phoneVerified) && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: 'rgba(239, 68, 68, 0.05)', 
            borderRadius: 2, 
            border: '1px solid rgba(239, 68, 68, 0.1)',
          }}>
            <Typography variant="body2" sx={{ 
              color: '#ef4444', 
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}>
              <Security sx={{ fontSize: 18 }} />
              Email And Phone Verification Required To Proceed
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#dc2626', 
              mt: 0.5, 
              display: 'block',
            }}>
              Please complete both email and phone verification before continuing to the next step.
            </Typography>
          </Box>
        )}
      </Box>

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
          sx={{ color: '#555555', fontSize: '0.875rem' }}
        >
          <strong style={{ color: '#333333' }}>Security Note:</strong> We'll send verification codes to your email and phone number to ensure the security of your account. This helps protect your account and verify your identity. Both verifications are required to proceed.
        </Typography>
      </Box>
    </Box>
  );
};

export default Step4SecurityVerification;
