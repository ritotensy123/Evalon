import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle,
  School,
  Person,
  Assessment,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step3CompleteRegistration = ({ formData, formErrors, onFormChange, registrationToken }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Set affiliation type to freelance by default
  React.useEffect(() => {
    onFormChange('affiliationType', 'freelance');
  }, []); // Empty dependency array to run only once

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

  // Enhanced field styling
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

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            mb: { xs: 0.5, sm: 1 },
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
          }}
        >
          Complete Your Registration
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Create your password to secure your account
        </Typography>
      </Box>

      {/* Freelance Teacher Info */}
      <Box sx={{ 
        mb: 3, 
        p: 2, 
        backgroundColor: 'rgba(34, 197, 94, 0.05)', 
        borderRadius: 2,
        border: '1px solid rgba(34, 197, 94, 0.1)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Person sx={{ color: '#16a34a', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
            Freelance Teacher Account
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#666666', fontSize: '0.875rem' }}>
          You're registering as an independent teacher with full platform access to create assessments, manage students, and access educational resources.
        </Typography>
      </Box>

      {/* Password Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Password */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Create Password *
          </Typography>
          {formErrors.password && (
            <Typography variant="caption" sx={{ color: '#ef4444', mb: 1, display: 'block', fontWeight: 500 }}>
              {formErrors.password}
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
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: 'rgba(102, 126, 234, 0.03)', 
              borderRadius: 2, 
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security sx={{ color: COLORS.TEXT_SECONDARY, fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: COLORS.TEXT_SECONDARY, fontWeight: 500 }}>
                  Password Strength: {passwordStrength.label}
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
              {formErrors.confirmPassword}
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
          <strong style={{ color: '#333333' }}>Note:</strong> Your account will be created immediately after you complete this step. You can log in right away using your email and password.
        </Typography>
      </Box>
    </Box>
  );
};

export default Step3CompleteRegistration;
