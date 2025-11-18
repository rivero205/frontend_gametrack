import React, { useState, useCallback } from 'react';
import { ToastContext } from './ToastContext.js';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || 4000;
    
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove después de la duración especificada
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Métodos de conveniencia
  const success = useCallback((message, options) => addToast(message, 'success', options), [addToast]);
  const error = useCallback((message, options) => addToast(message, 'error', options), [addToast]);
  const warning = useCallback((message, options) => addToast(message, 'warning', options), [addToast]);
  const info = useCallback((message, options) => addToast(message, 'info', options), [addToast]);

  // Método para confirmación con Promise
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      
      const toast = {
        id,
        message,
        type: 'confirm',
        duration: 0, // No auto-remove
        onConfirm: () => {
          removeToast(id);
          resolve(true);
        },
        onCancel: () => {
          removeToast(id);
          resolve(false);
        },
        ...options
      };

      setToasts(prev => [...prev, toast]);
    });
  }, [removeToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
    confirm
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};