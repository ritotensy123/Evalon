import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
} from '@mui/material';
import { Person, Email, Phone } from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const AdminSection = ({ formData, formErrors, onFormChange }) => {
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
        Admin Information
      </Typography>
      
      <Typography
        variant="body2"
        sx={{
          color: COLORS.TEXT_SECONDARY,
          mb: 4,
          textAlign: 'center',
        }}
      >
        Details of the organisation administrator
      </Typography>

      <Grid container spacing={3}>
        {/* Admin Name */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Admin Name"
            value={formData.adminName}
            onChange={(e) => onFormChange('adminName', e.target.value)}
            error={!!formErrors.adminName}
            helperText={formErrors.adminName}
            placeholder="Enter admin's full name"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: COLORS.TEXT_SECONDARY }}>
                  <Person />
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.adminName ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.adminName ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.adminName ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.adminName ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.adminName ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          />
        </Grid>

        {/* Admin Phone */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.adminPhone}
            onChange={(e) => onFormChange('adminPhone', e.target.value)}
            error={!!formErrors.adminPhone}
            helperText={formErrors.adminPhone}
            placeholder="+91 98765 43210"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: COLORS.TEXT_SECONDARY }}>
                  <Phone />
                </Box>
              ),
              inputProps: { 
                maxLength: 15,
                pattern: '[0-9+\\s-]*'
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.adminPhone ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.adminPhone ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.adminPhone ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.adminPhone ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.adminPhone ? '#ff6b6b' : COLORS.PRIMARY,
              },
            }}
          />
        </Grid>

        {/* Admin Email */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => onFormChange('adminEmail', e.target.value)}
            error={!!formErrors.adminEmail}
            helperText={formErrors.adminEmail}
            placeholder="admin@organisation.com"
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, color: COLORS.TEXT_SECONDARY }}>
                  <Email />
                </Box>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: formErrors.adminEmail ? '#ff6b6b' : '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: formErrors.adminEmail ? '#ff6b6b' : COLORS.PRIMARY,
                },
                '&.Mui-focused fieldset': {
                  borderColor: formErrors.adminEmail ? '#ff6b6b' : COLORS.PRIMARY,
                },
              },
              '& .MuiInputLabel-root': {
                color: formErrors.adminEmail ? '#ff6b6b' : COLORS.TEXT_SECONDARY,
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: formErrors.adminEmail ? '#ff6b6b' : COLORS.PRIMARY,
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
          <strong>Note:</strong> This email and phone number will be used for:
          <br />
          • Sending OTP verification codes
          <br />
          • Important organisation notifications
          <br />
          • Account recovery and support
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminSection;
