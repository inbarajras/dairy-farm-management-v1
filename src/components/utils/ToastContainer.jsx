import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Toast from './Toast';

// Create a global toast state manager
let toastCount = 0;
const listeners = [];

// Helper to create a unique ID for each toast
const getUniqueId = () => {
  return `toast-${toastCount++}`;
};

// Global functions to show different toast types
export const toast = {
  show: (message, type = 'info', duration = 3000) => {
    const id = getUniqueId();
    listeners.forEach(listener => listener({
      id,
      message,
      type,
      duration
    }));
    return id;
  },
  success: (message, duration) => toast.show(message, 'success', duration),
  error: (message, duration) => toast.show(message, 'error', duration),
  warning: (message, duration) => toast.show(message, 'warning', duration),
  info: (message, duration) => toast.show(message, 'info', duration)
};

// Toast container component
const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(toast => {
    setToasts(prevToasts => [...prevToasts, toast]);
  }, []);

  const removeToast = useCallback(id => {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const index = listeners.indexOf(addToast);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [addToast]);

  if (!toasts.length) return null;

  return ReactDOM.createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map(t => (
        <Toast 
          key={t.id}
          id={t.id}
          message={t.message}
          type={t.type}
          duration={t.duration}
          onClose={removeToast}
        />
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;