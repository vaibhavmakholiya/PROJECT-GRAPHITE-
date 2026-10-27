import { describe, it, expect } from 'vitest';
import {
  computeMemberBalance,
  computeBalance,
  Transaction,
  assertSafePaise
} from '../src/index.js';

describe('Balance Computation Engine', () => {
  const m1 = 'member-01';
  const m2 = 'member-02';
  const group = 'group-01';

  it('should enforce safe non-negative integer paise', () => {
    expect(() => assertSafePaise(100)).not.toThrow();
    expect(() => assertSafePaise(0)).not.toThrow();
    expect(() => assertSafePaise(100.5)).toThrow(/integer in paise/);
    expect(() => assertSafePaise(-50)).toThrow(/integer in paise/);
  });

  it('should compute member savings from active contributions and withdrawals', () => {
    const txs: Transaction[] = [
      {
        txId: 'tx-1',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 50000, // ₹500
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-2',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 50000, // ₹500
        mode: 'upi',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000
      },
      {
        txId: 'tx-3',
        groupId: group,
        memberId: m1,
        type: 'withdrawal',
        amountPaise: 20000, // ₹200
        mode: 'bank',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 3000
      }
    ];

    const balance = computeMemberBalance(m1, txs);
    expect(balance.contributionPaise).toBe(100000);
    expect(balance.withdrawalPaise).toBe(20000);
    expect(balance.netSavingsPaise).toBe(80000);
  });

  it('should correctly handle reversal entries and void the target transaction', () => {
    const txs: Transaction[] = [
      {
        txId: 'tx-1',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-2-erroneous',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 90000, // Recorded by mistake
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 2000
      },
      {
        txId: 'tx-3-reversal',
        groupId: group,
        memberId: m1,
        type: 'reversal',
        amountPaise: 90000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 3000,
        reversesId: 'tx-2-erroneous',
        reason: 'Typo in member contribution entry'
      },
      {
        txId: 'tx-4-corrected',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 50000, // Corrected amount
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 4000
      }
    ];

    const balance = computeMemberBalance(m1, txs);
    // tx-1 (50000) + tx-4 (50000) = 100000. tx-2 is reversed.
    expect(balance.contributionPaise).toBe(100000);
    expect(balance.netSavingsPaise).toBe(100000);
  });

  it('should aggregate group total balance across multiple members', () => {
    const txs: Transaction[] = [
      {
        txId: 'tx-m1-1',
        groupId: group,
        memberId: m1,
        type: 'contribution',
        amountPaise: 50000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1000
      },
      {
        txId: 'tx-m2-1',
        groupId: group,
        memberId: m2,
        type: 'contribution',
        amountPaise: 75000,
        mode: 'upi',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1100
      },
      {
        txId: 'tx-m1-w',
        groupId: group,
        memberId: m1,
        type: 'withdrawal',
        amountPaise: 10000,
        mode: 'cash',
        recordedBy: 'admin',
        deviceId: 'dev-1',
        clientTimestamp: 1200
      }
    ];

    const groupSummary = computeBalance(txs);
    expect(groupSummary.totalContributionsPaise).toBe(125000);
    expect(groupSummary.totalWithdrawalsPaise).toBe(100000 ? 10000 : 0);
    expect(groupSummary.totalSavingsPaise).toBe(115000);
    expect(groupSummary.memberBalances[m1].netSavingsPaise).toBe(40000);
    expect(groupSummary.memberBalances[m2].netSavingsPaise).toBe(75000);
  });
});
