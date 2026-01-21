import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  AlertTriangle
} from 'lucide-react';

// Toast types with their respective styles
const toastTypes = {
  success: {
    icon: <CheckCircle className="h-5 w-5 text-white" />,
    bgGradient: 'from-green-600 to-green-500',
    iconBg: 'bg-green-600',
    borderColor: 'border-green-400'
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-white" />,
    bgGradient: 'from-red-600 to-red-500',
    iconBg: 'bg-red-600',
    borderColor: 'border-red-400'
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-white" />,
    bgGradient: 'from-amber-600 to-amber-500',
    iconBg: 'bg-amber-600',
    borderColor: 'border-amber-400'
  },
  info: {
    icon: <Info className="h-5 w-5 text-white" />,
    bgGradient: 'from-blue-600 to-blue-500',
    iconBg: 'bg-blue-600',
    borderColor: 'border-blue-400'
  }
};

// Individual Toast component
const Toast = ({ id, message, type = 'info', onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose(id);
    }, 500); // Match this to the CSS exit animation duration
  };

  if (!visible) return null;

  const { icon, iconBg, borderColor } = toastTypes[type] || toastTypes.info;

  return (
    <div
      className={`flex items-center p-4 mb-3 bg-white shadow-lg rounded-lg border-l-4 ${borderColor} transform transition-all duration-500 ease-in-out ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}
      style={{ maxWidth: '380px' }}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mr-3`}>
        {icon}
      </div>
      <div className="flex-grow mr-2">
        <p className="text-sm font-medium text-gray-800">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <X className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
};

export default Toast;
