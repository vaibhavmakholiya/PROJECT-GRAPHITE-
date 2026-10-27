import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-blue-200 shadow-subtle',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-heading font-semibold text-navy-900 text-base mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 max-w-xs mb-4">{description}</p>}
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="min-h-[48px] px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-subtle cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
