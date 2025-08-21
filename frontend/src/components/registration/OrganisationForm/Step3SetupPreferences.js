import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  Avatar,
  IconButton,
  InputAdornment,
  Fade,
  Alert,
} from '@mui/material';
import {
  Upload,
  Settings,
  Business,
  Group,
  Schedule,
  Security,
  Add,
  PhotoCamera,
  Delete,
  Warning,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS, SHADOWS } from '../../../theme/constants';

const Step3SetupPreferences = ({ formData, formErrors, onFormChange }) => {
  const [newDepartment, setNewDepartment] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [fileError, setFileError] = useState('');

  // Universal field styling matching other steps
  const universalFieldStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
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

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    setFileError(''); // Clear previous errors
    
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      
      if (file.size > maxSize) {
        setFileError('File Size Must Be Less Than 2MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setFileError('Please Upload A PNG Or JPG File');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        onFormChange('logo', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDepartment = () => {
    if (newDepartment.trim() && !formData.departments.includes(newDepartment.trim())) {
      onFormChange('departments', [...formData.departments, newDepartment.trim()]);
      setNewDepartment('');
    }
  };

  const handleRemoveDepartment = (index) => {
    const updatedDepartments = formData.departments.filter((_, i) => i !== index);
    onFormChange('departments', updatedDepartments);
  };

  const timeZones = [
    'UTC-12:00',
    'UTC-11:00',
    'UTC-10:00',
    'UTC-09:00',
    'UTC-08:00',
    'UTC-07:00',
    'UTC-06:00',
    'UTC-05:00',
    'UTC-04:00',
    'UTC-03:00',
    'UTC-02:00',
    'UTC-01:00',
    'UTC+00:00',
    'UTC+01:00',
    'UTC+02:00',
    'UTC+03:00',
    'UTC+04:00',
    'UTC+05:00',
    'UTC+05:30',
    'UTC+06:00',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+09:00',
    'UTC+10:00',
    'UTC+11:00',
    'UTC+12:00',
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Section Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Customise Your Workspace
          </Typography>
          <Typography
            variant="body1"
            sx={{ 
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.9rem',
            }}
          >
            <Settings sx={{ fontSize: 16, color: COLORS.PRIMARY }} />
            Configure how Evalon works for your institution
          </Typography>
        </Box>
      </Fade>

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Logo Upload */}
        <Fade in timeout={800}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Institution Logo
            </Typography>
            <Box
              sx={{
                border: fileError ? '2px dashed #ef4444' : '2px dashed rgba(102, 126, 234, 0.3)',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                backgroundColor: fileError ? 'rgba(239, 68, 68, 0.02)' : 'rgba(102, 126, 234, 0.02)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: fileError ? '#ef4444' : COLORS.PRIMARY,
                  backgroundColor: fileError ? 'rgba(239, 68, 68, 0.05)' : 'rgba(102, 126, 234, 0.05)',
                  transform: 'translateY(-1px)',
                  boxShadow: fileError ? '0 2px 8px rgba(239, 68, 68, 0.1)' : '0 2px 8px rgba(102, 126, 234, 0.1)',
                },
              }}
            >
              {logoPreview ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={logoPreview}
                    sx={{
                      width: 60,
                      height: 60,
                      mb: 1,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
                      border: '2px solid rgba(102, 126, 234, 0.1)',
                    }}
                  />
                  <IconButton
                    onClick={() => {
                      setLogoPreview(null);
                      onFormChange('logo', null);
                      setFileError('');
                    }}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: '#ef4444',
                      color: 'white',
                      width: 24,
                      height: 24,
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                      '&:hover': {
                        backgroundColor: '#dc2626',
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                      },
                    }}
                  >
                    <Delete sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 24, color: COLORS.PRIMARY }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6b7280', mb: 1, fontSize: '0.8rem' }}>
                    Upload your institution logo (PNG, JPG up to 2MB)
                  </Typography>
                </Box>
              )}
              
              <Button
                component="label"
                variant="outlined"
                size="small"
                startIcon={<Upload />}
                sx={{
                  borderColor: fileError ? '#ef4444' : COLORS.PRIMARY,
                  color: fileError ? '#ef4444' : COLORS.PRIMARY,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  '&:hover': {
                    borderColor: fileError ? '#ef4444' : COLORS.PRIMARY,
                    backgroundColor: fileError ? 'rgba(239, 68, 68, 0.04)' : 'rgba(102, 126, 234, 0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: fileError ? '0 2px 6px rgba(239, 68, 68, 0.15)' : '0 2px 6px rgba(102, 126, 234, 0.15)',
                  },
                }}
              >
                {logoPreview ? 'Change Logo' : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
            </Box>
            {fileError && (
              <Alert 
                severity="error" 
                icon={<Warning />}
                sx={{ 
                  mt: 1, 
                  py: 0.5,
                  '& .MuiAlert-message': {
                    fontSize: '0.75rem',
                  }
                }}
              >
                {fileError}
              </Alert>
            )}
          </Box>
        </Fade>

        {/* Institution Structure */}
        <Fade in timeout={900}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Institution Structure *
            </Typography>
            <FormControl fullWidth error={!!formErrors.institutionStructure} sx={universalFieldStyle}>
              <InputLabel>Institution Structure</InputLabel>
              <Select
                value={formData.institutionStructure}
                onChange={(e) => onFormChange('institutionStructure', e.target.value)}
                label="Institution Structure"
                startAdornment={
                  <InputAdornment position="start">
                    <Business sx={{ color: '#6b7280', fontSize: 18 }} />
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
                <MenuItem value="single">Single Department</MenuItem>
                <MenuItem value="multi">Multi-Department</MenuItem>
              </Select>
              {formErrors.institutionStructure && (
                <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5 }}>
                  {formErrors.institutionStructure}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Fade>

        {/* Departments */}
        <Fade in timeout={1000}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Departments
            </Typography>
            
            {/* Existing Departments */}
            {formData.departments.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.departments.map((dept, index) => (
                  <Chip
                    key={index}
                    label={dept}
                    onDelete={() => handleRemoveDepartment(index)}
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

            {/* Add New Department */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                placeholder="Enter department name"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDepartment()}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Group sx={{ color: '#6b7280', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={universalFieldStyle}
              />
              <Button
                onClick={handleAddDepartment}
                disabled={!newDepartment.trim()}
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
          </Box>
        </Fade>

        {/* Add Sub-Admins */}
        <Fade in timeout={1100}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={formData.addSubAdmins}
                  onChange={(e) => onFormChange('addSubAdmins', e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: COLORS.PRIMARY,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: COLORS.PRIMARY,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group sx={{ color: '#6b7280', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    Add Sub-Admins Now?
                  </Typography>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  mt: 0.5,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#6b7280', ml: 4, display: 'block', fontSize: '0.75rem' }}>
              You can add sub-administrators to help manage your institution
            </Typography>
          </Box>
        </Fade>

        {/* Time Zone */}
        <Fade in timeout={1200}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#1f2937' }}>
              Time Zone *
            </Typography>
            <FormControl fullWidth error={!!formErrors.timeZone} sx={universalFieldStyle}>
              <InputLabel>Time Zone</InputLabel>
              <Select
                value={formData.timeZone}
                onChange={(e) => onFormChange('timeZone', e.target.value)}
                label="Time Zone"
                startAdornment={
                  <InputAdornment position="start">
                    <Schedule sx={{ color: '#6b7280', fontSize: 18 }} />
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
                {timeZones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.timeZone && (
                <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5 }}>
                  {formErrors.timeZone}
                </Typography>
              )}
            </FormControl>
          </Box>
        </Fade>

        {/* Two-Factor Authentication */}
        <Fade in timeout={1300}>
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.02)',
              borderRadius: 2,
              border: '1px solid rgba(102, 126, 234, 0.1)',
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={formData.twoFactorAuth}
                  onChange={(e) => onFormChange('twoFactorAuth', e.target.checked)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: COLORS.PRIMARY,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: COLORS.PRIMARY,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security sx={{ color: '#6b7280', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                    Two-Factor Login for Admins
                  </Typography>
                </Box>
              }
              sx={{ 
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  mt: 0.5,
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#6b7280', ml: 4, display: 'block', fontSize: '0.75rem' }}>
              Enable additional security with 2FA for all admin accounts
            </Typography>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default Step3SetupPreferences;
