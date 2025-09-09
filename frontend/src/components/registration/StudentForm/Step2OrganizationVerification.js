import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Business,
  Search,
  CheckCircle,
  Error,
  Schedule,
  Info,
  VerifiedUser,
  Pending,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step2OrganizationVerification = ({ formData, formErrors, onFormChange }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [showInvalidDialog, setShowInvalidDialog] = useState(false);

  const academicLevels = [
    { value: 'high_school', label: 'High School' },
    { value: 'undergraduate_1st', label: '1st Year Undergraduate' },
    { value: 'undergraduate_2nd', label: '2nd Year Undergraduate' },
    { value: 'undergraduate_3rd', label: '3rd Year Undergraduate' },
    { value: 'undergraduate_4th', label: '4th Year Undergraduate' },
    { value: 'graduate_masters', label: 'Masters Degree' },
    { value: 'graduate_phd', label: 'PhD/Doctorate' },
    { value: 'other', label: 'Other' },
  ];

  const handleOrganizationCodeChange = (value) => {
    onFormChange('organizationCode', value);
    
    // Simulate validation when code is entered
    if (value.length >= 3) {
      setIsValidating(true);
      setTimeout(() => {
        // Simulate API validation
        const mockOrgData = {
          'ORG001': { name: 'Tech University', status: 'verified' },
          'ORG002': { name: 'Science College', status: 'pending' },
          'ORG003': { name: 'Engineering Institute', status: 'not_found' },
        };
        
        const orgCode = value.toUpperCase();
        const orgData = mockOrgData[orgCode];
        
        if (orgData) {
          onFormChange('organizationName', orgData.name);
          onFormChange('studentVerificationStatus', orgData.status);
          onFormChange('isOrganizationValid', orgData.status === 'verified');
        } else {
          onFormChange('organizationName', '');
          onFormChange('studentVerificationStatus', 'not_found');
          onFormChange('isOrganizationValid', false);
          // Show popup for invalid code
          setShowInvalidDialog(true);
        }
        setIsValidating(false);
      }, 1000);
    } else {
      onFormChange('isOrganizationValid', false);
      onFormChange('organizationName', '');
      onFormChange('studentVerificationStatus', '');
    }
  };

  const handleContinueAsStandalone = () => {
    onFormChange('isStandalone', true);
    onFormChange('organizationCode', '');
    onFormChange('isOrganizationValid', false);
    onFormChange('organizationName', '');
    onFormChange('studentVerificationStatus', '');
    setShowInvalidDialog(false);
  };

  const handleTryAgain = () => {
    setShowInvalidDialog(false);
  };

  // Custom verification badge component
  const VerificationBadge = ({ status, organizationName, orgCode }) => {
    const getBadgeConfig = (status) => {
      switch (status) {
        case 'verified':
          return {
            icon: <VerifiedUser sx={{ fontSize: 16 }} />,
            color: '#10b981',
            bgColor: '#ecfdf5',
            borderColor: '#a7f3d0',
            text: 'Verified',
            description: 'Student record found and verified'
          };
        case 'pending':
          return {
            icon: <Pending sx={{ fontSize: 16 }} />,
            color: '#f59e0b',
            bgColor: '#fffbeb',
            borderColor: '#fcd34d',
            text: 'Pending',
            description: 'Awaiting student verification'
          };
        case 'not_found':
          return {
            icon: <Error sx={{ fontSize: 16 }} />,
            color: '#ef4444',
            bgColor: '#fef2f2',
            borderColor: '#fca5a5',
            text: 'Not Found',
            description: 'Student not found in organization'
          };
        default:
          return null;
      }
    };

    const config = getBadgeConfig(status);
    if (!config) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: config.color,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {config.icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1f2937', mb: 0.5 }}>
            {organizationName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
            Code: {orgCode}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: config.color, fontWeight: 600 }}>
              {config.text}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              • {config.description}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

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

  // Don't show organization verification if user is standalone
  if (formData.isStandalone) {
    return (
      <Box sx={{ width: '100%' }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography
            variant="h6"
            sx={{
              color: '#1a1a1a',
              mb: 2,
              fontWeight: 600,
            }}
          >
            Standalone Registration
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#666666',
              mb: 3,
            }}
          >
            You will get access to public tools and can take assessments independently.
          </Typography>
          <Chip
            label="Independent Student"
            icon={<CheckCircle />}
            sx={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Additional Fields for Standalone Students */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
          <Divider sx={{ my: 1 }} />
          
          {/* Academic Level */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Academic Level (Optional)
            </Typography>
            <FormControl fullWidth sx={universalFieldStyle}>
              <InputLabel>Select your current academic level</InputLabel>
              <Select
                value={formData.academicLevel}
                label="Select your current academic level"
                onChange={(e) => onFormChange('academicLevel', e.target.value)}
                error={!!formErrors.academicLevel}
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
                {academicLevels.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.academicLevel && (
                <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
                  {formErrors.academicLevel}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Box>
      </Box>
    );
  }

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
          Link to Institution
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Enter your organization code to link your student account
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
        
        {/* Organization Code Input */}
        <TextField
          fullWidth
          label="Organization Code"
          value={formData.organizationCode}
          onChange={(e) => handleOrganizationCodeChange(e.target.value)}
          error={!!formErrors.organizationCode}
          helperText={formErrors.organizationCode}
          placeholder="Enter your organization code"
          sx={universalFieldStyle}
          InputProps={{
            endAdornment: formData.organizationCode && (
              <InputAdornment position="end">
                {isValidating ? (
                  <CircularProgress size={20} sx={{ color: COLORS.PRIMARY }} />
                ) : (
                  <Search sx={{ color: '#9ca3af', fontSize: 20 }} />
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* Organization Verification Badge */}
        {formData.organizationName && (
          <VerificationBadge
            status={formData.studentVerificationStatus}
            organizationName={formData.organizationName}
            orgCode={formData.organizationCode.toUpperCase()}
          />
        )}

        {/* Academic Level */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Academic Level (Optional)
          </Typography>
          <FormControl fullWidth sx={universalFieldStyle}>
            <InputLabel>Select your current academic level</InputLabel>
            <Select
              value={formData.academicLevel}
              label="Select your current academic level"
              onChange={(e) => onFormChange('academicLevel', e.target.value)}
              error={!!formErrors.academicLevel}
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
              {academicLevels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
            {formErrors.academicLevel && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
                {formErrors.academicLevel}
              </Typography>
            )}
          </FormControl>
        </Box>

        {/* Info Box */}
        <Box
          sx={{
            p: 2.5,
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: 2,
            border: '1px solid rgba(102, 126, 234, 0.1)',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#555555', fontSize: '0.875rem' }}
          >
            <strong style={{ color: '#333333' }}>Note:</strong> Your Org Code ensures you're mapped to the correct department & batch. If you're not affiliated with any institution, you can continue as a standalone student.
          </Typography>
        </Box>

        {/* Test Instructions */}
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#f8fafc', 
          borderRadius: BORDER_RADIUS.MD, 
          border: '1px solid #e2e8f0' 
        }}>
          <Typography variant="body2" sx={{ color: '#6b7280', textAlign: 'center' }}>
            <strong>Test Codes:</strong> ORG001 (Verified), ORG002 (Pending), ORG003 (Not Found)
          </Typography>
        </Box>
      </Box>

      {/* Invalid Organization Code Dialog */}
      <Dialog
        open={showInvalidDialog}
        onClose={handleTryAgain}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info sx={{ color: '#f59e0b', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937' }}>
            Student Not Found
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#4b5563' }}>
            We couldn't find your student record in this organization. This could be due to:
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
              • Incorrect organization code
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
              • Your student record is not yet registered
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              • You may not be affiliated with this institution
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: '#4b5563', fontWeight: 500 }}>
            Would you like to continue as a standalone student instead?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleTryAgain}
            variant="outlined"
            sx={{
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: 'rgba(156, 163, 175, 0.04)',
              },
            }}
          >
            Try Again
          </Button>
          <Button
            onClick={handleContinueAsStandalone}
            variant="contained"
            sx={{
              backgroundColor: COLORS.PRIMARY,
              '&:hover': {
                backgroundColor: '#5a6fd8',
              },
            }}
          >
            Continue as Standalone
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Step2OrganizationVerification;
