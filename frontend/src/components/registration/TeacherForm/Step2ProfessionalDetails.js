import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Add,
  Business,
  Person,
  School,
  Work,
  Star,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step2ProfessionalDetails = ({ formData, formErrors, onFormChange }) => {
  const [newSubject, setNewSubject] = useState('');

  const roles = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'hod', label: 'HOD (Head of Department)' },
    { value: 'coordinator', label: 'Coordinator' },
  ];

  const commonSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'
  ];

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

  const handleAddSubject = () => {
    if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
      onFormChange('subjects', [...formData.subjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    onFormChange('subjects', formData.subjects.filter(subject => subject !== subjectToRemove));
  };

  const handleQuickAddSubject = (subject) => {
    if (!formData.subjects.includes(subject)) {
      onFormChange('subjects', [...formData.subjects, subject]);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            mb: 0.5,
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
          }}
        >
          Subject & Role
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Tell us about your teaching expertise and professional role
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Subject Expertise Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Subject Expertise *
          </Typography>
          
          {/* Existing Subjects */}
          {formData.subjects.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mb: 1.5, 
              p: 1.5, 
              backgroundColor: 'rgba(102, 126, 234, 0.02)', 
              borderRadius: 1,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}>
              {formData.subjects.map((subject, index) => (
                <Chip
                  key={index}
                  label={subject}
                  onDelete={() => handleRemoveSubject(subject)}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: COLORS.PRIMARY,
                    border: '1px solid rgba(102, 126, 234, 0.15)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                    },
                    '& .MuiChip-deleteIcon': {
                      color: COLORS.PRIMARY,
                      '&:hover': {
                        color: '#5a6fd8',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Add Subject Input */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Add a subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              placeholder="e.g., Advanced Mathematics"
              sx={universalFieldStyle}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={handleAddSubject}
                    disabled={!newSubject.trim()}
                    sx={{
                      minWidth: 'auto',
                      px: 1.5,
                      color: COLORS.PRIMARY,
                      '&:hover': {
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      },
                      '&:disabled': {
                        color: '#9ca3af',
                      },
                    }}
                  >
                    <Add />
                  </Button>
                ),
              }}
            />
          </Box>

          {/* Quick Add Common Subjects */}
          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
              Quick add common subjects:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {commonSubjects.map((subject) => (
                <Button
                  key={subject}
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickAddSubject(subject)}
                  disabled={formData.subjects.includes(subject)}
                  sx={{
                    borderColor: formData.subjects.includes(subject) ? '#e5e7eb' : 'rgba(102, 126, 234, 0.3)',
                    color: formData.subjects.includes(subject) ? '#9ca3af' : COLORS.PRIMARY,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500,
                    textTransform: 'none',
                    backgroundColor: formData.subjects.includes(subject) ? '#f9fafb' : 'rgba(102, 126, 234, 0.02)',
                    '&:hover': {
                      borderColor: formData.subjects.includes(subject) ? '#e5e7eb' : 'rgba(102, 126, 234, 0.5)',
                      backgroundColor: formData.subjects.includes(subject) ? '#f9fafb' : 'rgba(102, 126, 234, 0.06)',
                    },
                    '&:disabled': {
                      borderColor: '#e5e7eb',
                      color: '#9ca3af',
                      backgroundColor: '#f9fafb',
                    },
                  }}
                >
                  {subject}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Role Selection */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Role *
          </Typography>
          <FormControl fullWidth sx={universalFieldStyle}>
            <InputLabel>Select your role</InputLabel>
            <Select
              value={formData.role || ''}
              label="Select your role"
              onChange={(e) => onFormChange('role', e.target.value)}
              error={!!formErrors.role}
            >
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {formErrors.role && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
              {formErrors.role}
            </Typography>
          )}
        </Box>

        {/* Affiliation Type */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Affiliation Type *
          </Typography>
          <ToggleButtonGroup
            value={formData.affiliationType || 'organization'}
            exclusive
            onChange={(e, value) => value && onFormChange('affiliationType', value)}
            sx={{
              width: '100%',
              '& .MuiToggleButton-root': {
                flex: 1,
                borderColor: '#e5e7eb',
                color: '#6b7280',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                py: 1.5,
                backgroundColor: '#f9fafb',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  color: COLORS.PRIMARY,
                  borderColor: 'rgba(102, 126, 234, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.12)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  color: COLORS.PRIMARY,
                  borderColor: 'rgba(102, 126, 234, 0.15)',
                },
              },
            }}
          >
            <ToggleButton value="organization">
              <Business sx={{ mr: 1, fontSize: 18, color: 'inherit' }} />
              I belong to an organization
            </ToggleButton>
            <ToggleButton value="freelance">
              <Person sx={{ mr: 1, fontSize: 18, color: 'inherit' }} />
              I am an independent teacher
            </ToggleButton>
          </ToggleButtonGroup>
          {formErrors.affiliationType && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
              {formErrors.affiliationType}
            </Typography>
          )}
        </Box>

        {/* Conditional Fields for Independent Teachers */}
        {formData.affiliationType === 'freelance' && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Experience Level *
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              {[
                { value: 'beginner', label: 'Beginner (0-2 years)', icon: <School /> },
                { value: 'intermediate', label: 'Intermediate (3-5 years)', icon: <Work /> },
                { value: 'experienced', label: 'Experienced (6-10 years)', icon: <Business /> },
                { value: 'expert', label: 'Expert (10+ years)', icon: <Star /> },
              ].map((level) => (
                <Button
                  key={level.value}
                  variant="outlined"
                  onClick={() => onFormChange('experienceLevel', level.value)}
                  sx={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    borderColor: formData.experienceLevel === level.value ? 'rgba(102, 126, 234, 0.3)' : '#e5e7eb',
                    backgroundColor: formData.experienceLevel === level.value ? 'rgba(102, 126, 234, 0.06)' : '#f9fafb',
                    color: formData.experienceLevel === level.value ? COLORS.PRIMARY : '#6b7280',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: formData.experienceLevel === level.value ? 'rgba(102, 126, 234, 0.1)' : 'rgba(102, 126, 234, 0.04)',
                      borderColor: formData.experienceLevel === level.value ? 'rgba(102, 126, 234, 0.4)' : 'rgba(102, 126, 234, 0.2)',
                      color: formData.experienceLevel === level.value ? COLORS.PRIMARY : COLORS.PRIMARY,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ color: 'inherit' }}>
                      {level.icon}
                    </Box>
                    <Typography variant="body2" sx={{ textAlign: 'left' }}>
                      {level.label}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Box>
            {formErrors.experienceLevel && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block', fontWeight: 500 }}>
                {formErrors.experienceLevel}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Step2ProfessionalDetails;
