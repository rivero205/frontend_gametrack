import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ 
  title = 'Ha ocurrido un error', 
  message, 
  onRetry, 
  className = '' 
}) => {
  return (
    <div className={`error-container ${className}`}>
      <div className="error-content">
        <AlertCircle className="error-icon" size={24} />
        <div className="error-text">
          <h3 className="error-title">{title}</h3>
          {message && <p className="error-message">{message}</p>}
        </div>
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            <RefreshCw size={16} />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;