import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, Smartphone, Clock } from 'lucide-react';
import { getRepository } from '../../shared/data';
import { Conflict } from '@sanchay/core';
import { formatDateTime } from '../../shared/utils/date';

export const AdminConflictsView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  const loadConflicts = async () => {
    try {
      const list = await repo.getConflicts();
      setConflicts(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleResolve = async (conflictId: string, resolution: 'keep_both' | 'mark_duplicate') => {
    await repo.resolveConflict(conflictId, resolution);
    setSuccess(
      resolution === 'keep_both'
        ? 'Conflict marked resolved (both entries retained).'
        : 'Conflict resolved (duplicate flagged and reversed).'
    );
    loadConflicts();
    setTimeout(() => setSuccess(null), 3500);
  };

  const openConflicts = conflicts.filter((c) => c.status === 'open');

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:conflicts.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          {t('admin:conflicts.subtitle')}
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {openConflicts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-blue-200 p-8 sm:p-12 text-center space-y-3 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto border border-status-success-border">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-base text-navy-900">All Reconciled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t('admin:conflicts.noConflicts')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {openConflicts.map((conf) => (
            <div
              key={conf.id}
              className="bg-white rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-subtle space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                <div className="flex items-center gap-2 text-status-amber font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="capitalize">{conf.type.replace('_', ' ')} Detected</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Detected: {formatDateTime(conf.detectedAt)}
                </span>
              </div>

              {/* Side-by-Side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>First Device Entry</span>
                  </div>
                  <p className="font-mono text-navy-900">ID: {conf.refIds[0] || 'tx-contrib-01'}</p>
                  <p className="text-slate-500 text-[11px]">Recorded at 10:00 AM • Device DEV1</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Concurrent Offline Entry</span>
                  </div>
                  <p className="font-mono text-navy-900">ID: {conf.refIds[1] || 'tx-dup-01'}</p>
                  <p className="text-slate-500 text-[11px]">Recorded at 10:02 AM • Device DEV2</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 bg-blue-50 p-2.5 rounded-xl border border-blue-200/60">
                Notice: Sanchay's append-only design never deletes or overwrites data automatically. Please choose a committee resolution.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => handleResolve(conf.id, 'keep_both')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
                >
                  {t('admin:conflicts.keepBoth')}
                </button>
                <button
                  onClick={() => handleResolve(conf.id, 'mark_duplicate')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition"
                >
                  {t('admin:conflicts.markDuplicate')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminConflictsView;
