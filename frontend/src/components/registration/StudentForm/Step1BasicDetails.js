import React, { useState, useEffect } from 'react';
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
  PersonOutline,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';
import { locationAPI } from '../../../services/api';

const Step1BasicDetails = ({ formData, formErrors, onFormChange }) => {
  // Initialize with fallback countries to prevent undefined values
  const [countries, setCountries] = useState([
    { value: 'IN', label: 'India', name: 'India', phonecode: '91', flag: '🇮🇳' },
    { value: 'US', label: 'United States', name: 'United States', phonecode: '1', flag: '🇺🇸' },
    { value: 'GB', label: 'United Kingdom', name: 'United Kingdom', phonecode: '44', flag: '🇬🇧' },
    { value: 'CA', label: 'Canada', name: 'Canada', phonecode: '1', flag: '🇨🇦' },
    { value: 'AU', label: 'Australia', name: 'Australia', phonecode: '61', flag: '🇦🇺' },
  ]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  // Load countries with phone codes on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await locationAPI.getCountries();
        if (response.success && response.data && Array.isArray(response.data)) {
          const countryOptions = response.data.map(country => ({
            value: country.code,
            label: country.name,
            name: country.name, // Add name property for consistency
            phonecode: country.phoneCode || '1', // Use phoneCode (camelCase) from API
            flag: getCountryFlag(country.code)
          }));
          setCountries(countryOptions);
        }
      } catch (error) {
        console.error('Failed to load countries:', error);
        // Keep the fallback countries that are already set
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Helper function to get country flag emoji
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'IN': '🇮🇳', 'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'SG': '🇸🇬', 'AE': '🇦🇪',
      'CN': '🇨🇳', 'BR': '🇧🇷', 'RU': '🇷🇺', 'IT': '🇮🇹', 'ES': '🇪🇸',
      'MX': '🇲🇽', 'KR': '🇰🇷', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
      'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹', 'BE': '🇧🇪',
      'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'PT': '🇵🇹', 'GR': '🇬🇷',
      'IE': '🇮🇪', 'NZ': '🇳🇿', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬',
      'KE': '🇰🇪', 'GH': '🇬🇭', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿',
      'SA': '🇸🇦', 'AE': '🇦🇪', 'QA': '🇶🇦', 'KW': '🇰🇼', 'BH': '🇧🇭',
      'OM': '🇴🇲', 'JO': '🇯🇴', 'LB': '🇱🇧', 'SY': '🇸🇾', 'IQ': '🇮🇶',
      'IR': '🇮🇷', 'TR': '🇹🇷', 'IL': '🇮🇱', 'PK': '🇵🇰', 'BD': '🇧🇩',
      'LK': '🇱🇰', 'MV': '🇲🇻', 'NP': '🇳🇵', 'BT': '🇧🇹', 'MM': '🇲🇲',
      'TH': '🇹🇭', 'LA': '🇱🇦', 'KH': '🇰🇭', 'VN': '🇻🇳', 'MY': '🇲🇾',
      'ID': '🇮🇩', 'PH': '🇵🇭', 'TW': '🇹🇼', 'HK': '🇭🇰', 'MO': '🇲🇴',
      'MN': '🇲🇳', 'KZ': '🇰🇿', 'UZ': '🇺🇿', 'KG': '🇰🇬', 'TJ': '🇹🇯',
      'TM': '🇹🇲', 'AF': '🇦🇫', 'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴',
      'PE': '🇵🇪', 'EC': '🇪🇨', 'CO': '🇨🇴', 'VE': '🇻🇪', 'GY': '🇬🇾',
      'SR': '🇸🇷', 'GF': '🇬🇫', 'CL': '🇨🇱', 'AR': '🇦🇷', 'FK': '🇫🇰',
      'CU': '🇨🇺', 'JM': '🇯🇲', 'HT': '🇭🇹', 'DO': '🇩🇴', 'PR': '🇵🇷',
      'TT': '🇹🇹', 'BB': '🇧🇧', 'GD': '🇬🇩', 'LC': '🇱🇨', 'VC': '🇻🇨',
      'AG': '🇦🇬', 'KN': '🇰🇳', 'DM': '🇩🇲', 'BS': '🇧🇸', 'BZ': '🇧🇿',
      'GT': '🇬🇹', 'SV': '🇸🇻', 'HN': '🇭🇳', 'NI': '🇳🇮', 'CR': '🇨🇷',
      'PA': '🇵🇦', 'AW': '🇦🇼', 'CW': '🇨🇼', 'SX': '🇸🇽', 'BQ': '🇧🇶',
      'AI': '🇦🇮', 'VG': '🇻🇬', 'VI': '🇻🇮', 'TC': '🇹🇨', 'KY': '🇰🇾',
      'BM': '🇧🇲', 'GL': '🇬🇱', 'IS': '🇮🇸', 'FO': '🇫🇴', 'SJ': '🇸🇯',
      'AX': '🇦🇽', 'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'BY': '🇧🇾',
      'UA': '🇺🇦', 'MD': '🇲🇩', 'RO': '🇷🇴', 'BG': '🇧🇬', 'RS': '🇷🇸',
      'ME': '🇲🇪', 'BA': '🇧🇦', 'HR': '🇭🇷', 'SI': '🇸🇮', 'SK': '🇸🇰',
      'LU': '🇱🇺', 'LI': '🇱🇮', 'MC': '🇲🇨', 'AD': '🇦🇩', 'SM': '🇸🇲',
      'VA': '🇻🇦', 'MT': '🇲🇹', 'CY': '🇨🇾', 'AL': '🇦🇱', 'MK': '🇲🇰',
      'XK': '🇽🇰', 'YU': '🇷🇸', 'CS': '🇷🇸', 'SU': '🇷🇺', 'DD': '🇩🇪',
      'YU': '🇷🇸', 'CS': '🇷🇸', 'SU': '🇷🇺', 'DD': '🇩🇪'
    };
    return flagMap[countryCode] || '🏳️';
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

        {/* Phone Number with Country Code */}
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
                  <FormControl sx={{ minWidth: 90, mr: 1 }}>
                    <Select
                      value={formData.countryCode || (countries.length > 0 ? `+${countries[0].phonecode}` : '+91')}
                      onChange={(e) => {
                      onFormChange('countryCode', e.target.value);
                      // Find and set the country based on the selected code
                      const selectedCountry = countries.find(c => `+${c.phonecode}` === e.target.value);
                      if (selectedCountry) {
                        onFormChange('country', selectedCountry.value);
                      }
                    }}
                      variant="standard"
                      sx={{
                        '&:before': { borderBottom: 'none' },
                        '&:after': { borderBottom: 'none' },
                        '&:hover:before': { borderBottom: 'none' },
                        '&:hover:after': { borderBottom: 'none' },
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
                    {countries.map((country) => (
                      <MenuItem key={country.value} value={`+${country.phonecode}`}>
                        {country.flag} +{country.phonecode}
                      </MenuItem>
                    ))}
                    </Select>
                  </FormControl>
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

        {/* Row: Date of Birth and Gender */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          mb: 1
        }}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => onFormChange('dateOfBirth', e.target.value)}
            error={!!formErrors.dateOfBirth}
            helperText={formErrors.dateOfBirth || "You must be at least 5 years old to register"}
            inputProps={{
              max: new Date().toISOString().split('T')[0] // Prevent future dates
            }}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              ...universalFieldStyle,
              '& .MuiInputBase-input': {
                padding: '16.5px 14px',
                fontSize: '1rem',
                color: '#1f2937',
                '&::-webkit-calendar-picker-indicator': {
                  color: COLORS.PRIMARY,
                  cursor: 'pointer',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#6b7280',
                '&.Mui-focused': {
                  color: COLORS.PRIMARY,
                }
              }
            }}
          />

          <FormControl 
            fullWidth
            sx={{ 
              ...universalFieldStyle,
              '& .MuiInputLabel-root': {
                color: '#6b7280',
                '&.Mui-focused': {
                  color: COLORS.PRIMARY,
                }
              },
              '& .MuiSelect-select': {
                padding: '16.5px 14px',
                fontSize: '1rem',
                color: '#1f2937',
                '&:focus': {
                  backgroundColor: 'transparent',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: COLORS.PRIMARY,
                }
              }
            }}
          >
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              value={formData.gender}
              label="Gender"
              onChange={(e) => onFormChange('gender', e.target.value)}
              error={!!formErrors.gender}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <PersonOutline sx={{ color: '#6b7280' }} />
                </InputAdornment>
              }
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#9ca3af' }}>Select Gender</span>;
                }
                return selected.charAt(0).toUpperCase() + selected.slice(1);
              }}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>

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
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#9ca3af' }}>Select a Country</span>;
                }
                const selectedCountry = countries.find(c => c.value === selected);
                return selectedCountry ? selectedCountry.name : selected;
              }}
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
