import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';
import { locationAPI } from '../../../services/api';

const Step1BasicDetails = ({ formData, formErrors, onFormChange }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await locationAPI.getCountries();
        if (response.success && response.data) {
          setCountries(response.data);
        } else {
          setError('Failed to load countries');
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  const countryCodes = [
    { value: '+91', label: '🇮🇳 +91' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+44', label: '🇬🇧 +44' },
    { value: '+61', label: '🇦🇺 +61' },
    { value: '+86', label: '🇨🇳 +86' },
    { value: '+81', label: '🇯🇵 +81' },
    { value: '+49', label: '🇩🇪 +49' },
    { value: '+33', label: '🇫🇷 +33' },
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
          sx={universalFieldStyle}
        />

        {/* Phone Number - Optional (Mobile OTP verification removed) */}
        <TextField
          fullWidth
          label="Phone Number (Optional)"
          value={formData.phoneNumber}
          onChange={(e) => onFormChange('phoneNumber', e.target.value)}
          error={!!formErrors.phoneNumber}
          helperText={formErrors.phoneNumber || "Optional - Mobile OTP verification removed"}
          placeholder="Enter your phone number (optional)"
          InputProps={{
            startAdornment: (
              <FormControl sx={{ minWidth: 90, mr: 1 }}>
                <Select
                  value={formData.countryCode || '+91'}
                  onChange={(e) => onFormChange('countryCode', e.target.value)}
                  variant="standard"
                  sx={{
                    '&:before': { borderBottom: 'none' },
                    '&:after': { borderBottom: 'none' },
                    '& .MuiSelect-select': {
                      paddingTop: 0,
                      paddingBottom: 0,
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }
                  }}
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
                  {countryCodes.map((code) => (
                    <MenuItem key={code.value} value={code.value}>
                      {code.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
          sx={universalFieldStyle}
        />

        {/* Country */}
        <FormControl fullWidth error={!!formErrors.country} sx={universalFieldStyle}>
          <InputLabel>Country</InputLabel>
          <Select
            value={formData.country || ''}
            onChange={(e) => onFormChange('country', e.target.value)}
            label="Country"
            disabled={loading}
            displayEmpty
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
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading countries...
              </MenuItem>
            ) : error ? (
              <MenuItem disabled>
                <Alert severity="error" sx={{ width: '100%', py: 0 }}>
                  {error}
                </Alert>
              </MenuItem>
            ) : (
              countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.name}
                </MenuItem>
              ))
            )}
          </Select>
          {formErrors.country && (
            <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5 }}>
              {formErrors.country}
            </Typography>
          )}
        </FormControl>

        {/* Row: City and Pincode */}
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
      </Box>
    </Box>
  );
};

export default Step1BasicDetails;
