import React from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  statusOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name = 'User',
  src,
  size = 'md',
  className = '',
  showStatus = false,
  statusOnline = true,
}) => {
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-14 h-14 text-base font-semibold',
  }[size];

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  }[size];

  // Colors based on initial hash
  const colors = [
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-teal-600',
  ];
  const charCode = name.charCodeAt(0) || 0;
  const bgColor = colors[charCode % colors.length];

  return (
    <div className="relative inline-block select-none">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover border border-slate-200 ${className}`}
        />
      ) : (
        <div
          className={`${sizeClasses} ${bgColor} text-white font-medium rounded-full flex items-center justify-center border border-white/20 shadow-sm ${className}`}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes} rounded-full ring-2 ring-white ${
            statusOnline ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
};

