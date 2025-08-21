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
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  School,
  Work,
  Subject,
  Add,
  Business,
  Person,
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
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
    'Geography', 'Computer Science', 'Economics', 'Business Studies',
    'Art', 'Music', 'Physical Education', 'Literature', 'Psychology'
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
    if (newSubject.trim() && !formData.subjectExpertise.includes(newSubject.trim())) {
      onFormChange('subjectExpertise', [...formData.subjectExpertise, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subjectToRemove) => {
    onFormChange('subjectExpertise', formData.subjectExpertise.filter(subject => subject !== subjectToRemove));
  };

  const handleQuickAddSubject = (subject) => {
    if (!formData.subjectExpertise.includes(subject)) {
      onFormChange('subjectExpertise', [...formData.subjectExpertise, subject]);
    }
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
          🎓 Subject & Role
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Tell us about your teaching expertise and role
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        {/* Subject Expertise */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
            Subject Expertise *
          </Typography>
          
          {/* Existing Subjects */}
          {formData.subjectExpertise.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {formData.subjectExpertise.map((subject, index) => (
                <Chip
                  key={index}
                  label={subject}
                  onDelete={() => handleRemoveSubject(subject)}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    color: COLORS.PRIMARY,
                    border: '1px solid rgba(102, 126, 234, 0.2)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.15)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
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

          {/* Add New Subject */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter subject name"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Subject sx={{ color: '#6b7280', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={universalFieldStyle}
            />
            <Button
              onClick={handleAddSubject}
              disabled={!newSubject.trim()}
              variant="contained"
              size="small"
              sx={{
                backgroundColor: COLORS.PRIMARY,
                minWidth: 'auto',
                px: 1.5,
                boxShadow: '0 2px 4px rgba(102, 126, 234, 0.2)',
                '&:hover': {
                  backgroundColor: '#5a6fd8',
                  boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  backgroundColor: '#9ca3af',
                  boxShadow: 'none',
                },
              }}
            >
              <Add sx={{ fontSize: 18 }} />
            </Button>
          </Box>

          {/* Quick Add Common Subjects */}
          <Box>
            <Typography variant="caption" sx={{ color: '#6b7280', mb: 1, display: 'block' }}>
              Quick add common subjects:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {commonSubjects.slice(0, 8).map((subject) => (
                <Chip
                  key={subject}
                  label={subject}
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickAddSubject(subject)}
                  disabled={formData.subjectExpertise.includes(subject)}
                  sx={{
                    fontSize: '0.7rem',
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                    '&:hover': {
                      borderColor: COLORS.PRIMARY,
                      color: COLORS.PRIMARY,
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      color: COLORS.PRIMARY,
                      borderColor: 'rgba(102, 126, 234, 0.2)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {formErrors.subjectExpertise && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5, display: 'block' }}>
              {formErrors.subjectExpertise}
            </Typography>
          )}
        </Box>

        {/* Role */}
        <FormControl fullWidth error={!!formErrors.role} sx={universalFieldStyle}>
          <InputLabel>Role *</InputLabel>
          <Select
            value={formData.role}
            onChange={(e) => onFormChange('role', e.target.value)}
            label="Role"
            startAdornment={
              <InputAdornment position="start">
                <Work sx={{ color: '#6b7280', fontSize: 18 }} />
              </InputAdornment>
            }
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
            {roles.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                {role.label}
              </MenuItem>
            ))}
          </Select>
          {formErrors.role && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5 }}>
              {formErrors.role}
            </Typography>
          )}
        </FormControl>

        {/* Freelance or Organization-Linked */}
        <Box
          sx={{
            p: 2,
            backgroundColor: 'rgba(102, 126, 234, 0.02)',
            borderRadius: 2,
            border: '1px solid rgba(102, 126, 234, 0.1)',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1f2937' }}>
            Freelance or Organization-Linked?
          </Typography>
          
          <RadioGroup
            value={formData.isFreelance ? 'freelance' : 'organization'}
            onChange={(e) => onFormChange('isFreelance', e.target.value === 'freelance')}
          >
            <FormControlLabel
              value="organization"
              control={
                <Radio
                  sx={{
                    color: COLORS.PRIMARY,
                    '&.Mui-checked': {
                      color: COLORS.PRIMARY,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ color: '#6b7280', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    🔗 I belong to an organization
                  </Typography>
                </Box>
              }
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              value="freelance"
              control={
                <Radio
                  sx={{
                    color: COLORS.PRIMARY,
                    '&.Mui-checked': {
                      color: COLORS.PRIMARY,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ color: '#6b7280', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    💼 I'm a freelance teacher
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      </Box>
    </Box>
  );
};

export default Step2ProfessionalDetails;
