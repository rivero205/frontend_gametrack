import React from 'react';

const Loader = ({ size = 'medium', message = 'Cargando...', className = '' }) => {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large'
  };

  return (
    <div className={`loader-container ${className}`}>
      <div className={`loader ${sizeClasses[size]}`}>
        <div className="loader-spinner"></div>
      </div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};

export default Loader;