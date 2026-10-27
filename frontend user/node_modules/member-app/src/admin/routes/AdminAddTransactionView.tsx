import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowRight,
  Printer,
  Sparkles,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { Member, Transaction, Receipt, TransactionType, PaymentMode } from '@sanchay/core';
import { rupeesToPaise, formatRupees } from '../../shared/utils/currency';
import { generatePdfReceipt } from '../../shared/utils/pdfReceipt';

export const AdminAddTransactionView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const repo = getRepository();

  const preselectedType = (searchParams.get('type') as TransactionType) || 'contribution';

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [type, setType] = useState<TransactionType>(preselectedType);
  const [amountRupees, setAmountRupees] = useState('500');
  const [mode, setMode] = useState<PaymentMode>('cash');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [createdEntry, setCreatedEntry] = useState<{
    transaction: Transaction;
    receipt: Receipt;
  } | null>(null);

  useEffect(() => {
    repo.getGroupMembers().then((list) => {
      setMembers(list);
      if (list.length > 0 && !selectedMemberId) {
        // Default to a non-admin member like Meena
        const defaultMember = list.find((m) => m.role === 'member') || list[0];
        setSelectedMemberId(defaultMember.memberId);
        setAadhaarLast4(defaultMember.aadhaarLast4);
      }
    });
  }, [repo]);

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find((x) => x.memberId === id);
    if (m) {
      setAadhaarLast4(m.aadhaarLast4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(amountRupees);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (!selectedMemberId) {
      setError('Please select a member.');
      return;
    }

    setIsSubmitting(true);
    try {
      const amountPaise = rupeesToPaise(amount);
      const result = await repo.recordTransactionWithReceipt({
        memberId: selectedMemberId,
        type,
        amountPaise,
        mode,
        aadhaarLast4,
        reason: reason.trim() || undefined,
      });

      setCreatedEntry(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to record transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPdf = () => {
    if (!createdEntry) return;
    const m = members.find((x) => x.memberId === createdEntry.transaction.memberId);
    generatePdfReceipt({
      ...createdEntry.receipt,
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: m?.name || 'Member',
    });
  };

  const handleReset = () => {
    setCreatedEntry(null);
    setReason('');
    setAmountRupees('500');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:add.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Atomic single-batch entry: creates immutable transaction & verifiable receipt
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {createdEntry ? (
        /* Success & Receipt Card */
        <div className="bg-white rounded-3xl border border-green-200 p-6 sm:p-8 shadow-card space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto border border-status-success-border">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-bold text-navy-900">
              {t('admin:add.success')}
            </h2>
            <p className="text-xs text-slate-500">
              Transaction ID: <span className="font-mono text-navy-900">{createdEntry.transaction.txId}</span>
            </p>
          </div>

          <div className="bg-blue-50/60 rounded-2xl border border-blue-200 p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-blue-200">
              <span className="text-slate-500">{t('admin:receipts.receiptNo', 'Receipt Number')}</span>
              <b className="font-mono text-sm text-blue-700">{createdEntry.receipt.receiptNo}</b>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Member</span>
              <b className="text-navy-900">
                {members.find((m) => m.memberId === createdEntry.transaction.memberId)?.name}
              </b>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Aadhaar Last 4</span>
              <span className="font-mono">XXXX-XXXX-{createdEntry.receipt.maskedId.slice(-4)}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Type</span>
              <span className="capitalize font-bold text-blue-700">{createdEntry.transaction.type}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Payment Mode</span>
              <span className="uppercase font-semibold">{createdEntry.transaction.mode}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
              <span className="text-sm font-bold text-navy-900">Amount Received</span>
              <b className="text-xl font-heading font-black text-blue-700">
                {formatRupees(createdEntry.transaction.amountPaise)}
              </b>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePrintPdf}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Download & Print PDF</span>
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Another Entry</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-subtle space-y-5 text-xs"
        >
          {/* Member Picker */}
          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:add.selectMember')}
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full py-3 px-3.5 rounded-xl border border-blue-200 bg-white text-navy-900 font-medium focus:border-blue-600 outline-none shadow-2xs"
              required
            >
              {members.map((m) => (
                <option key={m.memberId} value={m.memberId}>
                  {m.name} ({m.phone}) — XXXX-{m.aadhaarLast4}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:add.typeLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['contribution', 'withdrawal', 'loan_repayment'] as TransactionType[]).map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => setType(tType)}
                  className={`py-2.5 px-3 rounded-xl border font-bold capitalize transition text-center ${
                    type === tType
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-blue-200 text-slate-600 hover:bg-blue-50'
                  }`}
                >
                  {tType.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-navy-900 mb-1.5">
                {t('admin:add.amountLabel')}
              </label>
              <div className="flex items-center rounded-xl border border-blue-200 bg-white overflow-hidden focus-within:border-blue-600 shadow-2xs">
                <span className="px-3.5 py-2.5 bg-blue-50 text-blue-700 font-bold border-r border-blue-200 select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  placeholder="500"
                  className="w-full px-3.5 py-2.5 text-navy-900 font-bold text-sm outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1.5">
                {t('admin:add.modeLabel')}
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as PaymentMode)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-blue-200 bg-white text-navy-900 font-medium focus:border-blue-600 outline-none shadow-2xs"
              >
                <option value="cash">{t('admin:add.cash')}</option>
                <option value="upi">{t('admin:add.upi')}</option>
                <option value="bank">{t('admin:add.bank')}</option>
              </select>
            </div>
          </div>

          {/* Aadhaar Last 4 */}
          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:add.aadhaarLast4')}
            </label>
            <input
              type="text"
              maxLength={4}
              value={aadhaarLast4}
              onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              className="w-full sm:w-48 py-2.5 px-3.5 rounded-xl border border-blue-200 bg-white text-navy-900 font-mono tracking-widest text-center font-bold focus:border-blue-600 outline-none"
              required
            />
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block font-semibold text-navy-900 mb-1.5">
              {t('admin:add.reasonLabel')} (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. October monthly savings"
              className="w-full py-2.5 px-3.5 rounded-xl border border-blue-200 bg-white text-navy-900 font-medium focus:border-blue-600 outline-none shadow-2xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary flex items-center justify-center gap-2 pt-3"
          >
            <span>{isSubmitting ? t('admin:add.saving') : t('admin:add.saveEntry')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default AdminAddTransactionView;
