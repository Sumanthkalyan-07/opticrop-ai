import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const leafSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };

  return (
    <div className={`flex items-center justify-center font-display font-extrabold tracking-tight ${className}`}>
      <span className={`${sizeClasses[size]} text-emerald-800 dark:text-emerald-400 select-none`}>
        Optic
      </span>
      {/* Visual grain 🌾 replacement for the letter 'r' */}
      <span className="relative inline-flex items-center justify-center mx-[0.5px]">
        <span className={`${sizeClasses[size]} text-amber-500 font-extrabold select-none animate-pulse`}>🌾</span>
      </span>
      <span className={`${sizeClasses[size]} text-emerald-700 dark:text-emerald-300 select-none`}>
        op
      </span>
    </div>
  );
};
