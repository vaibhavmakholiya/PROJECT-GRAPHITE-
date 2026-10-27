import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Search,
  Filter,
  X,
  ArrowRight,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { Transaction, TransactionType, PaymentMode } from '@sanchay/core';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../../shared/utils/currency';
import { formatDateTime } from '../../shared/utils/date';

export const AdminHistoryView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedTxForCorrection, setSelectedTxForCorrection] = useState<Transaction | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [correctedAmountRupees, setCorrectedAmountRupees] = useState('');
  const [correctedType, setCorrectedType] = useState<TransactionType>('contribution');
  const [correctedMode, setCorrectedMode] = useState<PaymentMode>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadLedger = async () => {
    const list = await repo.getAllTransactions();
    setTransactions(list);
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const openCorrectionModal = (tx: Transaction) => {
    setSelectedTxForCorrection(tx);
    setReversalReason('');
    setCorrectedAmountRupees(String(paiseToRupees(tx.amountPaise)));
    setCorrectedType(tx.type);
    setCorrectedMode(tx.mode);
  };

  const handleCorrectEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForCorrection) return;
    if (!reversalReason.trim()) {
      alert('A valid reason is strictly required to enact a reversal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountPaise = rupeesToPaise(Number(correctedAmountRupees));
      await repo.recordReversalAndCorrection(
        selectedTxForCorrection.txId,
        reversalReason.trim(),
        {
          amountPaise,
          type: correctedType,
          mode: correctedMode,
        }
      );

      setActionSuccess(
        `Entry #${selectedTxForCorrection.txId} reversed and replaced with corrected entry.`
      );
      setSelectedTxForCorrection(null);
      loadLedger();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Correction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.memberId.toLowerCase().includes(q) ||
        tx.txId.toLowerCase().includes(q) ||
        (tx.reason && tx.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
            {t('admin:history.title')}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-0.5">
            Rule 2: The ledger is append-only. Corrections generate reversal + corrected entry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, member, reason..."
              className="pl-9 pr-3 py-2 rounded-xl border border-blue-200 bg-white text-xs text-navy-900 placeholder:text-slate-400 outline-none focus:border-blue-600 w-full sm:w-60"
            />
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {['all', 'contribution', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'reversal'].map(
          (tOption) => (
            <button
              key={tOption}
              onClick={() => setFilterType(tOption)}
              className={`px-3 py-1.5 rounded-xl capitalize font-bold whitespace-nowrap transition ${
                filterType === tOption
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-blue-200 text-slate-600 hover:bg-blue-50'
              }`}
            >
              {tOption.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-3">
        <div className="divide-y divide-blue-100 text-xs">
          {filtered.map((tx) => {
            const isReversal = tx.type === 'reversal';
            const isNegative = tx.type === 'withdrawal' || tx.type === 'reversal';
            return (
              <div
                key={tx.txId}
                className={`py-3.5 px-3 rounded-2xl transition space-y-2 mb-1 ${
                  isReversal
                    ? 'bg-status-amber-bg/30 border border-status-amber-border/40'
                    : tx.reversesId
                    ? 'bg-blue-50/40'
                    : 'hover:bg-blue-50/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isReversal
                          ? 'bg-status-amber-bg text-status-amber border border-status-amber-border'
                          : tx.type === 'contribution'
                          ? 'bg-status-success-bg text-status-success'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isReversal ? 'R' : tx.type === 'contribution' ? '+' : '-'}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-navy-900 font-semibold">{tx.memberId}</b>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          {tx.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          {tx.mode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        TxID: {tx.txId} • {formatDateTime(tx.clientTimestamp)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
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

                    {!isReversal && (
                      <button
                        onClick={() => openCorrectionModal(tx)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition flex items-center gap-1"
                        title="Correct this entry with an explicit reversal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Correct</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Linked Reversal Notice */}
                {isReversal && (
                  <div className="text-[11px] text-status-amber bg-white p-2 rounded-xl border border-status-amber-border/60 flex items-start gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Reverses:</strong> {tx.reversesId} • <strong>Reason:</strong> {tx.reason}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reversal / Correction Modal */}
      {selectedTxForCorrection && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-card border border-blue-200 space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-blue-100">
              <div>
                <h3 className="font-heading font-bold text-sm text-navy-900">
                  {t('admin:history.editEntry')}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target: {selectedTxForCorrection.txId} ({formatRupees(selectedTxForCorrection.amountPaise)})
                </p>
              </div>
              <button
                onClick={() => setSelectedTxForCorrection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-navy-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCorrectEntry} className="space-y-4">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  {t('admin:history.reversalReason')}
                </label>
                <input
                  type="text"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="e.g. Overcharge correction, wrong amount entered"
                  className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 focus:border-blue-600 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">
                  Corrected Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={correctedAmountRupees}
                  onChange={(e) => setCorrectedAmountRupees(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-bold focus:border-blue-600 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Corrected Type</label>
                  <select
                    value={correctedType}
                    onChange={(e) => setCorrectedType(e.target.value as TransactionType)}
                    className="w-full py-2 px-2.5 rounded-xl border border-blue-200 text-navy-900 focus:border-blue-600 outline-none"
                  >
                    <option value="contribution">Contribution</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="loan_repayment">Loan Repayment</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-navy-900 mb-1">Payment Mode</label>
                  <select
                    value={correctedMode}
                    onChange={(e) => setCorrectedMode(e.target.value as PaymentMode)}
                    className="w-full py-2 px-2.5 rounded-xl border border-blue-200 text-navy-900 focus:border-blue-600 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary py-2.5 text-xs font-bold"
                >
                  {isSubmitting ? 'Recording...' : t('admin:history.submitCorrection')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTxForCorrection(null)}
                  className="btn-secondary py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistoryView;
