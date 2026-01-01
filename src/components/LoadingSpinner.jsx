import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = "Loading data...", size = "default" }) => {
  // Size configurations
  const sizes = {
    small: { spinner: "w-8 h-8", container: "p-4", text: "text-sm", icon: 24 },
    default: { spinner: "w-16 h-16", container: "p-8", text: "text-base", icon: 48 },
    large: { spinner: "w-24 h-24", container: "p-10", text: "text-lg", icon: 64 }
  };

  const currentSize = sizes[size] || sizes.default;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className={`relative flex flex-col items-center ${currentSize.container} rounded-2xl bg-white shadow-2xl border border-gray-100`}>
        {/* Modern spinner with gradient */}
        <div className="relative mb-6">
          {/* Outer glow effect */}
          <div className={`absolute inset-0 ${currentSize.spinner} rounded-full bg-gradient-to-r from-green-400 via-blue-500 to-green-400 blur-xl opacity-30 animate-pulse`}></div>

          {/* Main spinner */}
          <div className="relative">
            <Loader2
              className={`${currentSize.spinner} text-transparent bg-clip-text bg-gradient-to-r from-green-500 via-blue-500 to-green-500 animate-spin`}
              style={{
                strokeWidth: 2.5,
                filter: 'drop-shadow(0 4px 6px rgba(34, 197, 94, 0.2))'
              }}
            />

            {/* Inner pulsing circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 animate-ping opacity-75"></div>
              <div className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
            </div>
          </div>
        </div>

        {/* Loading text with gradient */}
        <div className="text-center space-y-2">
          <h3 className={`${currentSize.text} font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-green-600 animate-gradient`}>
            {message}
          </h3>
          <p className="text-gray-500 text-xs font-medium tracking-wide">Please wait...</p>
        </div>

        {/* Animated progress dots */}
        <div className="flex space-x-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
              style={{
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-12px) scale(1.1);
            opacity: 1;
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
