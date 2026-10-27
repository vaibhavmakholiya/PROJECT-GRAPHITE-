import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RotateCcw,
  FileText,
  Download,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatRupees } from '../lib/currency';
import { formatDate } from '../lib/date';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { generatePdfReceipt } from '../lib/pdfReceipt';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

export const TransactionsView: React.FC = () => {
  const { t } = useTranslation();
  const { member } = useAuth();
  const { transactions, receipts, reversedTxIds, loading } = useTransactions(member?.memberId);
  const [filter, setFilter] = useState<'all' | 'contribution' | 'loan'>('all');

  if (loading) return <DashboardSkeleton />;

  const filteredTxs = transactions.filter((tx) => {
    if (filter === 'contribution') return tx.type === 'contribution' || tx.type === 'reversal';
    if (filter === 'loan') return tx.type === 'loan_disbursement' || tx.type === 'loan_repayment';
    return true;
  });

  const handleDownloadReceiptForTx = (txId: string) => {
    const rcpt = receipts.find((r) => r.txId === txId);
    if (!rcpt || !member) return;
    generatePdfReceipt({
      ...rcpt,
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: member.name,
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Title & Filter Tabs */}
      <div>
        <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight mb-2">
          {t('transactions.title', 'Passbook Ledger')}
        </h1>

        <div className="flex gap-2">
          {[
            { id: 'all', label: t('transactions.filterAll', 'All Entries') },
            { id: 'contribution', label: t('transactions.filterSavings', 'Contributions') },
            { id: 'loan', label: t('transactions.filterLoans', 'Loans & Repayments') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filter === tab.id
                  ? 'border-blue-600 bg-blue-600 text-white shadow-subtle'
                  : 'border-blue-200 bg-white text-slate-600 hover:border-blue-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info Callout about Append-Only Invariant */}
      <div className="p-3 rounded-2xl bg-white border border-blue-200 shadow-subtle flex items-start gap-2.5 text-xs">
        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-slate-600 leading-relaxed">
          <strong className="text-navy-900 font-semibold">Immutable Ledger:</strong> Past entries are never deleted. Any accounting corrections are made via explicit reversal entries and replacement entries.
        </p>
      </div>

      {/* Transactions List */}
      {filteredTxs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('transactions.empty', 'No transactions found in this filter.')}
        />
      ) : (
        <div className="space-y-3">
          {filteredTxs.map((tx) => {
            const isReversed = reversedTxIds.has(tx.txId);
            const isReversal = tx.type === 'reversal';
            const hasReceipt = receipts.some((r) => r.txId === tx.txId);
            const isCorrectedEntry = tx.txId === 'tx-corr-01';

            return (
              <div
                key={tx.txId}
                className={`rounded-2xl border p-4 shadow-subtle transition-all bg-white ${
                  isReversal
                    ? 'border-status-error-border bg-status-error-bg/30'
                    : isReversed
                    ? 'border-blue-200 opacity-75'
                    : isCorrectedEntry
                    ? 'border-status-success-border bg-status-success-bg/30'
                    : 'border-blue-200'
                }`}
              >
                {/* Top Row: Type, Date, Badges */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-heading font-bold capitalize ${
                        isReversed ? 'line-through text-slate-600' : 'text-navy-900'
                      }`}
                    >
                      {tx.type.replace('_', ' ')}
                    </span>

                    {isReversal && (
                      <StatusBadge variant="reversal" label="Reversal Entry" />
                    )}
                    {isCorrectedEntry && (
                      <StatusBadge variant="corrected" label="Corrected Entry" />
                    )}
                    {isReversed && (
                      <span className="text-[10px] font-semibold text-status-error bg-status-error-bg px-2 py-0.5 rounded-full border border-status-error-border">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-heading font-extrabold text-sm ${
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
                </div>

                {/* Reversal / Correction Context Details */}
                {isReversed && (
                  <div className="p-2 mb-2 rounded-xl bg-blue-50 text-[11px] text-slate-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-status-error shrink-0" />
                    <span>Cancelled: Replaced by corrected entry tx-corr-01</span>
                  </div>
                )}

                {isReversal && tx.reason && (
                  <div className="p-2 mb-2 rounded-xl bg-status-error-bg text-[11px] text-status-error font-medium flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Reason: {tx.reason} (reverses {tx.reversesId})</span>
                  </div>
                )}

                {/* Bottom Metadata & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-blue-200/80 text-[11px] text-slate-600">
                  <div className="space-x-2">
                    <span>{formatDate(tx.clientTimestamp)}</span>
                    <span>•</span>
                    <span className="uppercase">{tx.mode}</span>
                    <span>•</span>
                    <span className="font-mono text-[10px]">{tx.txId}</span>
                  </div>

                  {hasReceipt && !isReversed && !isReversal && (
                    <button
                      type="button"
                      onClick={() => handleDownloadReceiptForTx(tx.txId)}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('transactions.receiptAction', 'Receipt')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransactionsView;
