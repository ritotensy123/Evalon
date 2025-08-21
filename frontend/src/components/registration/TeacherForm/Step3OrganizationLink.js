import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Fade,
  Alert,
  Chip,
} from '@mui/material';
import {
  Business,
  CheckCircle,
  Warning,
  LocationOn,
} from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const Step3OrganizationLink = ({ formData, formErrors, onFormChange }) => {
  const [isValidating, setIsValidating] = useState(false);

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

  const handleOrganizationCodeChange = (value) => {
    onFormChange('organizationCode', value);
    
    // Simulate validation when code is entered
    if (value.length >= 3) {
      setIsValidating(true);
      setTimeout(() => {
        // Simulate API validation
        const isValid = value.length >= 8; // Simple validation for demo
        onFormChange('isOrganizationValid', isValid);
        
        if (isValid) {
          // Simulate fetching organization details
          onFormChange('organizationName', 'Sample Institution');
          onFormChange('organizationLocation', 'Mumbai, Maharashtra');
          onFormChange('associationStatus', 'pending'); // or 'direct' based on validation
        } else {
          onFormChange('organizationName', '');
          onFormChange('organizationLocation', '');
          onFormChange('associationStatus', '');
        }
        setIsValidating(false);
      }, 1000);
    } else {
      onFormChange('isOrganizationValid', false);
      onFormChange('organizationName', '');
      onFormChange('organizationLocation', '');
      onFormChange('associationStatus', '');
    }
  };

  // Don't show this step if user is freelance
  if (formData.isFreelance) {
    return (
      <Box sx={{ width: '100%' }}>
        <Fade in timeout={600}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography
              variant="h6"
              sx={{
                color: '#6b7280',
                mb: 2,
              }}
            >
              🎉 Great! You're registering as a freelance teacher
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#9ca3af',
              }}
            >
              You can skip the organization linking step and proceed to security verification.
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

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
            🏢 Link to Organization
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
            <Business sx={{ fontSize: 16, color: COLORS.PRIMARY }} />
            Connect your account to your institution
          </Typography>
        </Box>
      </Fade>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Organization Code */}
        <Fade in timeout={800}>
          <TextField
            fullWidth
            label="Organization Code"
            value={formData.organizationCode}
            onChange={(e) => handleOrganizationCodeChange(e.target.value)}
            error={!!formErrors.organizationCode}
            helperText={formErrors.organizationCode}
            placeholder="Enter your organization code"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business sx={{ color: '#6b7280', fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: formData.organizationCode && (
                <InputAdornment position="end">
                  {isValidating ? (
                    <Box sx={{ width: 16, height: 16, border: '2px solid #e5e7eb', borderTop: '2px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : formData.isOrganizationValid ? (
                    <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                  ) : (
                    <Warning sx={{ color: '#f59e0b', fontSize: 20 }} />
                  )}
                </InputAdornment>
              ),
            }}
            sx={universalFieldStyle}
          />
        </Fade>

        {/* Organization Details (shown when valid) */}
        {formData.isOrganizationValid && formData.organizationName && (
          <Fade in timeout={900}>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
                Organization Details
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ color: '#10b981', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.organizationName}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ color: '#6b7280', fontSize: 16 }} />
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {formData.organizationLocation}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Status Display */}
        {formData.associationStatus && (
          <Fade in timeout={1000}>
            <Alert
              severity={formData.associationStatus === 'direct' ? 'success' : 'warning'}
              icon={formData.associationStatus === 'direct' ? <CheckCircle /> : <Warning />}
              sx={{
                '& .MuiAlert-message': {
                  fontSize: '0.875rem',
                }
              }}
            >
              {formData.associationStatus === 'direct' ? (
                '✅ Direct Association - Your account will be linked immediately'
              ) : (
                '❗ Pending Admin Approval - You will receive an invitation email'
              )}
            </Alert>
          </Fade>
        )}

        {/* Instructions */}
        <Fade in timeout={1100}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              How it works:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • Enter your organization code to link your account
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • We'll verify your email/phone against the organization database
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • If matched: Direct association with immediate access
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280' }}>
                • If not matched: Admin approval required via email invitation
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default Step3OrganizationLink;
