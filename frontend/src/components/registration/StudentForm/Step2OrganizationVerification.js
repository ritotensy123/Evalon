import React from 'react';
import {
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle,
  School,
  Person,
  Assessment,
} from '@mui/icons-material';
import { BORDER_RADIUS } from '../../../theme/constants';

const Step2OrganizationVerification = ({ formData, formErrors, onFormChange, registrationToken }) => {
  // Set as standalone by default
  React.useEffect(() => {
    onFormChange('isStandalone', true);
    onFormChange('registrationType', 'standalone');
  }, []); // Empty dependency array to run only once

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
        borderColor: '#667eea',
        borderWidth: '2px',
      },
      '&.Mui-focused': {
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.15)',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#667eea',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      '&.Mui-focused': {
        color: '#667eea',
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
          Freelance Student Registration
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          You're registering as an independent student with full platform access
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a',
            mb: 3,
            mx: 'auto',
          }}
        >
          <School sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: '#1a1a1a',
            mb: 2,
            fontWeight: 600,
          }}
        >
          Independent Student Setup
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: '#666666',
            mb: 3,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          As a freelance student, you'll have access to all platform features including taking assessments, accessing educational resources, and joining classes when invited by teachers.
        </Typography>

        <Chip
          label="Freelance Student"
          icon={<CheckCircle />}
          sx={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            fontWeight: 500,
            mb: 3,
          }}
        />

        {/* Features List */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxWidth: 400,
            mx: 'auto',
            textAlign: 'left',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assessment sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Take assessments and practice exams
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Access educational resources and materials
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Join classes when invited by teachers
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Academic Level Selection */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
          Academic Level (Optional)
        </Typography>
        <FormControl fullWidth sx={universalFieldStyle}>
          <InputLabel>Select your current academic level</InputLabel>
          <Select
            value={formData.academicLevel || ''}
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
  );
};

export default Step2OrganizationVerification;
