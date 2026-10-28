import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Coins,
  PlusCircle,
  History,
  ChevronRight,
  Users,
  Clock,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { formatRupees } from '../../shared/utils/currency';
import { formatDateTime } from '../../shared/utils/date';
import { Transaction, GroupBalanceSummary } from '@sanchay/core';

export const AdminDashboardView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [summary, setSummary] = useState<GroupBalanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingCount, setPendingCount] = useState(repo.getPendingSyncCount());
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [adminName, setAdminName] = useState<string>('Admin');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [currentAdmin, sum, txs, pendingMems] = await Promise.all([
        repo.getCurrentMember(),
        repo.getGroupSummary(),
        repo.getAllTransactions(),
        repo.getPendingMembers(),
      ]);
      if (currentAdmin?.name) {
        setAdminName(currentAdmin.name);
      }
      setSummary(sum);
      setTransactions(txs);
      setPendingCount(repo.getPendingSyncCount());
      setPendingMembersCount(pendingMems?.length || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalPaise = summary?.totalSavingsPaise || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
            {t('admin:dashboard.welcome', { name: adminName })}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            {t('admin:dashboard.autoSyncActive')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Pragati Mahila Bachat Gat
          </span>
        </div>
      </div>

      {/* New Member Registration Request Alert Banner */}
      {pendingMembersCount > 0 && (
        <Link
          to="/admin/members?tab=pending"
          className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-100/60 border border-amber-300 text-amber-950 flex items-center justify-between hover:shadow-card hover:border-amber-400 transition group animate-fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>{pendingMembersCount} Member Approval {pendingMembersCount === 1 ? 'Request' : 'Requests'} Generated</span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-400 text-navy-900">
                  ACTION REQUIRED
                </span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                New member{pendingMembersCount > 1 ? 's' : ''} signed up with Aadhaar OCR awaiting your approval
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 group-hover:underline flex items-center gap-1 shrink-0 ml-2">
            Review & Approve <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      )}

      {/* Hero Stats Card */}
      <div className="bg-gradient-to-br from-navy-900 via-blue-900 to-blue-700 rounded-3xl p-6 sm:p-7 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-blue-200 tracking-wide uppercase">
              {t('admin:dashboard.groupTotal')}
            </span>
            <div className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white">
              {formatRupees(totalPaise)}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 text-xs">
              <div className="border-l-2 border-blue-400/40 pl-3">
                <span className="text-blue-200 block text-[11px]">{t('admin:dashboard.contributions')}</span>
                <b className="text-white text-sm font-semibold">{formatRupees(summary?.totalContributionsPaise || 0)}</b>
              </div>
              <div className="border-l-2 border-blue-400/40 pl-3">
                <span className="text-blue-200 block text-[11px]">{t('admin:dashboard.withdrawals')}</span>
                <b className="text-white text-sm font-semibold">{formatRupees(summary?.totalWithdrawalsPaise || 0)}</b>
              </div>
              <div className="border-l-2 border-blue-400/40 pl-3">
                <span className="text-blue-200 block text-[11px]">{t('admin:dashboard.loansDisbursed')}</span>
                <b className="text-white text-sm font-semibold">{formatRupees(summary?.totalLoansDisbursedPaise || 0)}</b>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[140px] shrink-0">
            <span className="text-[11px] font-semibold text-blue-100 block">
              {t('admin:dashboard.pendingOffline')}
            </span>
            <span className="text-2xl font-heading font-black block mt-1">{pendingCount}</span>
            <span className="text-[10px] text-blue-200 mt-1 block">
              {pendingCount > 0 ? 'Auto Syncing...' : t('admin:dashboard.allSynced')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          {t('admin:dashboard.quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/admin/add?type=contribution"
            className="p-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-card transition flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">{t('admin:dashboard.addContribution')}</p>
              <p className="text-[11px] text-slate-500">Savings Deposit</p>
            </div>
          </Link>

          <Link
            to="/admin/add?type=withdrawal"
            className="p-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-card transition flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">{t('admin:dashboard.addWithdrawal')}</p>
              <p className="text-[11px] text-slate-500">Savings Release</p>
            </div>
          </Link>

          <Link
            to="/admin/loans"
            className="p-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-card transition flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">{t('admin:dashboard.addLoan')}</p>
              <p className="text-[11px] text-slate-500">Review & Issue</p>
            </div>
          </Link>

          <Link
            to="/admin/history"
            className="p-4 rounded-2xl bg-white border border-blue-200 hover:border-blue-400 hover:shadow-card transition flex flex-col justify-between group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy-900">{t('admin:dashboard.viewLedger')}</p>
              <p className="text-[11px] text-slate-500">Full Audit Log</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Ledger Activity */}
      <div className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-navy-900">
              {t('admin:dashboard.recentActivity')}
            </h3>
            <p className="text-xs text-slate-500">Double-entry audit trail</p>
          </div>
          <Link
            to="/admin/history"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-blue-100 text-xs">
          {transactions.slice(0, 6).map((tx) => {
            const isReversal = tx.type === 'reversal';
            const isNegative = tx.type === 'withdrawal' || tx.type === 'reversal';
            return (
              <div
                key={tx.txId}
                className="py-3 flex items-center justify-between gap-3 hover:bg-blue-50/50 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isReversal
                        ? 'bg-status-amber-bg text-status-amber border border-status-amber-border'
                        : tx.type === 'contribution'
                        ? 'bg-status-success-bg text-status-success'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isReversal ? 'REV' : tx.type === 'contribution' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-navy-900 font-semibold">{tx.memberId}</b>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {tx.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {formatDateTime(tx.clientTimestamp)}
                      {tx.reason ? ` • ${tx.reason}` : ''}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <b
                    className={`text-sm font-bold font-mono ${
                      isReversal
                        ? 'text-status-amber'
                        : isNegative
                        ? 'text-status-error'
                        : 'text-status-success'
                    }`}
                  >
                    {isNegative ? '-' : '+'}
                    {formatRupees(tx.amountPaise)}
                  </b>
                  <div className="text-[10px] text-green-600 font-semibold flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span>Synced</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardView;
