import React from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../theme/constants';

const Step1OrganisationDetails = ({ formData, formErrors, onFormChange }) => {
  const organisationTypes = [
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'university', label: 'University' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'other', label: 'Other' },
  ];

  const countries = [
    { value: 'india', label: '🇮🇳 India' },
    { value: 'usa', label: '🇺🇸 United States' },
    { value: 'uk', label: '🇬🇧 United Kingdom' },
    { value: 'canada', label: '🇨🇦 Canada' },
    { value: 'australia', label: '🇦🇺 Australia' },
    { value: 'germany', label: '🇩🇪 Germany' },
    { value: 'france', label: '🇫🇷 France' },
    { value: 'japan', label: '🇯🇵 Japan' },
  ];

  const states = {
    india: [
      { value: 'maharashtra', label: 'Maharashtra' },
      { value: 'karnataka', label: 'Karnataka' },
      { value: 'tamil-nadu', label: 'Tamil Nadu' },
      { value: 'delhi', label: 'Delhi' },
      { value: 'mumbai', label: 'Mumbai' },
    ],
    usa: [
      { value: 'california', label: 'California' },
      { value: 'new-york', label: 'New York' },
      { value: 'texas', label: 'Texas' },
      { value: 'florida', label: 'Florida' },
    ],
    uk: [
      { value: 'england', label: 'England' },
      { value: 'scotland', label: 'Scotland' },
      { value: 'wales', label: 'Wales' },
      { value: 'northern-ireland', label: 'Northern Ireland' },
    ],
  };

  const getStatesForCountry = (country) => {
    return states[country] || [];
  };

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
          Organisation Information
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Provide the basic details about your educational institution
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
        {/* Organisation Name */}
        <TextField
          fullWidth
          label="Organisation Name"
          value={formData.organisationName}
          onChange={(e) => onFormChange('organisationName', e.target.value)}
          error={!!formErrors.organisationName}
          helperText={formErrors.organisationName}
          placeholder="Enter your organisation name"
          sx={universalFieldStyle}
        />

        {/* Row 1: Country and State */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          <FormControl sx={{ flex: 1, ...universalFieldStyle }}>
            <InputLabel>Country</InputLabel>
            <Select
              value={formData.country}
              label="Country"
              onChange={(e) => {
                onFormChange('country', e.target.value);
                onFormChange('state', '');
              }}
              error={!!formErrors.country}
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
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>
                  {country.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, ...universalFieldStyle }}>
            <InputLabel>State</InputLabel>
            <Select
              value={formData.state}
              label="State"
              onChange={(e) => onFormChange('state', e.target.value)}
              error={!!formErrors.state}
              disabled={!formData.country}
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
              {getStatesForCountry(formData.country).map((state) => (
                <MenuItem key={state.value} value={state.value}>
                  {state.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Row 2: City and Pincode */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          <TextField
            sx={{ flex: 1, ...universalFieldStyle }}
            label="City"
            value={formData.city}
            onChange={(e) => onFormChange('city', e.target.value)}
            error={!!formErrors.city}
            helperText={formErrors.city}
            placeholder="Enter city name"
          />

          <TextField
            sx={{ flex: 1, ...universalFieldStyle }}
            label="Pincode / Postal Code"
            value={formData.pincode}
            onChange={(e) => onFormChange('pincode', e.target.value)}
            error={!!formErrors.pincode}
            helperText={formErrors.pincode}
            placeholder="Enter pincode"
            inputProps={{
              maxLength: 10,
              inputMode: 'numeric',
              pattern: '[0-9]*',
            }}
          />
        </Box>

        {/* Row 3: Type and Student Strength */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          <FormControl sx={{ flex: 1, ...universalFieldStyle }}>
            <InputLabel>Type of Institution</InputLabel>
            <Select
              value={formData.organisationType}
              label="Type of Institution"
              onChange={(e) => onFormChange('organisationType', e.target.value)}
              error={!!formErrors.organisationType}
            >
              {organisationTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            sx={{ flex: 1, ...universalFieldStyle }}
            label="Approx. Student Strength"
            type="number"
            value={formData.studentStrength}
            onChange={(e) => onFormChange('studentStrength', e.target.value)}
            error={!!formErrors.studentStrength}
            helperText={formErrors.studentStrength}
            placeholder="e.g., 500"
            inputProps={{
              min: 1,
              max: 999999,
            }}
          />
        </Box>

        {/* Government Recognition Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isGovernmentRecognized}
              onChange={(e) => onFormChange('isGovernmentRecognized', e.target.checked)}
              sx={{
                color: COLORS.PRIMARY,
                '&.Mui-checked': {
                  color: COLORS.PRIMARY,
                },
              }}
            />
          }
          label="This is a government-recognized institution"
          sx={{
            '& .MuiFormControlLabel-label': {
              color: '#333333',
              fontSize: '0.875rem',
            },
          }}
        />
      </Box>

      {/* Info Box */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderRadius: 1,
          border: '1px solid rgba(102, 126, 234, 0.1)',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: '#555555' }}
        >
          <strong style={{ color: '#333333' }}>Note:</strong> This information will be used to set up your organisation profile and help us provide better services tailored to your institution type and size.
        </Typography>
      </Box>
    </Box>
  );
};

export default Step1OrganisationDetails;
