import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OrganizationReviewStep from './steps/OrganizationReviewStep';
import CompletionStep from './steps/CompletionStep';
import api from '../../services/api';

const SystemSetupWizard = ({ onComplete, onSkip }) => {
  const { user, organizationData, updateUser, updateDashboardData, updateOrganizationData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isResuming, setIsResuming] = useState(true);
  const [setupData, setSetupData] = useState({
    logo: organizationData?.logo || null,
    logoTempKey: null,
    organizationDetails: organizationData || {},
    departments: organizationData?.departments || [],
    adminPermissions: {
      permissions: organizationData?.adminPermissions || {},
      securitySettings: organizationData?.securitySettings || {},
      notificationSettings: organizationData?.notificationSettings || {},
      subAdmins: organizationData?.subAdmins || []
    }
  });

  // PHASE 4: Resume logic - fetch setup status and resume from last step
  useEffect(() => {
    const resumeSetup = async () => {
      // PHASE 7: Safety check - don't resume if setup already completed
      if (!user?.organizationId || organizationData?.setupCompleted === true) {
        setIsResuming(false);
        return;
      }

      setIsResuming(true);
      try {
        // Fetch current setup status
        const response = await api.get(`/organization/${user.organizationId}/setup-status`);
        if (response.data.success) {
          const status = response.data.data;
          
          // PHASE 7: Safety - don't resume if already completed
          if (status.setupCompleted === true) {
            setIsResuming(false);
            return;
          }
          
          // Restore departments if they exist in organization data
          if (organizationData?.departments && organizationData.departments.length > 0) {
            setSetupData(prev => ({
              ...prev,
              departments: organizationData.departments
            }));
          }

          // Restore from localStorage if available (takes priority for resume)
          const savedProgress = localStorage.getItem('orgSetupProgress');
          if (savedProgress) {
            try {
              const progress = JSON.parse(savedProgress);
              // Restore departments from saved progress
              if (progress.departments && Array.isArray(progress.departments)) {
                setSetupData(prev => ({
                  ...prev,
                  departments: progress.departments
                }));
              }
              // Resume from saved step (validate step number - max 2 steps)
              if (progress.step && progress.step >= 1 && progress.step <= 2) {
                setCurrentStep(progress.step);
              } else {
                // If departments exist, start at step 1 (setup), otherwise step 1
                setCurrentStep(1);
              }
            } catch (e) {
              console.error('Failed to restore progress:', e);
              setCurrentStep(1);
            }
          } else {
            // No saved progress - determine step from backend status
            if (status.departmentsCount > 0) {
              setCurrentStep(1); // Has departments, show setup step
            } else {
              setCurrentStep(1); // No departments, start from beginning
            }
          }
        }
      } catch (error) {
        console.error('Failed to resume setup:', error);
        // Start from step 1 if resume fails
        setCurrentStep(1);
      } finally {
        setIsResuming(false);
      }
    };

    resumeSetup();
  }, [user?.organizationId, organizationData]);

  // PHASE 6: Merged steps - Welcome + Setup combined, removed redundant step
  const steps = [
    {
      id: 1,
      title: 'Organization Setup',
      description: 'Add departments and configure your organization',
      icon: <Building2 className="w-6 h-6" />,
      component: OrganizationReviewStep
    },
    {
      id: 2,
      title: 'Complete',
      description: 'Setup completed successfully!',
      icon: <Check className="w-6 h-6" />,
      component: CompletionStep
    }
  ];

  // Save progress to localStorage on step/data change
  useEffect(() => {
    if (!isResuming && currentStep > 0) {
      const progress = {
        step: currentStep,
        departments: setupData.departments,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('orgSetupProgress', JSON.stringify(progress));
    }
  }, [currentStep, setupData.departments, isResuming]);

  const handleStepData = (stepId, data) => {
    setSetupData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Submit setup data to backend
      const response = await api.post('/complete-setup', {
        organizationId: user.organizationId,
        logo: setupData.logo,
        logoTempKey: setupData.logoTempKey,
        organizationDetails: setupData.organizationDetails,
        departments: setupData.departments,
        adminPermissions: setupData.adminPermissions
      });

      if (response.data.success) {
        // Clear saved progress
        localStorage.removeItem('orgSetupProgress');
        
        // Update user context with new data
        updateUser({
          ...user,
          setupCompleted: true,
          firstLogin: false
        });

        // Update dashboard data
        updateDashboardData({
          ...response.data.dashboardData
        });

        // Update organization data
        updateOrganizationData({
          ...response.data.data.organization
        });

        // Move to completion step (step 2)
        setCurrentStep(2);
      } else {
        throw new Error(response.data.message || 'Setup completion failed');
      }
    } catch (error) {
      console.error('Setup completion error:', error);
      alert('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalComplete = () => {
    // PHASE 6: Clear progress on final completion
    localStorage.removeItem('orgSetupProgress');
    localStorage.removeItem('orgSetupDismissed');
    onComplete && onComplete();
  };

  const handleSkip = async () => {
    // PHASE 5: Skip should NOT mark as completed - allow resuming later
    // Just close the wizard, don't call skip-setup API
    // Progress is saved in localStorage, can be resumed
    localStorage.setItem('orgSetupDismissed', new Date().toISOString());
    onSkip && onSkip();
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

  // Show loading while resuming
  if (isResuming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Setup Wizard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Step {currentStep} of {steps.length}</span>
              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                currentStep > step.id 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : currentStep === step.id 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <div className="scale-75">{step.icon}</div>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={setupData}
              onDataChange={handleStepData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirstStep={currentStep === 1}
              isLastStep={currentStep === steps.length}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          {/* Skip/Close button - always available */}
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {currentStep === steps.length ? 'Close' : 'Skip for now'}
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep === 1 ? (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Complete Setup
              </button>
            ) : (
              <button
                onClick={handleFinalComplete}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSetupWizard;
