import React from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  School,
  Person,
  Assessment,
} from '@mui/icons-material';

const Step3OrganizationLink = ({ formData, formErrors, onFormChange, registrationToken }) => {
  // Set affiliation type to freelance by default
  React.useEffect(() => {
    onFormChange('affiliationType', 'freelance');
  }, []); // Empty dependency array to run only once

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
          Freelance Teacher Registration
        </Typography>
        <Typography
          variant="body2"
          sx={{ 
            color: '#666666',
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
          }}
        >
          You're registering as an independent teacher with full platform access
        </Typography>
      </Box>

      {/* Main Content */}
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a',
            mb: 3,
            mx: 'auto',
          }}
        >
          <Person sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h6"
          sx={{
            color: '#1a1a1a',
            mb: 2,
            fontWeight: 600,
          }}
        >
          Independent Teacher Setup
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: '#666666',
            mb: 3,
            maxWidth: 400,
            mx: 'auto',
          }}
        >
          As a freelance teacher, you'll have access to all platform features including creating assessments, managing students, and accessing educational resources.
        </Typography>

        <Chip
          label="Freelance Teacher"
          icon={<CheckCircle />}
          sx={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            color: '#16a34a',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            fontWeight: 500,
            mb: 3,
          }}
        />

        {/* Features List */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxWidth: 400,
            mx: 'auto',
            textAlign: 'left',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Create and manage your own courses
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Assessment sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Build comprehensive assessments and exams
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Person sx={{ color: '#667eea', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#4b5563' }}>
              Manage your student roster independently
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Step3OrganizationLink;
