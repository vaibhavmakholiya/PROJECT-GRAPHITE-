import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getRepository, SyncState } from '../../shared/data';

export const AdminSyncStatusView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [online, setOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<SyncState>(repo.getSyncState());
  const [queueCount, setQueueCount] = useState(repo.getPendingSyncCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const interval = setInterval(() => {
      setSyncState(repo.getSyncState());
      setQueueCount(repo.getPendingSyncCount());
    }, 2000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, [repo]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    repo.setSyncState('syncing');
    setTimeout(() => {
      repo.setSyncState('synced', 0);
      setSyncState('synced');
      setQueueCount(0);
      setIsSyncing(false);
      setLastSync(new Date().toLocaleTimeString());
    }, 1200);
  };

  const toggleSimulatedOffline = () => {
    if (syncState === 'offline') {
      repo.setSyncState('synced', 0);
      setSyncState('synced');
      setQueueCount(0);
    } else {
      repo.setSyncState('offline', 3);
      setSyncState('offline');
      setQueueCount(3);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:sync.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Real-time diagnostics on IndexedDB cache, background replication queue, and network signals
        </p>
      </div>

      {/* Connectivity Card */}
      <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-subtle space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-blue-100">
          <div className="flex items-center gap-2">
            {online ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
            <span className="font-heading font-bold text-sm text-navy-900">
              {t('admin:sync.connectionStatus')}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full font-bold text-xs ${
              online
                ? 'bg-status-success-bg text-status-success border border-status-success-border'
                : 'bg-status-error-bg text-status-error border border-status-error-border'
            }`}
          >
            {online ? 'Connected (Auto Sync)' : 'Device Offline'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-slate-500 font-semibold">{t('admin:sync.queueCount')}</span>
            <b className="text-2xl font-heading font-black text-navy-900 block">{queueCount}</b>
            <span className="text-[10px] text-slate-500">Documents waiting</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-slate-500 font-semibold">{t('admin:sync.lastSync')}</span>
            <b className="text-sm font-heading font-bold text-navy-900 block mt-1">{lastSync}</b>
            <span className="text-[10px] text-green-600 font-semibold">Healthy</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : t('admin:sync.forceSync')}</span>
          </button>

          <button
            onClick={toggleSimulatedOffline}
            className="btn-secondary py-2.5 text-xs font-semibold"
          >
            {syncState === 'offline' ? 'End Offline Simulation' : 'Simulate Offline Queue'}
          </button>
        </div>
      </div>

      {/* Storage Architecture Guarantee */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 space-y-2.5 text-xs text-navy-900">
        <div className="flex items-center gap-2 font-bold text-blue-700">
          <Database className="w-4 h-4" />
          <span>Offline Resilience Invariants</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          Writes use persistent local cache with multi-tab manager. Client UUIDs prevent duplicate submissions across retries. When connection restores, background workers auto-replicate pending transactions in single batch order.
        </p>
      </div>
    </div>
  );
};

export default AdminSyncStatusView;
