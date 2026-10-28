import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Coins,
  Check,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  Printer,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { LoanRequest, Loan, LoanScheduleInstallment, Receipt } from '@sanchay/core';
import { formatRupees } from '../../shared/utils/currency';
import { formatDate } from '../../shared/utils/date';
import { generatePdfReceipt } from '../../lib/pdfReceipt';

export const AdminLoansView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<{
    loanId: string;
    schedule: LoanScheduleInstallment[];
  } | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Post-approval confirmation & disbursement modal
  const [disbursementModal, setDisbursementModal] = useState<{
    req: LoanRequest;
    loanId: string;
    receiptNo: string;
    receipt?: Receipt;
    schedule: LoanScheduleInstallment[];
    showScheduleTable?: boolean;
  } | null>(null);

  const loadLoans = async () => {
    try {
      let reqs: LoanRequest[] = [];
      let members: import('@sanchay/core').Member[] = [];

      try {
        reqs = await repo.getAllLoanRequests();
      } catch (err) {
        console.warn('Could not load loan requests:', err);
      }

      try {
        members = await repo.getGroupMembers();
      } catch (err) {
        console.warn('Could not load group members:', err);
      }

      setRequests(reqs);

      // Collect active loans across members
      const activeList: Loan[] = [];
      for (const m of members) {
        try {
          const l = await repo.getActiveLoan(m.memberId);
          if (l) activeList.push(l);
        } catch {}
      }
      setActiveLoans(activeList);
    } catch (err) {
      console.error('Error loading loan data in AdminLoansView:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleApprove = async (req: LoanRequest) => {
    setApprovingId(req.id);
    setActionError(null);
    try {
      const res = await repo.decideLoan(req.id, 'approved');
      const loanId = res?.loanId || `loan-${req.id.slice(0, 8)}`;

      // Fetch or derive repayment schedule
      let schedule: LoanScheduleInstallment[] = [];
      try {
        schedule = await repo.getLoanSchedule(loanId);
      } catch {}

      const receipt = res?.receipt;
      const receiptNo =
        receipt?.receiptNo ||
        res?.receiptId ||
        `PRAG24-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-DEV1-${Math.floor(1000 + Math.random() * 9000)}`;

      // Open Post-Approval Disbursement & Receipt Inspection Modal
      setDisbursementModal({
        req,
        loanId,
        receiptNo,
        receipt,
        schedule,
        showScheduleTable: false,
      });

      setActionSuccess(`Loan request approved! Disbursed ${formatRupees(req.amountPaise)}.`);
      await loadLoans();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error('Failed to approve loan:', err);
      setActionError(err?.message || 'Failed to approve loan. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleDownloadReceipt = (data: {
    req?: LoanRequest;
    loan?: Loan;
    receiptNo?: string;
    receipt?: Receipt;
  }) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const memberId = data.req?.memberId || data.loan?.memberId || 'member';
    const amountPaise = data.req?.amountPaise || data.loan?.principal || 500000;
    const loanId = data.loan?.loanId || data.req?.id || 'loan';
    const receiptNo = data.receiptNo || data.receipt?.receiptNo || `RCPT-${loanId.slice(-6).toUpperCase()}`;

    generatePdfReceipt({
      receiptId: data.receipt?.receiptId || `rcpt-${loanId}`,
      groupId: data.req?.groupId || data.loan?.groupId || 'group-pragati-001',
      txId: data.receipt?.txId || `tx-${loanId}`,
      memberId,
      amountPaise,
      date: data.receipt?.date || todayStr,
      mode: data.receipt?.mode || 'bank',
      status: 'APPROVED',
      receiptNo,
      maskedId: data.receipt?.maskedId || 'XXXX-XXXX-1234',
      groupName: 'Pragati Mahila Bachat Gat',
      memberName: memberId,
    });
  };

  const handleReject = async (req: LoanRequest) => {
    const reason = prompt('Please enter reason for rejection:', 'Does not meet group criteria');
    if (reason) {
      setActionError(null);
      try {
        await repo.decideLoan(req.id, 'rejected', reason);
        setActionSuccess(`Loan request #${req.id} rejected.`);
        await loadLoans();
        setTimeout(() => setActionSuccess(null), 4000);
      } catch (err: any) {
        setActionError(err?.message || 'Failed to reject loan.');
      }
    }
  };

  const viewSchedule = async (loanId: string) => {
    if (selectedSchedule?.loanId === loanId) {
      setSelectedSchedule(null);
      return;
    }
    const sched = await repo.getLoanSchedule(loanId);
    setSelectedSchedule({ loanId, schedule: sched });
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const autoRejectedRequests = requests.filter((r) => r.status === 'auto_rejected');

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:loans.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Review loan requests against eligibility rules and inspect active amortizations
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error-border text-status-error text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Pending Loan Requests */}
      <div className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <h3 className="font-heading font-bold text-sm text-navy-900">
              {t('admin:loans.pendingRequests', { count: pendingRequests.length })}
            </h3>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">{t('admin:loans.noPending')}</p>
        ) : (
          <div className="divide-y divide-blue-100 space-y-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="pt-4 first:pt-0 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-bold text-navy-900">{req.memberId}</b>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-amber-bg text-status-amber border border-status-amber-border">
                        {req.installments} Months EMI
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Requested: {formatDate(req.createdAt)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 block">Requested Principal</span>
                    <b className="text-lg font-heading font-black text-blue-700">
                      {formatRupees(req.amountPaise)}
                    </b>
                  </div>
                </div>

                {/* Eligibility Snapshot Box */}
                {req.eligibilitySnapshot && (
                  <div
                    className={`p-3 rounded-2xl border text-xs ${
                      req.eligibilitySnapshot.eligible
                        ? 'bg-status-success-bg/40 border-status-success-border text-navy-900'
                        : 'bg-status-amber-bg/40 border-status-amber-border text-navy-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {req.eligibilitySnapshot.eligible ? (
                        <FileCheck2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>
                        Core Eligibility Check:{' '}
                        {req.eligibilitySnapshot.eligible ? 'QUALIFIED' : 'REQUIRES COMMITTEE OVERRIDE'}
                      </span>
                    </div>
                    {req.eligibilitySnapshot.reasons.length > 0 && (
                      <p className="text-[11px] text-slate-600">
                        Notes: {req.eligibilitySnapshot.reasons.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    disabled={approvingId !== null}
                    onClick={() => handleApprove(req)}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    {approvingId === req.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{approvingId === req.id ? 'Disbursing...' : t('admin:loans.decideApprove')}</span>
                  </button>

                  <button
                    disabled={approvingId !== null}
                    onClick={() => handleReject(req)}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold text-xs transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>{t('admin:loans.decideReject')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-Rejected & Ineligible Requests (Read-Only Audit Log) */}
      {autoRejectedRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-status-amber-border p-5 sm:p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-status-amber-border/40 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-amber" />
              <h3 className="font-heading font-bold text-sm text-navy-900">
                System Flagged / Ineligible Requests ({autoRejectedRequests.length})
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              Evaluated by Core Engine
            </span>
          </div>

          <div className="divide-y divide-status-amber-border/30 space-y-4">
            {autoRejectedRequests.map((req) => (
              <div key={req.id} className="pt-4 first:pt-0 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-sm font-bold text-navy-900">{req.memberId}</b>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-error-bg text-status-error border border-status-error-border">
                        Auto-Rejected
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {req.installments} Months EMI
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Applied: {formatDate(req.createdAt)}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block sm:text-right">Requested</span>
                    <b className="text-base font-heading font-bold text-navy-900">
                      {formatRupees(req.amountPaise)}
                    </b>
                  </div>
                </div>

                {/* System Reason */}
                <div className="p-3 rounded-2xl bg-status-amber-bg/40 border border-status-amber-border text-xs text-navy-900">
                  <span className="font-bold text-status-amber block mb-0.5">Ineligibility Reason:</span>
                  <p className="text-slate-700 leading-relaxed">
                    {req.rejectionReason || req.eligibilitySnapshot?.reasons?.join(' | ') || 'Did not meet group eligibility criteria.'}
                  </p>
                </div>

                {/* Non-Overridable Read-Only Tag */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                    <X className="w-3.5 h-3.5 text-status-error" />
                    <span>Decision Final • Non-Overridable</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Loans */}
      <div className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="font-heading font-bold text-sm text-navy-900">
            {t('admin:loans.activeLoans', { count: activeLoans.length })}
          </h3>
        </div>

        <div className="divide-y divide-blue-100">
          {activeLoans.map((loan) => (
            <div key={loan.loanId} className="py-3.5 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <b className="text-sm font-semibold text-navy-900">{loan.memberId}</b>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Loan ID: {loan.loanId} • Rate: {loan.rate}% annual reducing ({loan.installments} EMIs)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <b className="text-base font-heading font-bold text-navy-900">
                    {formatRupees(loan.principal)}
                  </b>
                  <button
                    onClick={() => handleDownloadReceipt({ loan })}
                    className="p-1.5 rounded-lg border border-green-200 hover:bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    title="Download Disbursement PDF Receipt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  <button
                    onClick={() => viewSchedule(loan.loanId)}
                    className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                  >
                    <span>Schedule</span>
                    {selectedSchedule?.loanId === loan.loanId ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Installment Schedule Accordion */}
              {selectedSchedule?.loanId === loan.loanId && (
                <div className="mt-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-200 text-xs animate-fade-in">
                  <h4 className="font-bold text-navy-900 mb-2">Amortization Schedule</h4>
                  <div className="divide-y divide-blue-200/60 font-mono text-[11px]">
                    <div className="grid grid-cols-4 py-1 text-slate-500 font-sans font-bold">
                      <span>#</span>
                      <span>Due Date</span>
                      <span>Interest</span>
                      <span className="text-right">Total EMI</span>
                    </div>
                    {selectedSchedule.schedule.map((inst) => (
                      <div key={inst.installmentNumber} className="grid grid-cols-4 py-1.5">
                        <span className="font-sans font-medium">Month {inst.installmentNumber}</span>
                        <span>{inst.dueDate}</span>
                        <span className="text-slate-600">{formatRupees(inst.interestPaise)}</span>
                        <b className="text-right text-navy-900">{formatRupees(inst.amountPaise)}</b>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Post-Approval Disbursement & Receipt Confirmation Modal */}
      {disbursementModal && (
        <div className="fixed inset-0 z-50 bg-navy-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-blue-100 space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-navy-900">
                    Loan Approved & Disbursed!
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Funds released and official receipt generated
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDisbursementModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Info Banner */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Borrower Member</span>
                <span className="font-bold text-navy-900">{disbursementModal.req.memberId}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Disbursed Principal</span>
                <span className="font-heading font-extrabold text-base text-blue-700">
                  {formatRupees(disbursementModal.req.amountPaise)}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Repayment Tenure</span>
                <span className="font-semibold text-navy-900">{disbursementModal.req.installments} Months EMI</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Assigned Loan ID</span>
                <span className="font-mono text-[11px] font-semibold text-slate-700">{disbursementModal.loanId}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-600">Official Receipt No</span>
                <span className="font-mono text-[11px] font-bold text-green-700">{disbursementModal.receiptNo}</span>
              </div>
            </div>

            {/* Immediate Actions */}
            <div className="space-y-2">
              <button
                onClick={() => handleDownloadReceipt(disbursementModal)}
                className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-elevated cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF Receipt</span>
              </button>

              <button
                onClick={() =>
                  setDisbursementModal({
                    ...disbursementModal,
                    showScheduleTable: !disbursementModal.showScheduleTable,
                  })
                }
                className="w-full py-2.5 px-4 rounded-2xl border border-blue-200 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {disbursementModal.showScheduleTable
                    ? 'Hide Repayment Schedule'
                    : `Inspect Repayment Schedule (${disbursementModal.schedule.length || disbursementModal.req.installments} EMIs)`}
                </span>
              </button>
            </div>

            {/* Schedule Table Preview inside modal */}
            {disbursementModal.showScheduleTable && disbursementModal.schedule.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 max-h-60 overflow-y-auto animate-fade-in">
                <div className="grid grid-cols-4 font-bold text-slate-500 text-[10px] uppercase pb-1 border-b border-slate-200">
                  <span>Month</span>
                  <span>Due Date</span>
                  <span>Interest</span>
                  <span className="text-right">Total EMI</span>
                </div>
                {disbursementModal.schedule.map((inst) => (
                  <div key={inst.installmentNumber} className="grid grid-cols-4 py-1 text-[11px] font-mono">
                    <span className="font-sans font-medium text-slate-700">Month {inst.installmentNumber}</span>
                    <span className="text-slate-600">{inst.dueDate}</span>
                    <span className="text-slate-500">{formatRupees(inst.interestPaise)}</span>
                    <b className="text-right text-navy-900">{formatRupees(inst.amountPaise)}</b>
                  </div>
                ))}
              </div>
            )}

            {/* Close / Done */}
            <div className="pt-2">
              <button
                onClick={() => setDisbursementModal(null)}
                className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
              >
                Done / Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoansView;
