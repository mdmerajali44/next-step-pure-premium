import React from 'react';

interface DoubleRingLoaderProps {
  text?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function DoubleRingLoader({
  text = 'ডেটা লোড হচ্ছে...',
  subtext = '',
  size = 'md',
  fullScreen = false,
}: DoubleRingLoaderProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const ringSizes = {
    sm: 'border-2',
    md: 'border-[3.5px]',
    lg: 'border-4',
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 bg-slate-950/90 backdrop-blur-md rounded-3xl border border-slate-800/80 shadow-2xl max-w-xs mx-auto animate-in fade-in duration-200">
      {/* Double Ring Animation Container */}
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        {/* Outer Ring Arc (Cyan #38bdf8 Top & Pink #f472b6 Bottom) */}
        <div
          className={`absolute inset-0 rounded-full ${ringSizes[size]} border-transparent border-t-[#38bdf8] border-b-[#f472b6] animate-spin`}
          style={{ animationDuration: '1s' }}
        />
        {/* Inner Ring Arc (Green #4ade80 Top & Yellow #facc15 Bottom) */}
        <div
          className={`absolute inset-2 rounded-full ${ringSizes[size]} border-transparent border-t-[#4ade80] border-b-[#facc15] animate-spin`}
          style={{ animationDuration: '0.75s', animationDirection: 'reverse' }}
        />
      </div>

      {(text || subtext) && (
        <div className="space-y-1">
          {text && <p className="text-sm font-extrabold text-slate-100 tracking-wide">{text}</p>}
          {subtext && <p className="text-[11px] font-semibold text-slate-400 leading-tight">{subtext}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
