import React from 'react';

/**
 * TAEMRY FLUX Brand Logo
 * Styled after the user's provided TF circuit emblem on glossy teal squircle.
 */
export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeMap[size] || sizeMap.md} relative flex-shrink-0 rounded-2xl overflow-hidden shadow-sm transition-transform hover:scale-105`}
        title="TAEMRY FLUX"
      >
        <img
          src="/taemry-logo.svg"
          alt="TAEMRY FLUX Logo"
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-extrabold tracking-widest text-[#0a3a46] dark:text-white text-base leading-none uppercase transition-colors">
            TAEMRY
          </span>
          <span className="text-[10px] tracking-[0.25em] font-semibold text-[#0f766e] dark:text-[#38bdf8] uppercase transition-colors">
            FLUX
          </span>
        </div>
      )}
    </div>
  );
}
