import React, { useState } from 'react';
import originalLogo from '../assets/TS_logo.png';

interface TohokuLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Authentic Original Company Logo from TS_.png
 * Displayed directly without any modification or redraw, preserving all original details and text.
 */
export const TohokuLogo: React.FC<TohokuLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  // Height configurations preserving original aspect ratio (302 x 84)
  const heightClass =
    size === 'sm'
      ? 'h-6 sm:h-7'
      : size === 'lg'
      ? 'h-11 sm:h-12'
      : size === 'xl'
      ? 'h-16 sm:h-18'
      : 'h-8 sm:h-9';

  return (
    <div className={`inline-flex items-center justify-center shrink-0 bg-transparent ${className}`}>
      <img
        src={!imgError ? originalLogo : '/TS_logo.png'}
        alt="Logo"
        className={`${heightClass} w-auto object-contain select-none`}
        style={{ mixBlendMode: 'multiply' }}
        draggable={false}
        onError={() => setImgError(true)}
      />
    </div>
  );
};
