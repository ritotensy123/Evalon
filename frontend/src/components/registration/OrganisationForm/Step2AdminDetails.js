import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Button,
  CircularProgress,
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  Alert,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Visibility,
  VisibilityOff,
  CheckCircle,
  Send,
  Lock,
  Security,
  Warning,
  Info,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';
import { otpAPI, organizationAPI } from '../../../services/api';

const Step2AdminDetails = ({ formData, formErrors, onFormChange, registrationToken }) => {
  // Debug: Log the registration token and form data
  // console.log('Step2AdminDetails - registrationToken:', registrationToken);
  // console.log('Step2AdminDetails - formData:', formData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);  const [emailOtp, setEmailOtp] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [showPasswordTips, setShowPasswordTips] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);

  const countryCodes = [
    { value: '+91', label: '🇮🇳 +91 (India)', flag: '🇮🇳' },
    { value: '+1', label: '🇺🇸 +1 (USA)', flag: '🇺🇸' },
    { value: '+44', label: '🇬🇧 +44 (UK)', flag: '🇬🇧' },
    { value: '+61', label: '🇦🇺 +61 (Australia)', flag: '🇦🇺' },
    { value: '+86', label: '🇨🇳 +86 (China)', flag: '🇨🇳' },
    { value: '+81', label: '🇯🇵 +81 (Japan)', flag: '🇯🇵' },
    { value: '+49', label: '🇩🇪 +49 (Germany)', flag: '🇩🇪' },
    { value: '+33', label: '🇫🇷 +33 (France)', flag: '🇫🇷' },
  ];

  // Enhanced field styling - matching login page
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
    if (!formData.adminEmail || !/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!registrationToken) {
      setEmailError('Registration session expired. Please start over.');
      return;
    }

    setEmailError('');
    setEmailOtpSent(true);
    
    try {
      // Send OTP directly - only requires email and registrationToken
      const response = await organizationAPI.sendEmailOTP({
        email: formData.adminEmail,
        registrationToken: registrationToken,
        purpose: 'registration'
      });
      
      if (response.success) {
        console.log('Email OTP sent successfully');
        // Keep emailOtpSent as true to show the OTP input box
        // It will be reset to false when OTP is verified
        // Start resend cooldown
        setEmailResendCooldown(60);
        const cooldownInterval = setInterval(() => {
          setEmailResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setEmailOtpSent(false);
        setEmailError(response.message || 'Failed to send email OTP');
      }
    } catch (error) {
      console.error('Email OTP error:', error);
      setEmailError(error.message || error.response?.data?.message || 'Failed to send email OTP');
      setEmailOtpSent(false);
    }
  };


  const handleVerifyEmail = async () => {
    if (!emailOtp) {
      setEmailError('Please enter the OTP');
      return;
    }
    
    setEmailError('');
    setVerifyingEmail(true);
    
    try {
      console.log('Verifying email OTP with token:', registrationToken);
      const response = await organizationAPI.verifyEmailOTP({
        email: formData.adminEmail,
        otp: emailOtp
      });
      
      if (response.success) {
        onFormChange('emailVerified', true);
        setEmailOtp('');
        setEmailOtpSent(false); // Reset OTP sent state after successful verification
        console.log('Email verified successfully');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setEmailError(error.message || 'Failed to verify email OTP');
    } finally {
      setVerifyingEmail(false);
    }
  };


  const handleResendEmailOTP = () => {
    if (emailResendCooldown > 0) return;
    handleSendEmailOTP();
  };

  const getPasswordStrength = (password) => {
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
      0: { label: 'Very Weak', color: 'error', percentage: 20, icon: '🔴' },
      1: { label: 'Weak', color: 'warning', percentage: 40, icon: '🟠' },
      2: { label: 'Fair', color: 'warning', percentage: 60, icon: '🟡' },
      3: { label: 'Good', color: 'info', percentage: 80, icon: '🔵' },
      4: { label: 'Strong', color: 'success', percentage: 90, icon: '🟢' },
      5: { label: 'Excellent', color: 'success', percentage: 100, icon: '💪' },
    };

    return { score, ...strengthMap[Math.min(score, 5)] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Enhanced Section Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
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
            Admin Contact Details
          </Typography>
          <Typography
            variant="body1"
            sx={{ 
              color: '#666666',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            <Info sx={{ fontSize: { xs: 16, sm: 18 }, color: COLORS.PRIMARY }} />
            This admin will manage your institution on Evalon
          </Typography>
        </Box>
      </Fade>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2.5, md: 3 } }}>
        {/* Full Name */}
        <Slide direction="up" in timeout={800}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.adminName}
            onChange={(e) => onFormChange('adminName', e.target.value)}
            error={!!formErrors.adminName}
            helperText={formErrors.adminName}
            placeholder="Enter admin's full name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={universalFieldStyle}
          />
        </Slide>

        {/* Email Address */}
        <Slide direction="up" in timeout={900}>
          <Box>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => onFormChange('adminEmail', e.target.value)}
              error={!!formErrors.adminEmail}
              helperText={formErrors.adminEmail}
              placeholder="Enter admin's email address"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: formData.emailVerified && (
                  <InputAdornment position="end">
                    <CheckCircle sx={{ color: COLORS.SUCCESS, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={universalFieldStyle}
            />
            
            {emailError && (
              <Alert severity="error" sx={{ mt: 1, fontSize: '0.875rem' }}>
                {emailError}
              </Alert>
            )}
            
            <Collapse in={!formData.emailVerified && formData.adminEmail && /\S+@\S+\.\S+/.test(formData.adminEmail)}>
              <Box sx={{ 
                mt: 1, 
                display: 'flex', 
                gap: { xs: 1, sm: 1.5 }, 
                alignItems: 'center',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap'
              }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleSendEmailOTP}
                  disabled={emailOtpSent}
                  startIcon={emailOtpSent ? <CircularProgress size={16} /> : <Send />}
                  sx={{ 
                    borderColor: COLORS.PRIMARY,
                    color: COLORS.PRIMARY,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 8px rgba(102, 126, 234, 0.2)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {emailOtpSent ? 'Sending...' : 'Send OTP'}
                </Button>
                
                {emailOtpSent && emailResendCooldown > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    disabled
                    sx={{ 
                      color: COLORS.TEXT_DISABLED,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                    }}
                  >
                    Resend in {emailResendCooldown}s
                  </Button>
                )}
                
                {emailOtpSent && emailResendCooldown === 0 && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleResendEmailOTP}
                    sx={{ 
                      color: COLORS.PRIMARY,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                      },
                    }}
                  >
                    Resend OTP
                  </Button>
                )}
                
                <Collapse in={emailOtpSent} orientation="horizontal">
                  <TextField
                    size="small"
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={handleVerifyEmail}
                            disabled={!emailOtp || verifyingEmail}
                            sx={{ 
                              color: COLORS.PRIMARY,
                              '&:disabled': { color: COLORS.TEXT_DISABLED },
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              },
                            }}
                          >
                            {verifyingEmail ? <CircularProgress size={16} /> : <CheckCircle />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      width: { xs: '100%', sm: 150 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Collapse>
              </Box>
            </Collapse>
            
          </Box>
        </Slide>

        {/* Phone Number */}
        <Slide direction="up" in timeout={1000}>
          <Box>
            <TextField
              fullWidth
              label="Phone Number (Optional)"
              value={formData.adminPhone}
              onChange={(e) => onFormChange('adminPhone', e.target.value)}
              error={!!formErrors.adminPhone}
              helperText={formErrors.adminPhone}
              placeholder="Enter phone number (optional)"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FormControl sx={{ minWidth: 80, mr: 1 }}>
                      <Select
                        value={formData.countryCode || '+91'}
                        onChange={(e) => onFormChange('countryCode', e.target.value)}
                        variant="standard"
                        sx={{
                          '&:before': { borderBottom: 'none' },
                          '&:after': { borderBottom: 'none' },
                          '& .MuiSelect-select': {
                            paddingTop: 0,
                            paddingBottom: 0,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 200,
                              '& .MuiMenuItem-root': {
                                fontSize: '0.875rem',
                              }
                            }
                          }
                        }}
                      >
                        {countryCodes.map((code) => (
                          <MenuItem key={code.value} value={code.value}>
                            {code.flag} {code.value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </InputAdornment>
                ),
              }}
              sx={universalFieldStyle}
            />
          </Box>
        </Slide>

        {/* Password Section */}
        <Slide direction="up" in timeout={1100}>
          <Box>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => onFormChange('password', e.target.value)}
              error={!!formErrors.password}
              helperText={formErrors.password}
              placeholder="Create a strong password"
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
              sx={universalFieldStyle}
            />

            {/* Enhanced Password Strength Indicator */}
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
                
                {/* Password Tips */}
                {passwordTips.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => setShowPasswordTips(!showPasswordTips)}
                      sx={{ 
                        color: COLORS.PRIMARY,
                        textTransform: 'none',
                        p: 0,
                        minWidth: 'auto',
                        fontWeight: 500,
                        '&:hover': { 
                          backgroundColor: 'transparent',
                          color: '#667eea',
                          transform: 'translateX(2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Info sx={{ fontSize: 14 }} />
                        {showPasswordTips ? 'Hide' : 'Show'} password tips
                      </Typography>
                    </Button>
                    
                    <Collapse in={showPasswordTips}>
                      <Box sx={{ mt: 1, pl: 2 }}>
                        {passwordTips.map((tip, index) => (
                          <Typography key={index} variant="caption" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 0.5,
                            color: '#666666',
                            mb: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            backgroundColor: 'rgba(255, 152, 0, 0.05)',
                            border: '1px solid rgba(255, 152, 0, 0.1)',
                          }}>
                            <Warning sx={{ fontSize: 12, color: '#ff9800' }} />
                            {tip}
                          </Typography>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Slide>

        {/* Confirm Password */}
        <Slide direction="up" in timeout={1200}>
          <Box>
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => onFormChange('confirmPassword', e.target.value)}
              error={!!formErrors.confirmPassword || (formData.confirmPassword && formData.password && formData.confirmPassword !== formData.password)}
              helperText={
                formErrors.confirmPassword || 
                (formData.confirmPassword && formData.password && formData.confirmPassword !== formData.password ? 'Passwords do not match' : '')
              }
              placeholder="Confirm your password"
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
              sx={universalFieldStyle}
            />
            
            {/* Real-time password match indicator */}
            {formData.confirmPassword && formData.password && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                {formData.confirmPassword === formData.password ? (
                  <>
                    <CheckCircle sx={{ color: COLORS.SUCCESS, fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: COLORS.SUCCESS, fontWeight: 500 }}>
                      Passwords match
                    </Typography>
                  </>
                ) : (
                  <>
                    <Warning sx={{ color: '#f59e0b', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 500 }}>
                      Passwords do not match
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </Slide>
      </Box>

      {/* Info Box */}
      <Fade in timeout={1600}>
        <Box
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: 'rgba(102, 126, 234, 0.03)',
            borderRadius: 2,
            border: '1px solid rgba(102, 126, 234, 0.1)',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.05)',
          }}
        >
          <Typography
            variant="body2"
            sx={{ 
              color: '#555555',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              lineHeight: 1.6,
            }}
          >
            <Info sx={{ color: COLORS.PRIMARY, fontSize: 18, mt: 0.2 }} />
            <span>
              <strong style={{ color: '#333333' }}>Important:</strong> This admin will have full access to manage your institution on Evalon. Please ensure all contact details are verified and the password meets security requirements before proceeding.
            </span>
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
};

export default Step2AdminDetails;
