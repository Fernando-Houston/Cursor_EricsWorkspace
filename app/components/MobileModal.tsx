import React, { useEffect } from 'react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className = ''
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`
        relative h-full flex flex-col
        md:h-auto md:max-h-[90vh] md:m-4 md:mx-auto md:max-w-2xl md:rounded-lg md:shadow-xl
        ${className}
      `}>
        {/* Desktop: Centered modal, Mobile: Full screen */}
        <div className="bg-white h-full flex flex-col md:rounded-lg md:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white md:rounded-t-lg">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 pr-4">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </div>
          
          {/* Actions */}
          {actions && (
            <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 md:rounded-b-lg">
              <div className="flex flex-col md:flex-row md:justify-end space-y-3 md:space-y-0 md:space-x-3">
                {actions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileModal; 