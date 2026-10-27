import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, FileText, Download, CheckCircle2 } from 'lucide-react';
import { formatRupees } from '../lib/currency';
import { formatDate } from '../lib/date';
import { useAuth } from '../hooks/useAuth';
import { useTransactions } from '../hooks/useTransactions';
import { generatePdfReceipt } from '../lib/pdfReceipt';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

export const ReceiptsListView: React.FC = () => {
  const { t } = useTranslation();
  const { member } = useAuth();
  const { receipts, loading } = useTransactions(member?.memberId);
  const [search, setSearch] = useState('');

  if (loading) return <DashboardSkeleton />;

  const filteredReceipts = receipts.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.receiptNo.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      r.txId.toLowerCase().includes(q)
    );
  });

  const handleDownload = (e: React.MouseEvent, rcpt: any) => {
    e.preventDefault();
    if (!member) return;
    generatePdfReceipt({
      ...rcpt,
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: member.name,
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div>
        <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight mb-2">
          {t('receipts.title', 'Digital Receipts')}
        </h1>

        {/* Search Bar */}
        <div className="flex items-center rounded-2xl border border-blue-200 bg-white px-3.5 py-2.5 shadow-subtle focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all">
          <Search className="w-4 h-4 text-slate-600 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('receipts.searchPlaceholder', 'Search by receipt # or date...')}
            className="w-full bg-transparent text-xs font-medium text-navy-900 outline-none placeholder:text-slate-600/70"
          />
        </div>
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('receipts.empty', 'No receipts found.')}
        />
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((rcpt) => (
            <Link
              key={rcpt.receiptId}
              to={`/receipts/${rcpt.receiptId}`}
              className="block rounded-2xl border border-blue-200 bg-white p-4 shadow-subtle hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-heading font-bold text-xs text-blue-600 block">
                    {rcpt.receiptNo}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {formatDate(rcpt.date)} • {rcpt.mode.toUpperCase()}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-success-bg text-status-success border border-status-success/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('receipts.approved', 'APPROVED')}
                </span>
              </div>

              <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 block">Amount Paid</span>
                  <span className="font-heading font-extrabold text-sm text-navy-900">
                    {formatRupees(rcpt.amountPaise)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDownload(e, rcpt)}
                  className="px-3 py-1.5 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiptsListView;
