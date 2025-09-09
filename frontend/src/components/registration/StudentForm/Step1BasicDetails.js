import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  LocationOn,
  Home,
  PinDrop,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step1BasicDetails = ({ formData, formErrors, onFormChange }) => {
  const countries = [
    { value: 'IN', label: '🇮🇳 India' },
    { value: 'US', label: '🇺🇸 United States' },
    { value: 'GB', label: '🇬🇧 United Kingdom' },
    { value: 'CA', label: '🇨🇦 Canada' },
    { value: 'AU', label: '🇦🇺 Australia' },
    { value: 'DE', label: '🇩🇪 Germany' },
    { value: 'FR', label: '🇫🇷 France' },
    { value: 'JP', label: '🇯🇵 Japan' },
    { value: 'SG', label: '🇸🇬 Singapore' },
    { value: 'AE', label: '🇦🇪 United Arab Emirates' },
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
          Personal Information
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          Provide your basic personal details
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2, md: 2.5 } }}>
        
        {/* Full Name */}
        <TextField
          fullWidth
          label="Full Name"
          value={formData.fullName}
          onChange={(e) => onFormChange('fullName', e.target.value)}
          error={!!formErrors.fullName}
          helperText={formErrors.fullName}
          placeholder="Enter your full name"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: '#6b7280' }} />
              </InputAdornment>
            ),
          }}
          sx={universalFieldStyle}
        />

        {/* Phone Number */}
        <TextField
          fullWidth
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => onFormChange('phoneNumber', e.target.value)}
          error={!!formErrors.phoneNumber}
          helperText={formErrors.phoneNumber}
          placeholder="Enter your phone number"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone sx={{ color: '#6b7280' }} />
              </InputAdornment>
            ),
          }}
          sx={universalFieldStyle}
        />

        {/* Email Address */}
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={formData.emailAddress}
          onChange={(e) => onFormChange('emailAddress', e.target.value)}
          error={!!formErrors.emailAddress}
          helperText={formErrors.emailAddress}
          placeholder="Enter your email address"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: '#6b7280' }} />
              </InputAdornment>
            ),
          }}
          sx={universalFieldStyle}
        />

        {/* Row: Country and City */}
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
              onChange={(e) => onFormChange('country', e.target.value)}
              error={!!formErrors.country}
              placeholder="Select your country"
              startAdornment={
                <InputAdornment position="start">
                  <LocationOn sx={{ color: '#6b7280', mr: 1 }} />
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
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>
                  {country.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            sx={{ flex: 1, ...universalFieldStyle }}
            label="City"
            value={formData.city}
            onChange={(e) => onFormChange('city', e.target.value)}
            error={!!formErrors.city}
            helperText={formErrors.city}
            placeholder="Enter your city"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Home sx={{ color: '#6b7280' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Pincode */}
        <TextField
          fullWidth
          label="Pincode"
          value={formData.pincode}
          onChange={(e) => onFormChange('pincode', e.target.value)}
          error={!!formErrors.pincode}
          helperText={formErrors.pincode}
          placeholder="Enter 6-digit pincode"
          inputProps={{ maxLength: 6 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PinDrop sx={{ color: '#6b7280' }} />
              </InputAdornment>
            ),
          }}
          sx={universalFieldStyle}
        />
      </Box>
    </Box>
  );
};

export default Step1BasicDetails;
