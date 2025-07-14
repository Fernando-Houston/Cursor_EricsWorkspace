import React from 'react';

interface EmptyStateProps {
  variant?: 'upload' | 'search' | 'leads' | 'data';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'upload',
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'upload':
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'search':
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'leads':
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'data':
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
    }
  };

  const getDefaultContent = () => {
    switch (variant) {
      case 'upload':
        return {
          title: 'No files uploaded',
          description: 'Upload a screenshot of an HCAD property page to get started',
          actionLabel: 'Choose File'
        };
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search terms or filters',
          actionLabel: 'Clear Search'
        };
      case 'leads':
        return {
          title: 'No leads yet',
          description: 'Upload your first HCAD screenshot to start building your leads database',
          actionLabel: 'Add First Lead'
        };
      case 'data':
        return {
          title: 'No data available',
          description: 'There\'s no data to display at the moment',
          actionLabel: 'Refresh'
        };
      default:
        return {
          title: 'Nothing here',
          description: 'There\'s nothing to show right now',
          actionLabel: 'Get Started'
        };
    }
  };

  const defaultContent = getDefaultContent();
  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalActionLabel = actionLabel || defaultContent.actionLabel;

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex flex-col items-center">
        {/* Animated background circle */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-50 animate-pulse"></div>
          <div className="relative bg-white rounded-full p-4 shadow-sm">
            {getIcon()}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {finalTitle}
        </h3>
        
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          {finalDescription}
        </p>
        
        {onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {finalActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState; 