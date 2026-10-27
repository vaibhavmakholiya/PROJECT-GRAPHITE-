import { useState, useEffect, useCallback } from 'react';
import {
  type Loan,
  type LoanRequest,
  type EligibilityResult,
  type LoanScheduleInstallment,
  outstandingLoanBalance,
  maxLoanAmount,
} from '@sanchay/core';
import { mockRepository } from '../data/mockRepository';

export function useLoans(memberId?: string) {
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [schedule, setSchedule] = useState<LoanScheduleInstallment[]>([]);
  const [pendingRequest, setPendingRequest] = useState<LoanRequest | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [maxLimitPaise, setMaxLimitPaise] = useState<number>(0);
  const [outstandingPaise, setOutstandingPaise] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLoanData = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [loan, req, elig, bal, setts, txs] = await Promise.all([
        mockRepository.getActiveLoan(memberId),
        mockRepository.getPendingLoanRequest(memberId),
        mockRepository.checkLoanEligibility(memberId),
        mockRepository.getMemberBalance(memberId),
        mockRepository.getGroupSettings(),
        mockRepository.getTransactions(memberId),
      ]);

      setActiveLoan(loan);
      setPendingRequest(req);
      setEligibility(elig);

      const calculatedLimit = maxLoanAmount(bal, setts);
      const ceilingPaise = setts.maxLoanAmountPaise || 10000000;
      const limit = Math.max(ceilingPaise, calculatedLimit);
      setMaxLimitPaise(limit);

      if (loan) {
        const sched = await mockRepository.getLoanSchedule(loan.loanId);
        setSchedule(sched);
        const outstanding = outstandingLoanBalance(loan, txs);
        setOutstandingPaise(outstanding);
      } else {
        setSchedule([]);
        setOutstandingPaise(0);
      }
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const submitLoan = async (amountPaise: number, installments: number) => {
    if (!memberId) return;
    const result = await mockRepository.submitLoanRequest({
      memberId,
      amountPaise,
      installments,
    });
    setPendingRequest(result);
    await fetchLoanData();
    return result;
  };

  return {
    activeLoan,
    schedule,
    pendingRequest,
    eligibility,
    maxLimitPaise,
    outstandingPaise,
    loading,
    submitLoan,
    refreshLoans: fetchLoanData,
  };
}
