import React from 'react';

const LoadingSpinner = ({ message = "Loading data..." }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-gray-50/90 to-green-50/80 z-30">
      <div className="relative flex flex-col items-center p-8 rounded-xl bg-white shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-green-200/60">
        {/* Animated gradient spinner rings */}
        <div className="relative w-28 h-28 mb-5">
          {/* Outer ring with gradient effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse opacity-30" style={{ padding: '5px' }}></div>
          
          {/* Spinning rings */}
          <div className="absolute inset-0 w-full h-full rounded-full border-[6px] border-t-transparent border-l-transparent border-r-transparent border-b-gradient-to-r from-green-500 to-blue-500 animate-spin" 
               style={{ borderBottomColor: '#22c55e' }}></div>
          
          <div className="absolute inset-0 w-full h-full rounded-full border-[6px] border-t-transparent border-l-transparent border-r-gradient-to-r from-green-500 to-blue-400 border-b-transparent animate-[spin_3s_linear_infinite]" 
               style={{ borderRightColor: '#3b82f6' }}></div>
               
          <div className="absolute inset-0 w-full h-full rounded-full border-[6px] border-t-gradient-to-r from-green-400 to-blue-500 border-l-transparent border-r-transparent border-b-transparent animate-[spin_4s_linear_infinite]" 
               style={{ borderTopColor: '#0ea5e9' }}></div>
               
          {/* Inner gradient circle */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" style={{ transform: 'scale(0.85)' }}></div>
        </div>
        
        {/* Text with enhanced gradient */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 drop-shadow-sm">{message}</h3>
          <p className="text-gray-700 text-sm">Fetching your farm information...</p>
        </div>
        
        {/* Enhanced animated dots */}
        <div className="flex space-x-2 mt-4">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 animate-bounce shadow-sm" style={{ animationDelay: "0ms" }}></div>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-bounce shadow-sm" style={{ animationDelay: "150ms" }}></div>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-bounce shadow-sm" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;