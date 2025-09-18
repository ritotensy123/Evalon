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
import WelcomeStep from './steps/WelcomeStep';
import OrganizationReviewStep from './steps/OrganizationReviewStep';
import CompletionStep from './steps/CompletionStep';
import api from '../../services/api';

const SystemSetupWizard = ({ onComplete, onSkip }) => {
  const { user, organizationData, updateUser, updateDashboardData, updateOrganizationData } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
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

  const steps = [
    {
      id: 1,
      title: 'Welcome',
      description: 'Get started with your organization setup',
      icon: <Sparkles className="w-6 h-6" />,
      component: WelcomeStep
    },
    {
      id: 2,
      title: 'Organization Setup',
      description: 'Configure your organization details and departments',
      icon: <Building2 className="w-6 h-6" />,
      component: OrganizationReviewStep
    },
    {
      id: 3,
      title: 'Complete',
      description: 'Setup completed successfully!',
      icon: <Check className="w-6 h-6" />,
      component: CompletionStep
    }
  ];

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
      const response = await api.post('/organization/complete-setup', {
        ...setupData,
        organizationId: user.organizationId
      });

      if (response.data.success) {
        // Update user context with new data
        updateUser({
          ...user,
          setupCompleted: true,
          firstLogin: false,
          ...response.data.data
        });

        // Update dashboard data
        updateDashboardData({
          ...response.data.dashboardData
        });

        // Update organization data
        updateOrganizationData({
          ...response.data.data.organization
        });

        // Move to completion step
        setCurrentStep(steps.length);
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
    onComplete && onComplete();
  };

  const handleSkip = () => {
    onSkip && onSkip();
  };

  const CurrentStepComponent = steps[currentStep - 1]?.component;

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
          {/* Skip button - only show after welcome step */}
          {currentStep > 1 && (
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          )}

          {/* Spacer for welcome step */}
          {currentStep === 1 && <div></div>}

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {currentStep === 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : currentStep === steps.length - 1 ? (
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
                Complete
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
