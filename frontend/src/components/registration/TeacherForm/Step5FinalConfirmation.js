import React from 'react';
import {
  Box,
  Typography,
  Button,
  Fade,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CheckCircle,
  Person,
  School,
  Business,
  Security,
  Edit,
} from '@mui/icons-material';
import { COLORS } from '../../../theme/constants';

const Step5FinalConfirmation = ({ formData, formErrors, onFormChange }) => {
  // Universal field styling
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

  const renderSection = (title, icon, data, stepNumber) => (
    <Box
      sx={{
        p: 2,
        backgroundColor: '#f8fafc',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1f2937' }}>
            {title}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<Edit />}
          sx={{
            color: COLORS.PRIMARY,
            textTransform: 'none',
            fontSize: '0.75rem',
            p: 0.5,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            },
          }}
        >
          Edit
        </Button>
      </Box>
      <Box sx={{ pl: 3 }}>
        {data}
      </Box>
    </Box>
  );

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
            ✅ Review & Submit
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
            <CheckCircle sx={{ fontSize: 16, color: COLORS.PRIMARY }} />
            Review your information before completing registration
          </Typography>
        </Box>
      </Fade>

      {/* Review Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        
        {/* Personal Information */}
        <Fade in timeout={800}>
          {renderSection(
            "Personal Information",
            <Person sx={{ color: COLORS.PRIMARY, fontSize: 18 }} />,
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Name:</strong> {formData.fullName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Email:</strong> {formData.emailAddress}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Phone:</strong> {formData.countryCode} {formData.phoneNumber}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Location:</strong> {formData.city}, {formData.country} - {formData.pincode}
              </Typography>
            </Box>
          )}
        </Fade>

        {/* Professional Details */}
        <Fade in timeout={900}>
          {renderSection(
            "Professional Details",
            <School sx={{ color: COLORS.PRIMARY, fontSize: 18 }} />,
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Role:</strong> {formData.role === 'hod' ? 'HOD (Head of Department)' : 
                                       formData.role === 'coordinator' ? 'Coordinator' : 'Teacher'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Type:</strong> {formData.isFreelance ? 'Freelance Teacher' : 'Organization-Linked'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#374151' }}>
                <strong>Subjects:</strong> {formData.subjectExpertise.join(', ')}
              </Typography>
            </Box>
          )}
        </Fade>

        {/* Organization Link (if applicable) */}
        {!formData.isFreelance && (
          <Fade in timeout={1000}>
            {renderSection(
              "Organization Link",
              <Business sx={{ color: COLORS.PRIMARY, fontSize: 18 }} />,
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {formData.isOrganizationValid ? (
                  <>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      <strong>Organization:</strong> {formData.organizationName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      <strong>Location:</strong> {formData.organizationLocation}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                      <strong>Status:</strong> {formData.associationStatus === 'direct' ? 
                        'Direct Association' : 'Pending Admin Approval'}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: '#ef4444' }}>
                    Organization code validation pending
                  </Typography>
                )}
              </Box>
            )}
          </Fade>
        )}

        {/* Security Verification */}
        <Fade in timeout={1100}>
          {renderSection(
            "Security Verification",
            <Security sx={{ color: COLORS.PRIMARY, fontSize: 18 }} />,
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: formData.emailVerified ? '#10b981' : '#ef4444' }}>
                <strong>Email:</strong> {formData.emailVerified ? '✅ Verified' : '❌ Not Verified'}
              </Typography>
              <Typography variant="body2" sx={{ color: formData.phoneVerified ? '#10b981' : '#ef4444' }}>
                <strong>Phone:</strong> {formData.phoneVerified ? '✅ Verified' : '❌ Not Verified'}
              </Typography>
            </Box>
          )}
        </Fade>

        {/* Terms and Conditions */}
        <Fade in timeout={1200}>
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
                <Checkbox
                  checked={formData.termsAccepted}
                  onChange={(e) => onFormChange('termsAccepted', e.target.checked)}
                  sx={{
                    color: COLORS.PRIMARY,
                    '&.Mui-checked': {
                      color: COLORS.PRIMARY,
                    },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.875rem' }}>
                  I agree to the{' '}
                  <span style={{ color: COLORS.PRIMARY, cursor: 'pointer', textDecoration: 'underline' }}>
                    Terms and Conditions
                  </span>
                  {' '}and{' '}
                  <span style={{ color: COLORS.PRIMARY, cursor: 'pointer', textDecoration: 'underline' }}>
                    Privacy Policy
                  </span>
                </Typography>
              }
            />
            {formErrors.termsAccepted && (
              <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5, display: 'block' }}>
                {formErrors.termsAccepted}
              </Typography>
            )}
          </Box>
        </Fade>

        {/* Summary */}
        <Fade in timeout={1300}>
          <Box
            sx={{
              p: 2,
              backgroundColor: '#f0fdf4',
              borderRadius: 2,
              border: '1px solid #bbf7d0',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#166534' }}>
              Registration Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#166534' }}>
                • You're registering as a {formData.isFreelance ? 'freelance' : 'organization-linked'} teacher
              </Typography>
              <Typography variant="caption" sx={{ color: '#166534' }}>
                • Your account will be created with the provided information
              </Typography>
              {!formData.isFreelance && formData.associationStatus === 'pending' && (
                <Typography variant="caption" sx={{ color: '#166534' }}>
                  • You'll receive an invitation email for organization approval
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: '#166534' }}>
                • A confirmation email will be sent to {formData.emailAddress}
              </Typography>
            </Box>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
};

export default Step5FinalConfirmation;
