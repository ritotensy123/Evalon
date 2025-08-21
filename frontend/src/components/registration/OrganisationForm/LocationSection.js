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
import { LocationOn } from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const LocationSection = ({ formData, formErrors, onFormChange }) => {
  const countries = [
    { value: 'india', label: 'India' },
    { value: 'usa', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'canada', label: 'Canada' },
    { value: 'australia', label: 'Australia' },
    { value: 'germany', label: 'Germany' },
    { value: 'france', label: 'France' },
    { value: 'japan', label: 'Japan' },
    { value: 'singapore', label: 'Singapore' },
    { value: 'other', label: 'Other' },
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
        Location Details
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: COLORS.TEXT_SECONDARY,
          mb: 4,
          textAlign: 'center',
        }}
      >
        Where is your organisation located?
      </Typography>

      <Grid container spacing={3}>
        {/* Country */}
        <Grid item xs={12} sm={6}>
          <FormControl
            fullWidth
            error={!!formErrors.country}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.country ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.country ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.country ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.country ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.country ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          >
            <InputLabel>Country</InputLabel>
            <Select
              value={formData.country}
              label="Country"
              onChange={(e) => onFormChange('country', e.target.value)}
            >
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>
                  {country.label}
                </MenuItem>
              ))}
            </Select>
            {formErrors.country && (
              <FormHelperText>{formErrors.country}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* City */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={(e) => onFormChange('city', e.target.value)}
            error={!!formErrors.city}
            helperText={formErrors.city}
            placeholder="Enter your city"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.city ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.city ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.city ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.city ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.city ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          />
        </Grid>

        {/* Pincode */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => onFormChange('pincode', e.target.value)}
            error={!!formErrors.pincode}
            helperText={formErrors.pincode}
            placeholder="Enter your pincode"
            InputProps={{
              inputProps: { 
                maxLength: 10,
                pattern: '[0-9]*'
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.pincode ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.pincode ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.pincode ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.pincode ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.pincode ? '#ff6b6b' : COLORS.PRIMARY,
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
          <strong>Note:</strong> This location information helps us provide region-specific features and support. Your exact address will not be shared publicly.
        </Typography>
      </Box>
    </Box>
  );
};

export default LocationSection;
