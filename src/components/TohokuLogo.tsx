import React, { useState } from 'react';

interface TohokuLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const TohokuLogo: React.FC<TohokuLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const [imgError, setImgError] = useState(false);

  // Height configurations
  const heightClass = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-14' : 'h-10';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {!imgError ? (
        <img
          src="https://lh3.googleusercontent.com/d/1EcQrfSBABt1KQYBvjbX7zm_v4WKSyljY"
          alt="TOHOKU SOLUTIONS"
          className={`${heightClass} w-auto object-contain`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* High-fidelity Vector SVG replica of TOHOKU SOLUTIONS with red wireframe globe */
        <div className="flex flex-col items-center select-none">
          {/* Red wireframe globe emblem */}
          <svg
            className={size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8'}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer circle */}
            <circle cx="50" cy="50" r="44" stroke="#DC2626" strokeWidth="5.5" fill="none" />
            {/* Latitudes */}
            <line x1="6" y1="50" x2="94" y2="50" stroke="#DC2626" strokeWidth="4.5" />
            <ellipse cx="50" cy="50" rx="43" ry="24" stroke="#DC2626" strokeWidth="4.5" fill="none" />
            <line x1="16" y1="28" x2="84" y2="28" stroke="#DC2626" strokeWidth="4" />
            <line x1="16" y1="72" x2="84" y2="72" stroke="#DC2626" strokeWidth="4" />
            {/* Longitudes */}
            <ellipse cx="50" cy="50" rx="24" ry="44" stroke="#DC2626" strokeWidth="4.5" fill="none" />
            <line x1="50" y1="6" x2="50" y2="94" stroke="#DC2626" strokeWidth="4.5" />
          </svg>

          {showText && (
            <span
              className={`font-black tracking-wider text-[#0A3D78] uppercase leading-none mt-1 ${
                size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-lg' : 'text-sm'
              }`}
              style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.08em' }}
            >
              TOHOKU SOLUTIONS
            </span>
          )}
        </div>
      )}
    </div>
  );
};
