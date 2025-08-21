import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
} from '@mui/material';
import { Business, School, CorporateFare } from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const BasicInfoSection = ({ formData, formErrors, onFormChange }) => {
  const organisationTypes = [
    { value: 'school', label: 'School', icon: <School /> },
    { value: 'college', label: 'College', icon: <Business /> },
    { value: 'other', label: 'Other', icon: <CorporateFare /> },
  ];

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
        Basic Information
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: COLORS.TEXT_SECONDARY,
          mb: 4,
          textAlign: 'center',
        }}
      >
        Tell us about your organisation
      </Typography>

      <Grid container spacing={3}>
        {/* Organisation Name */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Organisation Name"
            value={formData.organisationName}
            onChange={(e) => onFormChange('organisationName', e.target.value)}
            error={!!formErrors.organisationName}
            helperText={formErrors.organisationName}
            placeholder="Enter your organisation name"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.organisationName ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.organisationName ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.organisationName ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.organisationName ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.organisationName ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          />
        </Grid>

        {/* Organisation Type */}
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            error={!!formErrors.type}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.type ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.type ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.type ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.type ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.type ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          >
            <InputLabel>Organisation Type</InputLabel>
            <Select
              value={formData.type}
              label="Organisation Type"
              onChange={(e) => onFormChange('type', e.target.value)}
            >
              {organisationTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {type.icon}
                    {type.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {formErrors.type && (
              <FormHelperText>{formErrors.type}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Student Strength */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Student Strength"
            type="number"
            value={formData.studentStrength}
            onChange={(e) => onFormChange('studentStrength', e.target.value)}
            error={!!formErrors.studentStrength}
            helperText={formErrors.studentStrength}
            placeholder="e.g., 500"
            InputProps={{
              inputProps: { 
                min: 1,
                max: 999999
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.studentStrength ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.studentStrength ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.studentStrength ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.studentStrength ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.studentStrength ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          />
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
          <strong>Note:</strong> This information will be used to set up your organisation profile and help us provide better services tailored to your institution type and size.
        </Typography>
      </Box>
    </Box>
  );
};

export default BasicInfoSection;
