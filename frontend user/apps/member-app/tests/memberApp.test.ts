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
    const txs = await mockRepository.getTransactions(member!.memberId);

    // Verify 6 months of contributions with June reversal chain
    expect(txs.some((t) => t.txId === 'tx-err-01')).toBe(true);
    expect(txs.some((t) => t.txId === 'tx-rev-01' && t.type === 'reversal')).toBe(true);
    expect(txs.some((t) => t.txId === 'tx-corr-01')).toBe(true);

    // Compute balance and ensure the reversed tx-err-01 (₹600) is cancelled
    const balance = computeMemberBalance(member!.memberId, txs);
    // 5 active contributions of ₹500 (May, June-corrected, July, Sep, Oct) = 250,000 paise (₹2,500)
    expect(balance.contributionPaise).toBe(250000);
  });

  it('enforces Rule 5: Privacy guarantee & masked Aadhaar', async () => {
    const member = await mockRepository.getCurrentMember();
    expect(member?.aadhaarLast4).toBe('1234');
    const masked = maskAadhaar(member!.aadhaarLast4);
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

    // Member has active loan, so eligibility should report false with reasons
    expect(elig.eligible).toBe(false);
    expect(elig.reasons.length).toBeGreaterThan(0);
  });

  it('formats dates consistently for Indian locale', () => {
    expect(formatDate('2026-10-05')).toContain('2026');
    expect(formatDate('2026-10-05')).toContain('Oct');
  });
});
