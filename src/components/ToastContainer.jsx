import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'confirm':
        return <AlertTriangle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getToastClass = (type) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'confirm':
        return 'toast-warning';
      default:
        return 'toast-info';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${getToastClass(toast.type)}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {getToastIcon(toast.type)}
            </div>
            
            <div className="toast-message">
              {toast.message}
            </div>

            {toast.type === 'confirm' ? (
              <div className="toast-actions">
                <button
                  className="toast-btn toast-btn-primary"
                  onClick={toast.onConfirm}
                >
                  Sí
                </button>
                <button
                  className="toast-btn toast-btn-secondary"
                  onClick={toast.onCancel}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;