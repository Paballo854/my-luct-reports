import React from 'react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClass = {
    small: '1rem',
    medium: '2rem',
    large: '3rem'
  }[size];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh' 
    }}>
      <div 
        className="loading-spinner"
        style={{ width: sizeClass, height: sizeClass }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;