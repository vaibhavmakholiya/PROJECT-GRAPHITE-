import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'success' | 'pending' | 'error' | 'reversal' | 'corrected' | 'neutral';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, label, className }) => {
  const configs = {
    success: {
      icon: CheckCircle2,
      styles: 'bg-status-success-bg text-status-success border-status-success-border',
    },
    pending: {
      icon: Clock,
      styles: 'bg-status-amber-bg text-status-amber border-status-amber-border',
    },
    error: {
      icon: XCircle,
      styles: 'bg-status-error-bg text-status-error border-status-error-border',
    },
    reversal: {
      icon: RotateCcw,
      styles: 'bg-status-error-bg text-status-error border-status-error-border font-semibold',
    },
    corrected: {
      icon: CheckCircle2,
      styles: 'bg-status-success-bg text-status-success border-status-success-border',
    },
    neutral: {
      icon: AlertTriangle,
      styles: 'bg-blue-100 text-slate-600 border-blue-200',
    },
  };

  const current = configs[variant];
  const Icon = current.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        current.styles,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
