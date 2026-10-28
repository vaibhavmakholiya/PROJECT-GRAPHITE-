import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  Coins,
  ArrowRight,
  Download,
  Megaphone,
  CheckCircle2,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { formatRupees } from '../lib/currency';
import { formatDate } from '../lib/date';
import { CommunityMotif } from '../components/common/CommunityMotif';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import { VoiceTellerButton } from '../components/common/VoiceTellerButton';
import { useAuth } from '../hooks/useAuth';
import { useBalance } from '../hooks/useBalance';
import { useLoans } from '../hooks/useLoans';
import { useTransactions } from '../hooks/useTransactions';
import { useAlerts } from '../hooks/useAlerts';
import { generatePdfReceipt } from '../lib/pdfReceipt';

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member } = useAuth();
  const { balance, loading: balanceLoading } = useBalance(member?.memberId);
  const { activeLoan, outstandingPaise, schedule, loading: loanLoading } = useLoans(member?.memberId);
  const { transactions, receipts, reversedTxIds, loading: txLoading } = useTransactions(member?.memberId);
  const { announcements } = useAlerts(member?.memberId);

  if (balanceLoading || loanLoading || txLoading) {
    return <DashboardSkeleton />;
  }

  const latestAnnouncement = announcements[0];
  const recentTransactions = transactions.slice(0, 3);
  const latestReceipt = receipts[receipts.length - 1];

  // Active loan calculations
  const totalPrincipal = activeLoan?.principal || 0;
  const totalRepaid = totalPrincipal - outstandingPaise;
  const progressPercent = totalPrincipal > 0 ? Math.min(100, Math.round((totalRepaid / totalPrincipal) * 100)) : 0;
  const nextInstallment = schedule.find((s) => s.installmentNumber === 2) || schedule[0];

  const handleDownloadLatestReceipt = () => {
    if (!latestReceipt || !member) return;
    generatePdfReceipt({
      ...latestReceipt,
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: member.name,
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* 1. Header Greeting & Group Tag */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
            {t('dashboard.greeting', { name: member?.name || 'Member' })}
          </h1>
          <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            {t('dashboard.groupTag', 'Pragati Mahila Bachat Gat')}
          </p>
        </div>
        <Link
          to="/profile"
          className="text-xs font-medium text-slate-600 hover:text-navy-900 bg-white border border-blue-200 px-2.5 py-1 rounded-xl shadow-subtle"
        >
          {member?.aadhaarLast4 ? `Aadhaar: •••• ${member.aadhaarLast4}` : 'Profile'}
        </Link>
      </div>

      {/* 2. Latest Announcement Banner (if any) */}
      {latestAnnouncement && (
        <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-subtle flex items-start gap-3 relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-status-amber-bg text-status-amber flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="font-heading font-bold text-xs text-navy-900 truncate">
              {latestAnnouncement.title}
            </h2>
            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
              {latestAnnouncement.body}
            </p>
          </div>
          <Link
            to="/alerts"
            className="text-[11px] font-semibold text-blue-600 shrink-0 hover:underline flex items-center"
          >
            {t('dashboard.viewAll', 'View')} →
          </Link>
        </div>
      )}

      {/* 3. Primary Balance Card with Community Motif Watermark */}
      <div className="relative rounded-2xl bg-white border border-blue-200 p-5 shadow-subtle overflow-hidden">
        <CommunityMotif className="absolute -right-6 -bottom-6 w-48 h-48 text-blue-600 pointer-events-none select-none" opacity={0.07} />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              {t('dashboard.totalSavings', 'Total Member Savings')}
            </span>
            <span className="text-[11px] font-semibold text-status-success bg-status-success-bg px-2 py-0.5 rounded-full border border-status-success-border">
              Active & Synced
            </span>
          </div>

          <div className="my-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-heading font-extrabold text-3xl text-navy-900 tracking-tight">
                {formatRupees(balance?.netSavingsPaise || 0)}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Total Contributions: {formatRupees(balance?.contributionPaise || 0)}
              </p>
            </div>

            <VoiceTellerButton
              mode="passbook"
              passbookData={{
                memberName: member?.name && member.name !== 'Member' ? member.name : 'दीदी',
                groupName: 'प्रगति महिला बचत गट',
                savingsPaise: balance?.netSavingsPaise || 0,
                loanOutstandingPaise: outstandingPaise || 0,
              }}
            />
          </div>

          {/* Monthly Contribution Status Pill */}
          <div className="pt-3 border-t border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-status-success font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('dashboard.monthlyPaid', { month: 'October 2026' })}</span>
            </div>
            <span className="text-slate-600 text-[11px]">Due: ₹500 on 5th Nov</span>
          </div>
        </div>
      </div>

      {/* 4. Active Loan Teaser Card */}
      {activeLoan ? (
        <div className="rounded-2xl bg-white border border-blue-200 p-4 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-status-amber" />
              {t('dashboard.activeLoan', 'Active Loan Repayment')}
            </span>
            <Link
              to="/loans"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>{t('dashboard.viewSchedule', 'EMI Schedule')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-600 block">Remaining Outstanding</span>
              <span className="font-heading font-bold text-lg text-navy-900">
                {formatRupees(outstandingPaise)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-600 block">Next Installment</span>
              <span className="font-heading font-semibold text-sm text-blue-600">
                {formatRupees(nextInstallment?.amountPaise || 51800)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-600 mb-1 font-medium">
              <span>Repaid: {formatRupees(totalRepaid)}</span>
              <span>Total: {formatRupees(totalPrincipal)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full bg-status-success rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-blue-200 p-4 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-xs text-navy-900">No Active Loans</h2>
              <p className="text-[11px] text-slate-600">You are eligible to borrow up to ₹7,500</p>
            </div>
          </div>
          <Link
            to="/loans/apply"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-subtle min-h-[36px] flex items-center"
          >
            Apply
          </Link>
        </div>
      )}

      {/* 5. Quick Actions Grid */}
      <div>
        <h2 className="font-heading font-semibold text-xs text-navy-900 uppercase tracking-wider mb-2">
          {t('dashboard.quickActions', 'Quick Actions')}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={handleDownloadLatestReceipt}
            className="p-3 rounded-2xl bg-white border border-blue-200 shadow-subtle flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-navy-900 leading-tight">
              {t('dashboard.downloadReceipt', 'Latest Receipt')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/loans/apply')}
            className="p-3 rounded-2xl bg-white border border-blue-200 shadow-subtle flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-navy-900 leading-tight">
              {t('dashboard.applyLoan', 'Apply for Loan')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/loans')}
            className="p-3 rounded-2xl bg-white border border-blue-200 shadow-subtle flex flex-col items-center justify-center text-center hover:border-blue-300 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-navy-900 leading-tight">
              {t('dashboard.viewSchedule', 'EMI Schedule')}
            </span>
          </button>
        </div>
      </div>

      {/* 6. Recent Passbook Entries */}
      <div className="rounded-2xl bg-white border border-blue-200 p-4 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-xs text-navy-900 uppercase tracking-wider">
            {t('dashboard.recentTransactions', 'Recent Passbook Entries')}
          </h2>
          <Link
            to="/transactions"
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
          >
            <span>{t('dashboard.viewAll', 'View all')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-blue-200">
          {recentTransactions.map((tx) => {
            const isReversed = reversedTxIds.has(tx.txId);
            const isReversal = tx.type === 'reversal';

            return (
              <div key={tx.txId} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isReversal
                        ? 'bg-status-error-bg text-status-error'
                        : tx.type === 'contribution'
                        ? 'bg-status-success-bg text-status-success'
                        : 'bg-status-amber-bg text-status-amber'
                    }`}
                  >
                    {isReversal ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : tx.type === 'contribution' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Coins className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-semibold block capitalize ${
                        isReversed ? 'line-through text-slate-600' : 'text-navy-900'
                      }`}
                    >
                      {tx.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {formatDate(tx.clientTimestamp)} • {tx.mode.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-heading font-bold block ${
                      isReversal
                        ? 'text-status-error'
                        : isReversed
                        ? 'line-through text-slate-600'
                        : 'text-navy-900'
                    }`}
                  >
                    {isReversal ? '-' : '+'}
                    {formatRupees(tx.amountPaise)}
                  </span>
                  {isReversed && (
                    <span className="text-[9px] text-status-error font-medium">Reversed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
