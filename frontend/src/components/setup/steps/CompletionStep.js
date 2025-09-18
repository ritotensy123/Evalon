import React from 'react';
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Building2,
  Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const CompletionStep = ({ data, onDataChange, onNext, onPrevious, isFirstStep, isLastStep }) => {
  const { user, organizationData } = useAuth();

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Success Animation */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎉 All Set!
        </h2>
        <p className="text-gray-600 mb-6">
          Your organization is ready to go
        </p>
      </div>

      {/* Organization Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">{organizationData?.name}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-gray-500">Code:</span>
            <span className="font-medium">{organizationData?.orgCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-gray-500">Departments:</span>
            <span className="font-medium">{data.departments?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Next Steps */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">What's next?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Invite teachers and students</p>
          <p>• Set up courses and subjects</p>
          <p>• Configure your dashboard</p>
        </div>
      </div>

      {/* Call to Action */}
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
      >
        <span>Go to Dashboard</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CompletionStep;
