import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  Person,
  Phone,
  Email,
  Public,
  LocationCity,
  PinDrop,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step1BasicDetails = ({ formData, formErrors, onFormChange }) => {
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

  const countryCodes = [
    { value: '+91', label: '🇮🇳 +91 (India)', flag: '🇮🇳' },
    { value: '+1', label: '🇺🇸 +1 (USA)', flag: '🇺🇸' },
    { value: '+44', label: '🇬🇧 +44 (UK)', flag: '🇬🇧' },
    { value: '+61', label: '🇦🇺 +61 (Australia)', flag: '🇦🇺' },
    { value: '+86', label: '🇨🇳 +86 (China)', flag: '🇨🇳' },
    { value: '+81', label: '🇯🇵 +81 (Japan)', flag: '🇯🇵' },
    { value: '+49', label: '🇩🇪 +49 (Germany)', flag: '🇩🇪' },
    { value: '+33', label: '🇫🇷 +33 (France)', flag: '🇫🇷' },
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
          👩‍🏫 Personal Information
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#6b7280',
            fontSize: '0.9rem',
          }}
        >
          Provide your basic personal details
        </Typography>
      </Box>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        
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
                <Person sx={{ color: '#6b7280', fontSize: 18 }} />
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
                <FormControl sx={{ minWidth: 80, mr: 1 }}>
                  <Select
                    value={formData.countryCode}
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
                        {code.flag} {code.value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Phone sx={{ color: '#6b7280', fontSize: 18 }} />
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
                <Email sx={{ color: '#6b7280', fontSize: 18 }} />
              </InputAdornment>
            ),
          }}
          sx={universalFieldStyle}
        />

        {/* Country */}
        <FormControl fullWidth error={!!formErrors.country} sx={universalFieldStyle}>
          <InputLabel>Country</InputLabel>
          <Select
            value={formData.country}
            onChange={(e) => onFormChange('country', e.target.value)}
            label="Country"
            startAdornment={
              <InputAdornment position="start">
                <Public sx={{ color: '#6b7280', fontSize: 18 }} />
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationCity sx={{ color: '#6b7280', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            sx={{ flex: 1, ...universalFieldStyle }}
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => onFormChange('pincode', e.target.value)}
            error={!!formErrors.pincode}
            helperText={formErrors.pincode}
            placeholder="Enter pincode"
            inputProps={{
              maxLength: 6,
              inputMode: 'numeric',
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PinDrop sx={{ color: '#6b7280', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Step1BasicDetails;
