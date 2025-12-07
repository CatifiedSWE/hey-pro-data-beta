/** @format */

import React from 'react';

interface FlagProps {
  countryCode: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Flag component that uses CSS flag-icons library for cross-platform compatibility
 * Works on all operating systems including Windows, Linux, and macOS
 */
export const Flag: React.FC<FlagProps> = ({ countryCode, className = '', size = 'md' }) => {
  // Convert country code to lowercase for flag-icons library
  const flagClass = `fi fi-${countryCode.toLowerCase()}`;
  
  // Size mappings
  const sizeClasses = {
    sm: 'text-base',      // 16px
    md: 'text-2xl',       // 24px
    lg: 'text-4xl',       // 36px
    xl: 'text-5xl'        // 48px
  };
  
  return (
    <span 
      className={`${flagClass} ${sizeClasses[size]} ${className}`.trim()}
      style={{ lineHeight: 1 }}
      role="img"
      aria-label={`Flag of ${countryCode}`}
    />
  );
};

export default Flag;
