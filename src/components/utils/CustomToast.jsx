import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast manager to handle multiple toasts
class ToastManager {
  constructor() {
    this.toasts = [];
    this.listeners = [];
    this.nextId = 1;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }

  add(message, type = 'info', duration = 4000) {
    const id = this.nextId++;
    const toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.notify();
    return id;
  }

  remove(id) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

const toastManager = new ToastManager();

// Toast API
export const toast = {
  success: (message, duration) => toastManager.add(message, 'success', duration),
  error: (message, duration) => toastManager.add(message, 'error', duration),
  warning: (message, duration) => toastManager.add(message, 'warning', duration),
  info: (message, duration) => toastManager.add(message, 'info', duration),
  show: (message, type, duration) => toastManager.add(message, type, duration)
};

// Individual Toast Component
const ToastItem = ({ id, message, type, duration, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
    }, 50);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      progressColor: 'bg-green-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      progressColor: 'bg-red-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
      progressColor: 'bg-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
      progressColor: 'bg-blue-500'
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, textColor, progressColor } = config[type] || config.info;

  return (
    <div
      className={`${bgColor} ${borderColor} border-l-4 rounded-r-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-out mb-3 ${
        isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'
      }`}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      <div className="p-4 flex items-start">
        <div className={`${iconColor} mr-3 flex-shrink-0`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={`${textColor} flex-1 text-sm font-medium break-words`}>
          {message}
        </div>
        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 rounded-full p-1 hover:bg-black hover:bg-opacity-10 transition-colors"
        >
          <X className={`h-4 w-4 ${iconColor}`} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 bg-opacity-50">
        <div
          className={`h-full ${progressColor} transition-all duration-50 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-end">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={toastManager.remove.bind(toastManager)}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ToastContainer;
