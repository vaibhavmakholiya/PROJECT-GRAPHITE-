import { describe, it, expect } from 'vitest';
import {
  outstandingLoanBalance,
  Loan,
  Transaction
} from '../src/index.js';

describe('Loan Balance Tracking', () => {
  const loan: Loan = {
    loanId: 'loan-101',
    groupId: 'group-01',
    memberId: 'member-01',
    principal: 500000, // ₹5,000
    rate: 12,
    method: 'reducing',
    installments: 5,
    startDate: '2026-01-01',
    status: 'active'
  };

  it('should return initial principal when no repayments have been made', () => {
    const balance = outstandingLoanBalance(loan, []);
    expect(balance).toBe(500000);
  });

  it('should reduce outstanding balance as repayments occur', () => {
    const txs: Transaction[] = [
      {
        txId: 'tx-disb',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'loan_disbursement',
        amountPaise: 500000,
        mode: 'bank',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000,
        loanId: 'loan-101'
      },
      {
        txId: 'tx-rep-1',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'loan_repayment',
        amountPaise: 100000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000,
        loanId: 'loan-101'
      },
      {
        txId: 'tx-rep-2',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'loan_repayment',
        amountPaise: 150000,
        mode: 'upi',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 3000,
        loanId: 'loan-101'
      }
    ];

    const balance = outstandingLoanBalance(loan, txs);
    // 500,000 - 100,000 - 150,000 = 250,000
    expect(balance).toBe(250000);
  });

  it('should restore loan balance if a repayment is reversed', () => {
    const txs: Transaction[] = [
      {
        txId: 'tx-disb',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'loan_disbursement',
        amountPaise: 500000,
        mode: 'bank',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000,
        loanId: 'loan-101'
      },
      {
        txId: 'tx-rep-err',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'loan_repayment',
        amountPaise: 200000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000,
        loanId: 'loan-101'
      },
      {
        txId: 'tx-rep-rev',
        groupId: 'group-01',
        memberId: 'member-01',
        type: 'reversal',
        amountPaise: 200000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 3000,
        loanId: 'loan-101',
        reversesId: 'tx-rep-err',
        reason: 'Payment check bounced'
      }
    ];

    const balance = outstandingLoanBalance(loan, txs);
    expect(balance).toBe(500000);
  });
});
