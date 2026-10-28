import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { generateSchedule } from '@sanchay/core';
import { formatRupees, rupeesToPaise } from '../lib/currency';
import { useAuth } from '../hooks/useAuth';
import { useLoans } from '../hooks/useLoans';
import { useBalance } from '../hooks/useBalance';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

export const ApplyLoanView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member, loading: authLoading } = useAuth();
  const { balance } = useBalance(member?.memberId);
  const { maxLimitPaise, submitLoan, activeLoan, loading: loansLoading } = useLoans(member?.memberId);

  // Maximum allowed loan amount: capped strictly by member's eligibility limit
  const maxAllowedRupees = Math.max(1000, Math.floor((maxLimitPaise || 600000) / 100));
  const [amountRupees, setAmountRupees] = useState<number>(Math.min(5000, maxAllowedRupees));
  const [installments, setInstallments] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync amountRupees if maxAllowedRupees changes
  useEffect(() => {
    if (amountRupees > maxAllowedRupees) {
      setAmountRupees(maxAllowedRupees);
    }
  }, [maxAllowedRupees]);

  // Live schedule preview calculated on-the-fly using @sanchay/core's pure engine
  const liveSchedule = useMemo(() => {
    const principalPaise = rupeesToPaise(amountRupees);
    return generateSchedule(
      principalPaise,
      12, // 12% reducing interest
      'reducing',
      installments,
      new Date().toISOString().slice(0, 10)
    );
  }, [amountRupees, installments]);

  const totalInterestPaise = useMemo(() => {
    return liveSchedule.reduce((sum: number, inst: { interestPaise: number }) => sum + inst.interestPaise, 0);
  }, [liveSchedule]);

  const estimatedMonthlyEmi = liveSchedule[0]?.amountPaise || 0;

  if (authLoading || loansLoading) return <DashboardSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.memberId) {
      setError('Member session is not ready. Please refresh or re-login.');
      return;
    }
    if (amountRupees > maxAllowedRupees) {
      setError(`Requested amount ₹${amountRupees.toLocaleString('en-IN')} exceeds your borrowing limit of ₹${maxAllowedRupees.toLocaleString('en-IN')}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitLoan(rupeesToPaise(amountRupees), installments);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit loan application. Please check your eligibility and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center space-y-4 animate-fade-in flex flex-col justify-between min-h-full">
        <div className="pt-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-status-success-bg text-status-success flex items-center justify-center mx-auto shadow-subtle">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-navy-900">
            Loan Request Submitted
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Your application for {formatRupees(rupeesToPaise(amountRupees))} has been registered and marked for review at the upcoming monthly meeting.
          </p>

          <div className="p-4 rounded-2xl bg-white border border-blue-200 text-xs text-left space-y-2.5 shadow-subtle">
            <div className="flex justify-between">
              <span className="text-slate-600">Requested Amount</span>
              <span className="font-bold text-navy-900">{formatRupees(rupeesToPaise(amountRupees))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Repayment Tenure</span>
              <span className="font-bold text-navy-900">{installments} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated Monthly EMI</span>
              <span className="font-bold text-blue-600">{formatRupees(estimatedMonthlyEmi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Status</span>
              <span className="font-semibold text-status-amber">Pending Admin Approval</span>
            </div>
          </div>
        </div>

        <div className="pb-6">
          <button
            type="button"
            onClick={() => navigate('/loans')}
            className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm shadow-elevated cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
          >
            Go to My Loans
          </button>
        </div>
      </div>
    );
  }

  // Check individual eligibility criteria
  const isActive = member?.status === 'active';
  const hasNoActiveLoan = !activeLoan || activeLoan.status === 'closed';
  const hasPaidAllDues = (balance?.contributionPaise || 0) >= 250000;
  const isOverallEligible = isActive && hasNoActiveLoan && hasPaidAllDues;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1 text-slate-600 hover:text-navy-900 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
          {t('applyLoan.title', 'Apply for Loan')}
        </h1>
      </div>

      {/* 1. Eligibility Checklist Card */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-xs text-navy-900 uppercase tracking-wider">
            {t('applyLoan.checklistTitle', 'Eligibility Criteria')}
          </h2>
          <span className="text-[11px] font-bold text-blue-600">
            Max Limit: {formatRupees(maxLimitPaise || 10000000)} (1 Lakh)
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50">
            <span className="text-navy-900 font-medium">1. Active Member in Good Standing</span>
            {isActive ? (
              <span className="text-status-success flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Passed
              </span>
            ) : (
              <span className="text-status-error flex items-center gap-1 font-semibold">
                <XCircle className="w-4 h-4" /> Pending
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50">
            <span className="text-navy-900 font-medium">2. Zero Outstanding Loans</span>
            {hasNoActiveLoan ? (
              <span className="text-status-success flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Passed
              </span>
            ) : (
              <span className="text-status-amber flex items-center gap-1 font-semibold">
                <Clock className="w-4 h-4" /> Active Loan Exists
              </span>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50">
            <span className="text-navy-900 font-medium">3. Monthly Dues Paid in Full</span>
            {hasPaidAllDues ? (
              <span className="text-status-success flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Passed
              </span>
            ) : (
              <span className="text-status-amber flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-4 h-4" /> 1 Due Missed (Aug)
              </span>
            )}
          </div>
        </div>

        {!isOverallEligible && (
          <div className="p-2.5 rounded-xl bg-status-amber-bg border border-status-amber-border text-[11px] text-status-amber flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Note: You currently have an active loan. You can still test submitting a new request or previewing the amortization schedule below for committee consideration.
            </span>
          </div>
        )}
      </div>

      {/* 2. Interactive Form & Live Amortization Calculator */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-200 bg-white p-5 shadow-subtle space-y-5">
        <h2 className="font-heading font-bold text-xs text-navy-900 uppercase tracking-wider">
          {t('applyLoan.formTitle', 'Loan Calculator & Application')}
        </h2>

        {/* Amount Slider & Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-navy-900">
              {t('applyLoan.amountLabel', 'Loan Amount')}
            </label>
            <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-xl px-2.5 py-1">
              <span className="text-xs font-bold text-blue-600">₹</span>
              <input
                type="number"
                min={1000}
                max={maxAllowedRupees}
                step={1000}
                value={amountRupees}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) {
                    setAmountRupees(Math.min(maxAllowedRupees, Math.max(0, val)));
                  }
                }}
                className="w-24 text-right font-heading font-extrabold text-base text-blue-600 bg-transparent focus:outline-none"
              />
            </div>
          </div>
          <input
            type="range"
            min={1000}
            max={maxAllowedRupees}
            step={1000}
            value={amountRupees}
            onChange={(e) => setAmountRupees(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-medium">
            <span>Min: ₹1,000</span>
            <span className="text-blue-600 font-semibold">Max: ₹{maxAllowedRupees.toLocaleString('en-IN')}</span>
          </div>

          {/* Quick preset chips filtered to valid bounds */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {[1000, 2000, 3000, 5000, 10000, 25000, 50000, 100000]
              .filter((preset) => preset <= maxAllowedRupees)
              .map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountRupees(preset)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium min-h-[32px] ${
                    amountRupees === preset
                      ? 'bg-blue-600 text-white font-bold shadow-subtle'
                      : 'bg-blue-50 text-navy-900 border border-blue-200 hover:border-blue-300'
                  }`}
                >
                  {formatRupees(preset * 100)}
                </button>
              ))}
          </div>
        </div>

        {/* Tenure Selection */}
        <div>
          <label className="block text-xs font-semibold text-navy-900 mb-1.5">
            {t('applyLoan.tenureLabel', 'Repayment Tenure')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[3, 6, 9, 12, 24, 36].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setInstallments(m)}
                className={`py-2 px-1 text-xs rounded-xl border text-center transition-all cursor-pointer min-h-[44px] ${
                  installments === m
                    ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-subtle'
                    : 'border-blue-200 bg-blue-50 text-navy-900 hover:border-blue-300'
                }`}
              >
                {m} Mo
              </button>
            ))}
          </div>
        </div>

        {/* Live Calculation Preview Card */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2 text-xs">
          <span className="text-[10px] font-heading font-semibold text-blue-600 uppercase tracking-wider block">
            {t('applyLoan.previewTitle', 'Repayment Schedule Preview (12% Reducing)')}
          </span>
          <div className="flex justify-between py-1 border-b border-blue-200">
            <span className="text-slate-600">{t('applyLoan.monthlyEmi', 'Estimated Monthly EMI')}</span>
            <span className="font-heading font-bold text-navy-900">{formatRupees(estimatedMonthlyEmi)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-blue-200">
            <span className="text-slate-600">{t('applyLoan.totalInterest', 'Total Interest Payable')}</span>
            <span className="font-heading font-semibold text-navy-900">{formatRupees(totalInterestPaise)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-600">Total Repayment</span>
            <span className="font-heading font-extrabold text-blue-600">
              {formatRupees(rupeesToPaise(amountRupees) + totalInterestPaise)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-status-error-bg border border-status-error-border text-status-error text-xs flex items-center gap-2 animate-fade-in font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Action (Fix 1: min-h-[48px], blue-600) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-elevated transition-colors cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
        >
          {isSubmitting ? (
            <span>Submitting...</span>
          ) : (
            <>
              <span>{t('applyLoan.submitApplication', 'Submit Loan Application')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ApplyLoanView;
