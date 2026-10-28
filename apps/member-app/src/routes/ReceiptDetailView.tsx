import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { formatRupees } from '../lib/currency';
import { formatDate } from '../lib/date';
import { useAuth } from '../hooks/useAuth';
import { getRepository } from '../shared/data';
import type { Receipt } from '@sanchay/core';
import { generatePdfReceipt } from '../lib/pdfReceipt';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';
import { VoiceTellerButton } from '../components/common/VoiceTellerButton';

export const ReceiptDetailView: React.FC = () => {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { member } = useAuth();
  const repo = getRepository();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!receiptId) return;
      const rcpt = await repo.getReceiptById(receiptId);
      setReceipt(rcpt);
      setLoading(false);
    }
    load();
  }, [receiptId, repo]);

  if (loading) return <DashboardSkeleton />;

  if (!receipt) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-slate-600 mb-4">Receipt not found.</p>
        <button
          type="button"
          onClick={() => navigate('/transactions')}
          className="min-h-[48px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-colors cursor-pointer"
        >
          Back to Passbook
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    if (!member) return;
    generatePdfReceipt({
      ...receipt,
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: member.name,
    });
  };

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-navy-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('common.back', 'Back')}</span>
        </button>
        <span className="text-xs font-heading font-semibold text-slate-600">
          Digital Receipt
        </span>
      </div>

      {/* Official Receipt Card Frame */}
      <div className="rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-elevated relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />

        {/* Header Branding */}
        <div className="text-center pt-2 pb-4 border-b border-blue-200">
          <div className="inline-block p-1 rounded-xl bg-white border border-blue-200 mb-1.5">
            <img src="/logo.png" alt="Sanchay" className="w-10 h-10 object-contain mx-auto" />
          </div>
          <h2 className="font-heading font-extrabold text-base text-navy-900 tracking-tight">
            SANCHAY COMMUNITY LEDGER
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Pragati Mahila Bachat Gat (PRAG)
          </p>
        </div>

        {/* Receipt Number & Approval Stamp */}
        <div className="flex items-center justify-between py-3.5 border-b border-blue-200">
          <div>
            <span className="text-[10px] text-slate-600 uppercase block font-semibold">Receipt Number</span>
            <span className="font-heading font-bold text-xs text-blue-600">
              {receipt.receiptNo}
            </span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-status-success-bg text-status-success border border-status-success/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('receipts.approved', 'APPROVED')}</span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="py-4 space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">Member Name</span>
            <span className="font-semibold text-navy-900">{member?.name}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">Aadhaar (Masked)</span>
            <span className="font-semibold text-navy-900">{receipt.maskedId}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">Date of Payment</span>
            <span className="font-semibold text-navy-900">{formatDate(receipt.date)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">Payment Mode</span>
            <span className="font-semibold text-navy-900 uppercase">{receipt.mode}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">Ledger Transaction ID</span>
            <span className="font-mono text-[11px] text-navy-900">{receipt.txId}</span>
          </div>
        </div>

        {/* Highlighted Amount Box */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center my-2">
          <span className="text-[11px] text-slate-600 font-medium block">
            TOTAL AMOUNT RECEIVED
          </span>
          <span className="font-heading font-extrabold text-2xl text-blue-600">
            {formatRupees(receipt.amountPaise)}
          </span>
        </div>

        {/* Verification Footer */}
        <div className="pt-4 border-t border-blue-200 text-center text-[10px] text-slate-600 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>Computer-generated offline receipt valid under Sanchay Community Bylaws</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <VoiceTellerButton
          mode="receipt"
          receiptData={{
            memberName: member?.name && member.name !== 'Member' ? member.name : 'दीदी',
            receiptNo: receipt.receiptNo,
            type: receipt.mode,
            amountPaise: receipt.amountPaise,
            date: receipt.date,
          }}
          className="w-full min-h-[48px] py-3.5 justify-center text-xs"
          size="lg"
        />

        <button
          type="button"
          onClick={handleDownload}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
        >
          <Download className="w-4 h-4" />
          <span>{t('receipts.downloadPdf', 'Download PDF Receipt')}</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-white border border-blue-200 hover:bg-blue-50 text-navy-900 font-heading font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  );
};

export default ReceiptDetailView;
