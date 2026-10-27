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
} from 'lucide-react';
import { getRepository } from '../../shared/data';
import { LoanRequest, Loan, LoanScheduleInstallment } from '@sanchay/core';
import { formatRupees } from '../../shared/utils/currency';
import { formatDate } from '../../shared/utils/date';

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
  const [loading, setLoading] = useState(true);

  const loadLoans = async () => {
    try {
      const [reqs, members] = await Promise.all([
        repo.getAllLoanRequests(),
        repo.getGroupMembers(),
      ]);
      setRequests(reqs);

      // Collect active loans across members
      const activeList: Loan[] = [];
      for (const m of members) {
        const l = await repo.getActiveLoan(m.memberId);
        if (l) activeList.push(l);
      }
      setActiveLoans(activeList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const handleApprove = async (req: LoanRequest) => {
    await repo.decideLoan(req.id, 'approved');
    setActionSuccess(`Loan request #${req.id} approved. Disbursement & receipt created.`);
    loadLoans();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleReject = async (req: LoanRequest) => {
    const reason = prompt('Please enter reason for rejection:', 'Does not meet group criteria');
    if (reason) {
      await repo.decideLoan(req.id, 'rejected', reason);
      setActionSuccess(`Loan request #${req.id} rejected.`);
      loadLoans();
      setTimeout(() => setActionSuccess(null), 4000);
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

  return (
    <div className="space-y-6 animate-fade-in">
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
                    onClick={() => handleApprove(req)}
                    className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('admin:loans.decideApprove')}</span>
                  </button>

                  <button
                    onClick={() => handleReject(req)}
                    className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition"
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
                    onClick={() => viewSchedule(loan.loanId)}
                    className="p-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-semibold flex items-center gap-1"
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
    </div>
  );
};

export default AdminLoansView;
