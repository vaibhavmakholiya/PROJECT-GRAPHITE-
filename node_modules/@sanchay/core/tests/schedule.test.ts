import { describe, it, expect } from 'vitest';
import { generateSchedule, addMonthsToDate } from '../src/index.js';

describe('Loan Schedule Generation Engine', () => {
  describe('Flat Interest Method', () => {
    it('should generate exact schedule with zero rounding loss for flat method', () => {
      const principal = 1200000; // ₹12,000 in paise
      const ratePercent = 12; // 12% annual
      const installments = 12; // 12 months
      const startDate = '2026-01-05';

      const schedule = generateSchedule(principal, ratePercent, 'flat', installments, startDate);

      expect(schedule.length).toBe(12);

      let totalPrincipal = 0;
      let totalInterest = 0;
      let totalAmount = 0;

      for (const inst of schedule) {
        expect(Number.isSafeInteger(inst.amountPaise)).toBe(true);
        expect(Number.isSafeInteger(inst.principalPaise)).toBe(true);
        expect(Number.isSafeInteger(inst.interestPaise)).toBe(true);
        expect(inst.amountPaise).toBe(inst.principalPaise + inst.interestPaise);

        totalPrincipal += inst.principalPaise;
        totalInterest += inst.interestPaise;
        totalAmount += inst.amountPaise;
      }

      // Expected flat interest: 1,200,000 * 0.12 * 1 = 144,000 paise
      expect(totalPrincipal).toBe(principal);
      expect(totalInterest).toBe(144000);
      expect(totalAmount).toBe(principal + 144000);
    });

    it('should absorb odd rounding in the final installment for flat method', () => {
      const principal = 100003; // Prime/odd number of paise
      const ratePercent = 10;
      const installments = 3;
      const startDate = '2026-03-01';

      const schedule = generateSchedule(principal, ratePercent, 'flat', installments, startDate);
      expect(schedule.length).toBe(3);

      const totalPrincipal = schedule.reduce((sum, inst) => sum + inst.principalPaise, 0);
      const expectedTotalInterest = Math.round((principal * 10 * 3) / 1200);
      const totalInterest = schedule.reduce((sum, inst) => sum + inst.interestPaise, 0);

      expect(totalPrincipal).toBe(principal);
      expect(totalInterest).toBe(expectedTotalInterest);
    });
  });

  describe('Reducing Balance Method', () => {
    it('should amortize principal completely to 0 paise with exact installments', () => {
      const principal = 1000000; // ₹10,000
      const ratePercent = 15; // 15% annual
      const installments = 6;
      const startDate = '2026-01-10';

      const schedule = generateSchedule(principal, ratePercent, 'reducing', installments, startDate);
      expect(schedule.length).toBe(6);

      let totalPrincipalAmortized = 0;
      let totalInterest = 0;

      for (const inst of schedule) {
        expect(Number.isSafeInteger(inst.amountPaise)).toBe(true);
        expect(Number.isSafeInteger(inst.principalPaise)).toBe(true);
        expect(Number.isSafeInteger(inst.interestPaise)).toBe(true);
        expect(inst.amountPaise).toBe(inst.principalPaise + inst.interestPaise);

        totalPrincipalAmortized += inst.principalPaise;
        totalInterest += inst.interestPaise;
      }

      // Crucial invariant: Total principal amortized MUST equal original principal down to 1 paisa
      expect(totalPrincipalAmortized).toBe(principal);
    });

    it('should absorb remainder in final installment for odd reducing balance cases', () => {
      const principal = 333333; // 3,333.33 INR in paise
      const ratePercent = 18;
      const installments = 7;
      const startDate = '2026-05-15';

      const schedule = generateSchedule(principal, ratePercent, 'reducing', installments, startDate);
      expect(schedule.length).toBe(7);

      const totalPrincipalAmortized = schedule.reduce((sum, inst) => sum + inst.principalPaise, 0);
      expect(totalPrincipalAmortized).toBe(principal);
    });
  });

  describe('Due Date Calculation', () => {
    it('should clamp due date to end of target month for short months', () => {
      // Jan 31 + 1 month -> Feb 28 in 2026 (non-leap year)
      expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28');
      // Jan 31 + 2 months -> Mar 31
      expect(addMonthsToDate('2026-01-31', 2)).toBe('2026-03-31');
      // Jan 31 + 3 months -> Apr 30
      expect(addMonthsToDate('2026-01-31', 3)).toBe('2026-04-30');
    });
  });
});
