import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'sky'
  | 'success'
  | 'warning'
  | 'danger'
  | 'orange'
  | 'purple'
  | 'indigo'
  | 'teal'
  | 'pink'
  | 'outline'
  | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
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
    sky:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-semibold',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-semibold',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-semibold',
    orange:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800 font-semibold',
    danger:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 font-semibold',
    purple:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold',
    indigo:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-semibold',
    teal:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 font-semibold',
    pink:
      'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800 font-semibold',
    outline:
      'bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700 font-medium',
    slate:
      'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full transition-colors whitespace-nowrap shadow-2xs ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: string; size?: 'sm' | 'md'; showDot?: boolean }> = ({
  priority,
  size = 'sm',
  showDot = true,
}) => {
  switch (priority) {
    case 'Critical':
      return (
        <Badge variant="danger" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5 animate-pulse" />}
          Critical
        </Badge>
      );
    case 'Urgent':
      return (
        <Badge variant="orange" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mr-1.5" />}
          Urgent
        </Badge>
      );
    case 'High':
      return (
        <Badge variant="warning" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />}
          High
        </Badge>
      );
    case 'Normal':
      return (
        <Badge variant="sky" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />}
          Normal
        </Badge>
      );
    case 'Low':
    default:
      return (
        <Badge variant="teal" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5" />}
          Low
        </Badge>
      );
  }
};

export const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md'; showDot?: boolean }> = ({
  status,
  size = 'sm',
  showDot = true,
}) => {
  switch (status) {
    case 'Resolved':
      return (
        <Badge variant="success" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />}
          Resolved
        </Badge>
      );
    case 'Closed':
      return (
        <Badge variant="slate" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5" />}
          Closed
        </Badge>
      );
    case 'In Progress':
      return (
        <Badge variant="warning" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />}
          In Progress
        </Badge>
      );
    case 'Under Review':
      return (
        <Badge variant="indigo" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5" />}
          Under Review
        </Badge>
      );
    case 'Waiting for Response':
      return (
        <Badge variant="purple" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5" />}
          Waiting Response
        </Badge>
      );
    case 'On Hold':
      return (
        <Badge variant="danger" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />}
          On Hold
        </Badge>
      );
    case 'Open':
    case 'To Do':
    default:
      return (
        <Badge variant="sky" size={size}>
          {showDot && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5" />}
          {status || 'To Do'}
        </Badge>
      );
  }
};

export const CategoryBadge: React.FC<{ category: string; size?: 'sm' | 'md' }> = ({
  category,
  size = 'sm',
}) => {
  const cat = category || 'Task';
  switch (cat) {
    case 'Feature':
      return <Badge variant="purple" size={size}>{cat}</Badge>;
    case 'Improvement':
      return <Badge variant="teal" size={size}>{cat}</Badge>;
    case 'Bug':
      return <Badge variant="danger" size={size}>{cat}</Badge>;
    case 'UI/UX Design':
      return <Badge variant="pink" size={size}>{cat}</Badge>;
    case 'Operations':
      return <Badge variant="warning" size={size}>{cat}</Badge>;
    case 'Client Request':
      return <Badge variant="orange" size={size}>{cat}</Badge>;
    case 'Documentation':
      return <Badge variant="indigo" size={size}>{cat}</Badge>;
    case 'Technical Support':
      return <Badge variant="sky" size={size}>{cat}</Badge>;
    case 'Task':
    default:
      return <Badge variant="primary" size={size}>{cat}</Badge>;
  }
};
