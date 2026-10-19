import React from 'react';
import { Award, BookOpen, GraduationCap } from 'lucide-react';

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
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  const boxSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-base' : 'text-xs';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Sleek Modern Corporate Training Center Emblem */}
      <div
        className={`${boxSize} rounded-xl bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#0f172a] text-white flex items-center justify-center shadow-md shrink-0 border border-blue-400/30`}
      >
        <GraduationCap className={`${iconSize} text-blue-200`} />
      </div>

      {showText && (
        <div className="flex flex-col text-left select-none leading-none">
          <span
            className={`font-black tracking-wider text-[#0f172a] uppercase ${textSize}`}
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}
          >
            TRAINING CENTER
          </span>
          <span className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-widest mt-0.5">
            Academy & Development
          </span>
        </div>
      )}
    </div>
  );
};
