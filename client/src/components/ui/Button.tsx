import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-2.5 text-base rounded-lg',
    icon: 'p-2 rounded-lg',
  }[size];

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow focus:ring-2 focus:ring-blue-500/20 active:bg-blue-800',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 active:bg-slate-300',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm active:bg-slate-100',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm active:bg-red-800',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200',
    link: 'bg-transparent text-blue-600 hover:underline p-0 h-auto',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none gap-2 outline-none ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};

