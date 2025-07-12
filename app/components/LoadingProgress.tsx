import React from 'react';

interface LoadingStage {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  duration?: number;
}

interface LoadingProgressProps {
  currentStage: string;
  stages: LoadingStage[];
  progress?: number;
  className?: string;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  currentStage,
  stages,
  progress = 0,
  className = ''
}) => {
  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.id === currentStage);
  };

  const currentIndex = getCurrentStageIndex();

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-blue-900">AI Processing Pipeline</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="text-sm text-blue-700 font-medium">
            {progress > 0 ? `${progress}%` : 'Processing...'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={stage.id} className="flex items-start space-x-4">
              {/* Stage Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-gray-300 text-gray-500'
              }`}>
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4">
                    {stage.icon}
                  </div>
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className={`text-sm font-medium transition-colors ${
                    isCompleted 
                      ? 'text-green-700' 
                      : isCurrent 
                      ? 'text-blue-700' 
                      : 'text-gray-600'
                  }`}>
                    {stage.label}
                  </h4>
                  {isCurrent && (
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-1 transition-colors ${
                  isCompleted 
                    ? 'text-green-600' 
                    : isCurrent 
                    ? 'text-blue-600' 
                    : 'text-gray-500'
                }`}>
                  {stage.description}
                </p>
              </div>

              {/* Stage Duration */}
              {stage.duration && isCurrent && (
                <div className="text-xs text-blue-600 font-medium">
                  ~{stage.duration}s
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Stage Details */}
      {currentIndex >= 0 && currentIndex < stages.length && (
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-900 font-medium">
              Currently: {stages[currentIndex].label}
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {stages[currentIndex].description}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadingProgress; 