/**
 * Loan Schedule Generation Engine
 * Enforces Rule 1: Money is an integer in paise. Never use floats or decimals.
 * Supports:
 *   - 'flat': Fixed interest over tenure, distributed evenly with penny-exact remainder in last installment.
 *   - 'reducing': Monthly reducing balance EMI with full principal amortization and penny-exact remainder.
 */
import { AmountPaise, InterestMethod, LoanScheduleInstallment } from './types.js';
/**
 * Calculates a future due date by adding N calendar months to the start date.
 * Handles end-of-month clamping (e.g., Jan 31 + 1 month -> Feb 28).
 */
export declare function addMonthsToDate(startDate: string | Date, monthsToAdd: number): string;
/**
 * Generates an exact installment schedule in paise.
 * The last installment absorbs all fractional rounding so the total principal
 * amortized and total interest payable are 100% exact.
 */
export declare function generateSchedule(principal: AmountPaise, ratePercent: number, method: InterestMethod, installments: number, startDate: string | Date): LoanScheduleInstallment[];
//# sourceMappingURL=schedule.d.ts.map