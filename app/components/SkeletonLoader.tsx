import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'table' | 'button' | 'image' | 'avatar';
  lines?: number;
  height?: string;
  width?: string;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'text', 
  lines = 3, 
  height = 'h-4', 
  width = 'w-full',
  className = ''
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded';
  
  switch (variant) {
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={`${baseClasses} ${height} ${i === lines - 1 ? 'w-3/4' : width}`}
            />
          ))}
        </div>
      );
    
    case 'card':
      return (
        <div className={`${baseClasses} rounded-lg p-4 space-y-3 ${className}`}>
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </div>
      );
    
    case 'table':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="flex space-x-4">
              <div className={`${baseClasses} h-8 w-1/4`}></div>
              <div className={`${baseClasses} h-8 w-1/3`}></div>
              <div className={`${baseClasses} h-8 w-1/4`}></div>
              <div className={`${baseClasses} h-8 w-1/6`}></div>
            </div>
          ))}
        </div>
      );
    
    case 'button':
      return (
        <div className={`${baseClasses} h-10 w-24 ${className}`}></div>
      );
    
    case 'image':
      return (
        <div className={`${baseClasses} ${height} ${width} ${className}`}></div>
      );
    
    case 'avatar':
      return (
        <div className={`${baseClasses} h-10 w-10 rounded-full ${className}`}></div>
      );
    
    default:
      return (
        <div className={`${baseClasses} ${height} ${width} ${className}`}></div>
      );
  }
};

export default SkeletonLoader; 