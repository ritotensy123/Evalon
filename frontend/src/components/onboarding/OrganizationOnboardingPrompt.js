import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Settings,
  Close,
  ArrowForward,
  Schedule,
} from '@mui/icons-material';
import { COLORS } from '../../theme/constants';
import SystemSetupWizard from '../setup/SystemSetupWizard';

const OrganizationOnboardingPrompt = ({ organizationData, onSetupComplete }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [dismissedUntil, setDismissedUntil] = useState(null);

  // PHASE 7: Safety checks - don't show if setup is completed
  React.useEffect(() => {
    if (organizationData?.setupCompleted === true) {
      setIsDismissed(true);
      // Clear any dismissal flags since setup is complete
      localStorage.removeItem('orgOnboardingDismissed');
      return;
    }

    // Check if prompt was dismissed (localStorage)
    const dismissed = localStorage.getItem('orgOnboardingDismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // If dismissed less than 24 hours ago, keep dismissed
      if (now - dismissedDate < 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        setDismissedUntil(dismissedDate);
      } else {
        // Dismissal expired, show again
        localStorage.removeItem('orgOnboardingDismissed');
      }
    }
  }, [organizationData?.setupCompleted]);

  const handleContinueSetup = () => {
    setShowWizard(true);
  };

  const handleRemindLater = () => {
    setIsDismissed(true);
    // Dismiss for 24 hours
    const dismissUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('orgOnboardingDismissed', dismissUntil.toISOString());
    setDismissedUntil(dismissUntil);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 24 hours
    const dismissUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('orgOnboardingDismissed', dismissUntil.toISOString());
    setDismissedUntil(dismissUntil);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setIsDismissed(true);
    // Clear dismissal so prompt doesn't show again after completion
    localStorage.removeItem('orgOnboardingDismissed');
    if (onSetupComplete) {
      onSetupComplete();
    }
  };

  // PHASE 7: Safety checks - don't show if setup completed or dismissed
  if (organizationData?.setupCompleted === true || isDismissed) {
    return null;
  }

  // PHASE 3: Show wizard in modal overlay when opened
  if (showWizard) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) {
            handleWizardClose();
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '95vh',
            backgroundColor: 'transparent',
            borderRadius: 2,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            onClick={handleWizardClose}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <Close />
          </IconButton>
          <Box sx={{ maxHeight: '95vh', overflowY: 'auto', borderRadius: 2, overflow: 'hidden' }}>
            <SystemSetupWizard
              onComplete={handleWizardComplete}
              onSkip={handleWizardClose}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // Show prompt banner
  return (
    <Box sx={{ padding: '12px 24px', flexShrink: 0 }}>
      <Paper
        elevation={2}
        sx={{
          mb: 3,
          p: 2,
          background: `linear-gradient(135deg, ${COLORS.PRIMARY}15 0%, ${COLORS.PRIMARY}05 100%)`,
          border: `1px solid ${COLORS.PRIMARY}30`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, #764ba2 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                Complete your organization setup
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                Add departments and configure basics to get the most out of Evalon
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={handleRemindLater}
              sx={{
                textTransform: 'none',
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
                '&:hover': {
                  borderColor: COLORS.PRIMARY,
                  backgroundColor: `${COLORS.PRIMARY}10`,
                },
              }}
            >
              Remind Me Later
            </Button>
            <Button
              variant="contained"
              startIcon={<ArrowForward />}
              onClick={handleContinueSetup}
              sx={{
                textTransform: 'none',
                background: `linear-gradient(135deg, ${COLORS.PRIMARY} 0%, #764ba2 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${COLORS.PRIMARY}dd 0%, #764ba2dd 100%)`,
                },
              }}
            >
              Continue Setup
            </Button>
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{
                color: '#999999',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrganizationOnboardingPrompt;

