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
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Business,
  LocationOn,
  Phone,
  Email,
  Language,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';
import { locationAPI } from '../../../services/api';

const Step1OrganisationDetails = ({ formData, formErrors, onFormChange }) => {
  const organisationTypes = [
    { value: 'school', label: 'School' },
    { value: 'college', label: 'College' },
    { value: 'university', label: 'University' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'other', label: 'Other' },
  ];

  // State for dynamic location data
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState({
    countries: false,
    states: false,
    cities: false
  });
  const [error, setError] = useState({
    countries: null,
    states: null,
    cities: null
  });

  // Fetch countries on component mount - using dynamic API (CountryStateCity)
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formData.country) {
      fetchStates(formData.country);
      // Reset state and city when country changes
      onFormChange('state', '');
      onFormChange('city', '');
    }
  }, [formData.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.country && formData.state) {
      fetchCities(formData.country, formData.state);
      // Reset city when state changes
      onFormChange('city', '');
    }
  }, [formData.state]);

  const fetchCountries = async () => {
    setLoading(prev => ({ ...prev, countries: true }));
    setError(prev => ({ ...prev, countries: null }));
    
    try {
      const response = await locationAPI.getCountries();
      if (response.success) {
        setCountries(response.data);
      } else {
        setError(prev => ({ ...prev, countries: 'Failed to fetch countries' }));
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError(prev => ({ ...prev, countries: err.message || 'Failed to fetch countries' }));
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchStates = async (countryCode) => {
    setLoading(prev => ({ ...prev, states: true }));
    setError(prev => ({ ...prev, states: null }));
    
    try {
      const response = await locationAPI.getStatesByCountry(countryCode);
      if (response.success) {
        setStates(response.data);
      } else {
        setError(prev => ({ ...prev, states: 'Failed to fetch states' }));
      }
    } catch (err) {
      console.error('Error fetching states:', err);
      setError(prev => ({ ...prev, states: err.message || 'Failed to fetch states' }));
    } finally {
      setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const fetchCities = async (countryCode, stateCode) => {
    setLoading(prev => ({ ...prev, cities: true }));
    setError(prev => ({ ...prev, cities: null }));
    
    try {
      const response = await locationAPI.getCitiesByState(countryCode, stateCode);
      if (response.success) {
        setCities(response.data);
      } else {
        setError(prev => ({ ...prev, cities: 'Failed to fetch cities' }));
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError(prev => ({ ...prev, cities: err.message || 'Failed to fetch cities' }));
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
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
              value={formData.country || ''}
              label="Country"
              onChange={(e) => {
                onFormChange('country', e.target.value);
                onFormChange('state', '');
                onFormChange('city', '');
              }}
              error={!!formErrors.country}
              disabled={loading.countries}
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
              {loading.countries ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading countries...
                </MenuItem>
              ) : error.countries ? (
                <MenuItem disabled>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error.countries}
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
          </FormControl>

          <FormControl sx={{ flex: 1, ...universalFieldStyle }}>
            <InputLabel>State</InputLabel>
            <Select
              value={formData.state || ''}
              label="State"
              onChange={(e) => {
                onFormChange('state', e.target.value);
                onFormChange('city', '');
              }}
              error={!!formErrors.state}
              disabled={!formData.country || loading.states}
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
              {loading.states ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading states...
                </MenuItem>
              ) : error.states ? (
                <MenuItem disabled>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error.states}
                  </Alert>
                </MenuItem>
              ) : (
                states.map((state) => (
                  <MenuItem key={state.code} value={state.code}>
                    {state.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        {/* Row 2: City and Pincode */}
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 }, 
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          <FormControl sx={{ flex: 1, ...universalFieldStyle }}>
            <InputLabel>City</InputLabel>
            <Select
              value={formData.city || ''}
              label="City"
              onChange={(e) => onFormChange('city', e.target.value)}
              error={!!formErrors.city}
              disabled={!formData.state || loading.cities}
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
              {loading.cities ? (
                <MenuItem disabled>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Loading cities...
                </MenuItem>
              ) : error.cities ? (
                <MenuItem disabled>
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {error.cities}
                  </Alert>
                </MenuItem>
              ) : (
                cities.map((city) => (
                  <MenuItem key={city.name} value={city.name}>
                    {city.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

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
              value={formData.organisationType || ''}
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
