import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  Link,
  School,
  TrendingUp,
  VerifiedUser,
  Info,
  ContactSupport,
  Person,
  Public,
} from '@mui/icons-material';
import { COLORS, BORDER_RADIUS } from '../../../theme/constants';

const Step4AutoMapping = ({ formData, formErrors, onFormChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [mappingProgress, setMappingProgress] = useState(0);
  const [mappingSteps, setMappingSteps] = useState([]);

  useEffect(() => {
    // Simulate auto-mapping when component mounts
    if (formData.isOrganizationValid && formData.studentVerificationStatus === 'verified') {
      // Initialize mapping steps
      const steps = [
        { id: 1, name: 'Connecting to database', completed: false },
        { id: 2, name: 'Retrieving student record', completed: false },
        { id: 3, name: 'Mapping academic details', completed: false },
        { id: 4, name: 'Finalizing setup', completed: false },
      ];
      setMappingSteps(steps);

      // Simulate progress with step updates
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        setMappingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          
          // Update steps as progress increases
          const newProgress = prev + 25;
          if (newProgress >= 25 && currentStep === 0) {
            setMappingSteps(prev => prev.map(step => 
              step.id === 1 ? { ...step, completed: true } : step
            ));
            currentStep = 1;
          } else if (newProgress >= 50 && currentStep === 1) {
            setMappingSteps(prev => prev.map(step => 
              step.id === 2 ? { ...step, completed: true } : step
            ));
            currentStep = 2;
          } else if (newProgress >= 75 && currentStep === 2) {
            setMappingSteps(prev => prev.map(step => 
              step.id === 3 ? { ...step, completed: true } : step
            ));
            currentStep = 3;
          } else if (newProgress >= 100 && currentStep === 3) {
            setMappingSteps(prev => prev.map(step => 
              step.id === 4 ? { ...step, completed: true } : step
            ));
          }
          
          return newProgress;
        });
      }, 400);

      setTimeout(() => {
        onFormChange('department', 'Computer Science');
        onFormChange('batch', '2023');
        onFormChange('year', '2nd Year');
        onFormChange('isAutoMapped', true);
        setIsLoading(false);
        setTimeout(() => setShowContent(true), 300);
      }, 1600);
    } else {
      setIsLoading(false);
      setShowContent(true);
    }
  }, [formData.isOrganizationValid, formData.studentVerificationStatus, onFormChange]);

  // Handle standalone case
  if (formData.isStandalone) {
    return (
      <Box sx={{ width: '100%' }}>
        {/* Simple Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              border: '2px solid #e5e7eb',
            }}
          >
            <Person sx={{ color: '#6b7280', fontSize: 28 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
            Welcome to Evalon
          </Typography>
          <Typography variant="body1" sx={{ color: '#6b7280' }}>
            Your independent student account is ready
          </Typography>
        </Box>

        {/* Simple Profile Card */}
        <Paper sx={{ 
          borderRadius: 2, 
          border: '1px solid #e5e7eb', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <Box sx={{ 
            p: 2.5, 
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Public sx={{ color: '#6b7280', fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                Student Profile
              </Typography>
              <Chip
                label="Independent"
                size="small"
                sx={{ 
                  ml: 'auto', 
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontWeight: 500,
                  border: '1px solid #d1d5db',
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  Registration Type
                </Typography>
                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                  Independent Student
                </Typography>
              </Box>
              
              {formData.currentInstitution && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Institution
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.currentInstitution}
                  </Typography>
                </Box>
              )}
              
              {formData.academicLevel && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Academic Level
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.academicLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Simple Info Box */}
        <Box sx={{ 
          mt: 3, 
          p: 3, 
          backgroundColor: '#f8fafc', 
          borderRadius: 2, 
          border: '1px solid #e2e8f0',
          textAlign: 'center',
        }}>
          <TrendingUp sx={{ color: '#6b7280', fontSize: 24, mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#374151', fontWeight: 500, mb: 1 }}>
            Ready to Start Learning!
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Access public assessments and track your progress independently
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!formData.isOrganizationValid) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: '#fef3c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: '2px solid #fde68a',
          }}
        >
          <Info sx={{ color: '#d97706', fontSize: 28 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
          Organization Verification Required
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Please complete organization verification in the previous step
        </Typography>
      </Box>
    );
  }

  if (formData.studentVerificationStatus !== 'verified') {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            border: '2px solid #93c5fd',
          }}
        >
          <School sx={{ color: '#2563eb', fontSize: 28 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
          Verification Pending
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Auto-mapping will be available once verification is complete
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          {/* Simple Loading Animation */}
          <Box
            sx={{
              position: 'relative',
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 3,
            }}
          >
            {/* Simple rotating ring */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '3px solid #f3f4f6',
                borderTop: '3px solid #6b7280',
                animation: 'rotate 1.5s linear infinite',
                '@keyframes rotate': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
            {/* Center icon */}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e5e7eb',
              }}
            >
              <Link sx={{ color: '#6b7280', fontSize: 16 }} />
            </Box>
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 2 }}>
            Mapping Your Details
          </Typography>
          
          {/* Progress Bar */}
          <Box sx={{ width: '80%', maxWidth: 400, mx: 'auto', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Progress
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                {mappingProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={mappingProgress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: '#f3f4f6',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: '#6b7280',
                },
              }}
            />
          </Box>

          {/* Mapping Steps */}
          <Box sx={{ maxWidth: 400, mx: 'auto' }}>
            {mappingSteps.map((step, index) => (
              <Box
                key={step.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: step.completed ? '#f0fdf4' : '#f9fafb',
                  border: step.completed ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
                  transition: 'all 0.3s ease',
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: step.completed ? '#22c55e' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.completed ? (
                    <CheckCircle sx={{ color: 'white', fontSize: 14 }} />
                  ) : (
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                      {step.id}
                    </Typography>
                  )}
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: step.completed ? '#166534' : '#6b7280',
                    fontWeight: step.completed ? 500 : 400,
                  }}
                >
                  {step.name}
                </Typography>
              </Box>
            ))}
          </Box>
          
          <Typography variant="body1" sx={{ color: '#6b7280', mt: 2 }}>
            Retrieving your academic information from {formData.organizationName}
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Success Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                border: '2px solid #bbf7d0',
              }}
            >
              <CheckCircle sx={{ color: '#22c55e', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1f2937', mb: 1 }}>
              Mapping Complete
            </Typography>
            <Typography variant="body1" sx={{ color: '#6b7280' }}>
              Successfully mapped to {formData.department}, Batch {formData.batch}
            </Typography>
          </Box>

          {/* Simple Academic Card */}
          <Paper sx={{ 
            borderRadius: 2, 
            border: '1px solid #e5e7eb', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <Box sx={{ 
              p: 2.5, 
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <School sx={{ color: '#6b7280', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                  Academic Details
                </Typography>
                <Chip
                  icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                  label="Auto-Mapped"
                  size="small"
                  sx={{ 
                    ml: 'auto', 
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    fontWeight: 500,
                    border: '1px solid #bbf7d0',
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Department
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.department}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Batch
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.batch}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Year
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.year}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Organization
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500 }}>
                    {formData.organizationName}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Simple Info Box */}
          <Box sx={{ 
            mt: 3, 
            p: 3, 
            backgroundColor: '#f8fafc', 
            borderRadius: 2, 
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <ContactSupport sx={{ color: '#6b7280', fontSize: 24, mb: 1 }} />
            <Typography variant="body1" sx={{ color: '#374151', fontWeight: 500, mb: 1 }}>
              Need Help?
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Contact your institution's admin if any information is incorrect
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Step4AutoMapping;
