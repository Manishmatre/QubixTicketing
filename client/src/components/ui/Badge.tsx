import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    default:
      'bg-slate-100 text-slate-700 border-slate-200/90 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium',
    primary:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 font-semibold',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-semibold',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold',
    outline:
      'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700 font-medium',
    slate:
      'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full transition-colors whitespace-nowrap ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string; size?: 'sm' | 'md' }> = ({
  priority,
  size = 'sm',
}) => {
  switch (priority) {
    case 'Critical':
      return <Badge variant="danger" size={size}>Critical</Badge>;
    case 'Urgent':
      return <Badge variant="danger" size={size}>Urgent</Badge>;
    case 'High':
      return <Badge variant="warning" size={size}>High</Badge>;
    case 'Normal':
      return <Badge variant="primary" size={size}>Normal</Badge>;
    case 'Low':
    default:
      return <Badge variant="default" size={size}>Low</Badge>;
  }
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  switch (status) {
    case 'Resolved':
    case 'Closed':
      return <Badge variant="success" size={size}>{status}</Badge>;
    case 'In Progress':
      return <Badge variant="primary" size={size}>{status}</Badge>;
    case 'Under Review':
      return <Badge variant="purple" size={size}>{status}</Badge>;
    case 'Waiting for Response':
    case 'On Hold':
      return <Badge variant="warning" size={size}>{status}</Badge>;
    case 'Open':
    case 'To Do':
    default:
      return <Badge variant="default" size={size}>{status}</Badge>;
  }
};

