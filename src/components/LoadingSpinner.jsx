import React from 'react';

const LoadingSpinner = ({ message = "Loading data...", size = "lg" }) => {
  // Size variants
  const sizeClasses = {
    sm: "w-6 h-6 mb-0", // Small size for inline loading
    md: "w-16 h-16 mb-3", // Medium size for section loading
    lg: "w-28 h-28 mb-5", // Large size for full page loading
  };
  
  // Container variants based on size
  const containerClasses = {
    sm: "inline-flex items-center", // Inline container
    md: "flex flex-col items-center", // Section container
    lg: "fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-gray-50/90 to-green-50/80 z-30" // Full page overlay
  };
  
  // Spinner wrap variants
  const spinnerWrapClasses = {
    sm: "relative flex items-center",
    md: "relative flex flex-col items-center p-5 rounded-xl bg-white shadow-md border border-green-200/60",
    lg: "relative flex flex-col items-center p-8 rounded-xl bg-white shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-green-200/60"
  };
  
  return (
    <div className={containerClasses[size]}>
      <div className={spinnerWrapClasses[size === 'sm' ? 'sm' : (size === 'md' ? 'md' : 'lg')]}>
        {/* Animated gradient spinner rings */}
        <div className={`relative ${sizeClasses[size]}`}>
          {/* Outer ring with gradient effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse opacity-30" style={{ padding: size === 'sm' ? '2px' : '5px' }}></div>
          
          {/* Spinning rings */}
          <div className="absolute inset-0 w-full h-full rounded-full border-t-transparent border-l-transparent border-r-transparent border-b-gradient-to-r from-green-500 to-blue-500 animate-spin" 
               style={{ borderBottomColor: '#22c55e', borderWidth: size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px' }}></div>
          
          <div className="absolute inset-0 w-full h-full rounded-full border-t-transparent border-l-transparent border-r-gradient-to-r from-green-500 to-blue-400 border-b-transparent animate-[spin_3s_linear_infinite]" 
               style={{ borderRightColor: '#3b82f6', borderWidth: size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px' }}></div>
               
          <div className="absolute inset-0 w-full h-full rounded-full border-t-gradient-to-r from-green-400 to-blue-500 border-l-transparent border-r-transparent border-b-transparent animate-[spin_4s_linear_infinite]" 
               style={{ borderTopColor: '#0ea5e9', borderWidth: size === 'sm' ? '2px' : size === 'md' ? '4px' : '6px' }}></div>
               
          {/* Inner gradient circle */}
          <div className="absolute inset-0 m-auto rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" 
               style={{ 
                 width: size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px',
                 height: size === 'sm' ? '4px' : size === 'md' ? '8px' : '12px',
                 transform: 'scale(0.85)' 
               }}></div>
        </div>
        
        {/* Text with enhanced gradient */}
        {size !== 'sm' && (
          <div className="text-center space-y-2">
            <h3 className={`${size === 'md' ? 'text-lg' : 'text-xl'} font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 drop-shadow-sm`}>{message}</h3>
            {size === 'lg' && <p className="text-gray-700 text-sm">Fetching your farm information...</p>}
          </div>
        )}
        
        {/* Enhanced animated dots */}
        {size === 'lg' && (
          <div className="flex space-x-2 mt-4">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 animate-bounce shadow-sm" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-bounce shadow-sm" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-bounce shadow-sm" style={{ animationDelay: "300ms" }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;