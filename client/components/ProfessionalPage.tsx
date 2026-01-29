import React from 'react';

interface ProfessionalPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
}

export function ProfessionalPage({
  title,
  description,
  children,
  headerAction,
  className = '',
}: ProfessionalPageProps) {
  return (
    <div className={`space-y-6 animate-fade-in-up ${className}`}>
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">
              {description}
            </p>
          )}
        </div>
        {headerAction && <div className="flex items-center gap-3">{headerAction}</div>}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  cols?: 'sm' | 'md' | 'lg';
}

export function StatGrid({ children, cols = 'md' }: StatGridProps) {
  const colClass = {
    sm: 'grid-cols-1 md:grid-cols-2',
    md: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    lg: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[cols];

  return <div className={`grid ${colClass} gap-6`}>{children}</div>;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
      {icon && <div className="mb-4 text-slate-400 dark:text-slate-500">{icon}</div>}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

interface MessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export function Message({ type, message, onClose }: MessageProps) {
  const typeClasses = {
    success:
      'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
    error:
      'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300',
    warning:
      'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300',
  };

  return (
    <div
      className={`p-4 rounded-xl border animate-slide-in-down flex items-start justify-between ${typeClasses[type]}`}
    >
      <span className="font-semibold text-sm">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg font-bold hover:opacity-70 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
