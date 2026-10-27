import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name = '', size = 'md', className }) => {
  // Extract up to 2 initials safely
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      className={cn(
        'rounded-full bg-blue-600 text-white font-heading font-bold flex items-center justify-center select-none shadow-subtle shrink-0',
        sizeClasses[size],
        className
      )}
      aria-label={name}
    >
      {initials || 'M'}
    </div>
  );
};
