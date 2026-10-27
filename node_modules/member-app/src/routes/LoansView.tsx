import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Coins,
  Clock,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { formatRupees } from '../lib/currency';
import { formatDate } from '../lib/date';
import { useAuth } from '../hooks/useAuth';
import { useLoans } from '../hooks/useLoans';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

export const LoansView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member } = useAuth();
  const { activeLoan, schedule, pendingRequest, outstandingPaise, loading } = useLoans(member?.memberId);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history'>('active');

  if (loading) return <DashboardSkeleton />;

  const totalPrincipal = activeLoan?.principal || 0;
  const totalRepaid = totalPrincipal - outstandingPaise;
  const progressPercent = totalPrincipal > 0 ? Math.min(100, Math.round((totalRepaid / totalPrincipal) * 100)) : 0;
  const paidCount = schedule.filter((s) => s.installmentNumber === 1).length;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header & Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
            {t('loans.title', 'My Loans')}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/loans/apply')}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-subtle flex items-center gap-1 cursor-pointer"
          >
            <span>{t('loans.applyButton', 'Apply for Loan')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-blue-200 pb-2">
          {[
            { id: 'active', label: t('loans.activeTab', 'Active Loan') },
            {
              id: 'pending',
              label: t('loans.pendingTab', 'Pending Request'),
              badge: pendingRequest ? '1' : undefined,
            },
            { id: 'history', label: t('loans.historyTab', 'History') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white border border-blue-200 text-blue-600 font-bold shadow-subtle'
                  : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-status-amber text-white text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Active Loan Details & Schedule */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeLoan ? (
            <>
              {/* Summary Card */}
              <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-subtle space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Active Loan ID: {activeLoan.loanId}
                    </span>
                    <span className="font-heading font-extrabold text-2xl text-navy-900">
                      {formatRupees(outstandingPaise)}
                    </span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      Remaining Outstanding Balance
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-success-bg text-status-success border border-status-success-border">
                    Active
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-navy-900 font-medium">
                    <span>
                      {t('loans.installmentsPaid', {
                        paid: paidCount,
                        total: activeLoan.installments,
                        defaultValue: `Paid ${paidCount} of ${activeLoan.installments} installments`,
                      })}
                    </span>
                    <span className="font-bold text-blue-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-status-success rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Terms Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-blue-200 text-center">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <span className="text-[10px] text-slate-600 block font-semibold">Principal</span>
                    <span className="font-heading font-bold text-xs text-navy-900">
                      {formatRupees(activeLoan.principal)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50">
                    <span className="text-[10px] text-slate-600 block font-semibold">Rate & Method</span>
                    <span className="font-heading font-bold text-xs text-navy-900">
                      {activeLoan.rate}% Reducing
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50">
                    <span className="text-[10px] text-slate-600 block font-semibold">Start Date</span>
                    <span className="font-heading font-bold text-xs text-navy-900">
                      {formatDate(activeLoan.startDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Installment Schedule Table */}
              <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-bold text-xs text-navy-900 uppercase tracking-wider">
                    {t('loans.scheduleTitle', 'Amortized Installment Schedule')}
                  </h2>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Due 5th of each month
                  </span>
                </div>

                <div className="divide-y divide-blue-200 text-xs">
                  {schedule.map((inst) => {
                    const isPaid = inst.installmentNumber === 1;
                    const isNext = inst.installmentNumber === 2;

                    return (
                      <div
                        key={inst.installmentNumber}
                        className={`py-3 first:pt-1 last:pb-1 flex items-center justify-between ${
                          isNext ? 'bg-status-amber-bg/30 -mx-4 px-4 rounded-xl border border-status-amber-border/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-xs ${
                              isPaid
                                ? 'bg-status-success-bg text-status-success'
                                : isNext
                                ? 'bg-status-amber-bg text-status-amber border border-status-amber'
                                : 'bg-blue-100 text-slate-600'
                            }`}
                          >
                            {inst.installmentNumber}
                          </div>
                          <div>
                            <span className="font-semibold text-navy-900 block">
                              {formatDate(inst.dueDate)}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              P: {formatRupees(inst.principalPaise)} • I: {formatRupees(inst.interestPaise)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-heading font-extrabold text-xs text-navy-900 block">
                            {formatRupees(inst.amountPaise)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${
                              isPaid
                                ? 'text-status-success'
                                : isNext
                                ? 'text-status-amber font-bold'
                                : 'text-slate-600'
                            }`}
                          >
                            {isPaid ? 'PAID' : isNext ? 'NEXT DUE' : 'UPCOMING'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Coins}
              title="No active loan at present"
              description="You can check your borrowing limit and apply for a community loan anytime."
              actionText="Apply for Loan"
              onAction={() => navigate('/loans/apply')}
            />
          )}
        </div>
      )}

      {/* Tab 2: Pending Loan Request */}
      {activeTab === 'pending' && (
        <div>
          {pendingRequest ? (
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-status-amber-bg text-status-amber border border-status-amber-border flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Admin Approval</span>
                </span>
                <span className="text-[11px] text-slate-600">
                  ID: {pendingRequest.id}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-600 block">Requested Loan Amount</span>
                <span className="font-heading font-extrabold text-2xl text-navy-900">
                  {formatRupees(pendingRequest.amountPaise)}
                </span>
                <span className="text-xs text-slate-600 block mt-0.5">
                  Tenure: {pendingRequest.installments} Months
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Application Date</span>
                  <span className="font-semibold text-navy-900">{formatDate(pendingRequest.createdAt)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Status</span>
                  <span className="font-semibold text-status-amber">Under Committee Review</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Decision Window</span>
                  <span className="font-semibold text-navy-900">Next Monthly Meeting (5th Nov)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your loan request has been recorded in the offline register. The SHG committee will review this during the monthly agenda.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No pending loan requests"
              description="Submit a new request from the Apply tab when needed."
              actionText="Apply for Loan"
              onAction={() => navigate('/loans/apply')}
            />
          )}
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <EmptyState
          icon={FileText}
          title="No closed past loans"
          description="Completed loan contracts and settlement certificates will appear here once finalized."
        />
      )}
    </div>
  );
};

export default LoansView;
