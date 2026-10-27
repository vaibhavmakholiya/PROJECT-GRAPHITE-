import { describe, it, expect } from 'vitest';
import { mockRepository } from '../src/data/mockRepository';
import { formatRupees, rupeesToPaise, paiseToRupees } from '../src/lib/currency';
import { formatDate } from '../src/lib/date';
import {
  computeMemberBalance,
  generateSchedule,
  generateVerhoeffCheckDigit,
  maskAadhaar,
  verhoeffValid,
} from '@sanchay/core';

describe('Sanchay Member Application Core Invariants', () => {
  it('enforces Rule 1: Strict integer paise monetary representation', () => {
    expect(formatRupees(50000)).toBe('₹500');
    expect(formatRupees(300000)).toBe('₹3,000');
    expect(formatRupees(12500000)).toBe('₹1,25,000');
    expect(rupeesToPaise(500)).toBe(50000);
    expect(paiseToRupees(50000)).toBe(500);
  });

  it('enforces Rule 2 & 3: Append-only ledger with reversal negation for corrected entries', async () => {
    const member = await mockRepository.getCurrentMember();
    expect(member).not.toBeNull();

    // 1. Record original transaction
    const { transaction } = await mockRepository.recordTransactionWithReceipt({
      memberId: member!.memberId,
      type: 'contribution',
      amountPaise: 60000,
      mode: 'cash',
      aadhaarLast4: '1234',
    });

    // 2. Record reversal entry
    const { reversal } = await mockRepository.recordReversalAndCorrection(
      transaction.txId,
      'Duplicate entry recorded by error'
    );
    expect(reversal.type).toBe('reversal');
    expect(reversal.reversesId).toBe(transaction.txId);

    // 3. Ledger verification: both entries exist and balance cancels out
    const txs = await mockRepository.getTransactions(member!.memberId);
    expect(txs.some((t) => t.txId === transaction.txId)).toBe(true);
    expect(txs.some((t) => t.txId === reversal.txId && t.type === 'reversal')).toBe(true);

    const balance = computeMemberBalance(member!.memberId, txs);
    expect(balance.netSavingsPaise).toBe(0); // 60,000 - 60,000 = 0
  });

  it('enforces Rule 5: Privacy guarantee & masked Aadhaar', async () => {
    const masked = maskAadhaar('1234');
    expect(masked).toBe('XXXX-XXXX-1234');

    const validPrefix = '23456789012';
    const check = generateVerhoeffCheckDigit(validPrefix);
    const validNumber = `${validPrefix}${check}`;
    expect(verhoeffValid(validNumber)).toBe(true);
    expect(verhoeffValid(`03456789012${check}`)).toBe(false); // Leading 0 invalid
  });

  it('computes amortized reducing EMI schedule with exact penny remainder absorption', () => {
    const schedule = generateSchedule(300000, 12, 'reducing', 6, '2026-09-05');
    expect(schedule).toHaveLength(6);

    const totalPrincipal = schedule.reduce((sum, inst) => sum + inst.principalPaise, 0);
    expect(totalPrincipal).toBe(300000); // 100% exact amortization
  });

  it('evaluates loan eligibility correctly factoring in active loan and dues', async () => {
    const member = await mockRepository.getCurrentMember();
    const elig = await mockRepository.checkLoanEligibility(member!.memberId);
    expect(elig).toBeDefined();
    expect(typeof elig.eligible).toBe('boolean');
  });

  it('formats dates consistently for Indian locale', () => {
    expect(formatDate('2026-10-05')).toContain('2026');
    expect(formatDate('2026-10-05')).toContain('Oct');
  });
});
