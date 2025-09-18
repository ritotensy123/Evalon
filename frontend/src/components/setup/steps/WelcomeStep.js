import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const WelcomeStep = ({ data, onDataChange, onNext, onPrevious, isFirstStep, isLastStep }) => {
  const { user, organizationData } = useAuth();

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Evalon! 🎉
        </h2>
        <p className="text-gray-600 mb-6">
          Let's quickly set up your organization
        </p>
      </div>

      {/* Organization Info */}
      {organizationData && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Your Organization</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <p className="font-medium">{organizationData.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Code:</span>
              <p className="font-medium">{organizationData.orgCode}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info */}
      <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>2 minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>2 simple steps</span>
        </div>
      </div>

      {/* Call to Action */}
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
      >
        <span>Get Started</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default WelcomeStep;
