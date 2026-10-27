import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RefreshCw, CloudOff, Clock } from 'lucide-react';
import { SyncState } from '../../data/repository';
import { cn } from '../../lib/utils';

interface SyncBadgeProps {
  state: SyncState;
  queueCount?: number;
  className?: string;
  onClick?: () => void;
}

export const SyncBadge: React.FC<SyncBadgeProps> = ({
  state,
  queueCount = 0,
  className,
  onClick,
}) => {
  const { t } = useTranslation();

  const configs = {
    synced: {
      icon: CheckCircle2,
      label: t('sync.synced', 'Synced'),
      styles: 'bg-status-success-bg text-status-success border-status-success-border',
      iconClass: 'text-status-success',
    },
    syncing: {
      icon: RefreshCw,
      label: t('sync.syncing', 'Syncing...'),
      styles: 'bg-status-amber-bg text-status-amber border-status-amber-border',
      iconClass: 'text-status-amber animate-spin',
    },
    offline: {
      icon: CloudOff,
      label: t('sync.offline', 'Offline Mode'),
      styles: 'bg-blue-100 text-slate-600 border-blue-200',
      iconClass: 'text-slate-600',
    },
    waiting: {
      icon: Clock,
      label: t('sync.waiting', { count: queueCount || 1, defaultValue: `${queueCount || 1} pending sync` }),
      styles: 'bg-status-amber-bg text-status-amber border-status-amber-border',
      iconClass: 'text-status-amber',
    },
  };

  const current = configs[state] || configs.synced;
  const Icon = current.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none',
        current.styles,
        className
      )}
      title="Tap to view synchronization status"
    >
      <Icon className={cn('w-3.5 h-3.5 shrink-0', current.iconClass)} />
      <span>{current.label}</span>
    </button>
  );
};
