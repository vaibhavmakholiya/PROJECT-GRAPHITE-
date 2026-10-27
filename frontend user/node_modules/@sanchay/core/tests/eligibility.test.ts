import { describe, it, expect } from 'vitest';
import {
  isEligibleForLoan,
  maxLoanAmount,
  countDueContributions,
  Member,
  GroupSettings,
  Transaction,
  Loan
} from '../src/index.js';

describe('Loan Eligibility & Limits Engine', () => {
  const settings: GroupSettings = {
    monthlyContributionPaise: 50000, // ₹500/month
    interestRatePercent: 12,
    interestMethod: 'reducing',
    maxLoanMultiple: 3, // 3x net savings
    maxInstallments: 12,
    dueDayOfMonth: 5
  };

  const activeMember: Member = {
    memberId: 'mem-001',
    groupId: 'group-001',
    name: 'Asha Patil',
    phone: '+919876543210',
    dob: '1990-05-15',
    address: 'Plot 4, Rural Area',
    aadhaarHash: 'fake-hash',
    aadhaarLast4: '1234',
    status: 'active',
    role: 'member',
    createdAt: '2026-01-01T00:00:00.000Z',
    deviceId: 'dev-001'
  };

  it('should count due contributions correctly based on dueDayOfMonth', () => {
    // Member created Jan 1, reference date Mar 6 (5th has passed for Jan, Feb, Mar -> 3 dues)
    const dues3 = countDueContributions('2026-01-01', '2026-03-06', 5);
    expect(dues3).toBe(3);

    // If reference date is Mar 4 (due date 5th has NOT passed for March yet -> 2 dues: Jan, Feb)
    const dues2 = countDueContributions('2026-01-01', '2026-03-04', 5);
    expect(dues2).toBe(2);
  });

  it('should approve eligibility when member has zero outstanding loans and all dues paid', () => {
    // 3 months of dues (Jan, Feb, Mar) = 3 * 50,000 = 150,000 paise
    const txs: Transaction[] = [
      {
        txId: 'tx-1',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-2',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000
      },
      {
        txId: 'tx-3',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 3000
      }
    ];

    const result = isEligibleForLoan(activeMember, txs, [], settings, '2026-03-10');
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('should reject eligibility when member has unpaid monthly contributions', () => {
    // Only 2 contributions paid, but 3 are due by Mar 10
    const txs: Transaction[] = [
      {
        txId: 'tx-1',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-2',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000
      }
    ];

    const result = isEligibleForLoan(activeMember, txs, [], settings, '2026-03-10');
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('Unpaid monthly contributions'))).toBe(true);
  });

  it('should reject eligibility when member has an existing outstanding loan', () => {
    const existingLoan: Loan = {
      loanId: 'loan-active',
      groupId: 'group-001',
      memberId: activeMember.memberId,
      principal: 200000,
      rate: 12,
      method: 'reducing',
      installments: 6,
      startDate: '2026-01-01',
      status: 'active'
    };

    const txs: Transaction[] = [
      {
        txId: 'tx-1',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'contribution',
        amountPaise: 150000, // Covers 3 months
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-disb',
        groupId: 'group-001',
        memberId: activeMember.memberId,
        type: 'loan_disbursement',
        amountPaise: 200000,
        mode: 'bank',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1100,
        loanId: 'loan-active'
      }
    ];

    const result = isEligibleForLoan(activeMember, txs, [existingLoan], settings, '2026-03-10');
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes('existing loan with an outstanding balance'))).toBe(true);
  });

  it('should compute max loan amount according to group multiplier', () => {
    // 50,000 paise savings * 3x multiplier = 150,000 paise
    expect(maxLoanAmount(50000, settings)).toBe(150000);
    expect(maxLoanAmount(0, settings)).toBe(0);
    expect(maxLoanAmount(-1000, settings)).toBe(0);
  });
});
