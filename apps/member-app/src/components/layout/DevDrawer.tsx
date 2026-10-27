import React from 'react';
import { X, Wrench, RefreshCw, CheckCircle2, Clock, CloudOff, AlertTriangle } from 'lucide-react';
import { SyncState } from '../../data/repository';
import { Member } from '@sanchay/core';

interface DevDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  syncState: SyncState;
  queueCount: number;
  onUpdateSyncState: (state: SyncState, queue?: number) => void;
  member: Member | null;
  onUpdateMemberStatus: (status: Member['status']) => void;
}

export const DevDrawer: React.FC<DevDrawerProps> = ({
  isOpen,
  onClose,
  syncState,
  queueCount,
  onUpdateSyncState,
  member,
  onUpdateMemberStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-blue-200 p-5 shadow-elevated animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-blue-200">
          <div className="flex items-center gap-2 text-navy-900">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-bold text-base">Development Simulator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-600 hover:bg-blue-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5 text-sm">
          {/* Section 1: Sync State Simulation */}
          <div>
            <label className="block font-heading font-semibold text-navy-900 text-xs uppercase tracking-wider mb-2">
              Simulate Synchronization State
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSyncState('synced', 0)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  syncState === 'synced'
                    ? 'border-status-success bg-status-success-bg text-status-success font-semibold shadow-subtle'
                    : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Synced</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSyncState('syncing', 1)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  syncState === 'syncing'
                    ? 'border-status-amber bg-status-amber-bg text-status-amber font-semibold shadow-subtle'
                    : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-300'
                }`}
              >
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
                <span>Syncing...</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSyncState('offline', 0)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  syncState === 'offline'
                    ? 'border-blue-300 text-slate-600 font-semibold bg-blue-100 shadow-subtle'
                    : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-300'
                }`}
              >
                <CloudOff className="w-4 h-4 shrink-0" />
                <span>Offline</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSyncState('waiting', 2)}
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  syncState === 'waiting'
                    ? 'border-status-amber bg-status-amber-bg text-status-amber font-semibold shadow-subtle'
                    : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-300'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>2 Pending Sync</span>
              </button>
            </div>
          </div>

          {/* Section 2: Member Status Simulation */}
          {member && (
            <div>
              <label className="block font-heading font-semibold text-navy-900 text-xs uppercase tracking-wider mb-2">
                Simulate Member Approval Lifecycle
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['active', 'pending', 'removed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateMemberStatus(st)}
                    className={`py-2 px-2 rounded-xl border text-xs font-medium text-center capitalize transition-all ${
                      member.status === st
                        ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-subtle'
                        : 'border-blue-200 bg-blue-50 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-600">
                Tip: Switching to &apos;pending&apos; simulates a newly registered member waiting for admin approval.
              </p>
            </div>
          )}

          {/* Section 3: Reset Local Diagnostics */}
          <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
            <span className="text-xs text-slate-600">Sanchay Dev Build v1.0</span>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset All Mock Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
