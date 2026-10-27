/**
 * Loan Eligibility & Maximum Limit Engine
 * Requirements:
 *   - No outstanding loan balance.
 *   - Every monthly contribution due up to today is paid in full.
 *   - Returns { eligible: boolean, reasons: string[] }.
 */
import { Member, Transaction, Loan, GroupSettings, MemberBalance, AmountPaise, EligibilityResult } from './types.js';
/**
 * Calculates the maximum loan amount a member is eligible to request based on group settings.
 */
export declare function maxLoanAmount(balance: MemberBalance | AmountPaise, settings: GroupSettings): AmountPaise;
/**
 * Counts how many monthly contribution dues have occurred between member's creation and reference date.
 */
export declare function countDueContributions(memberCreatedAt: string | Date | number, referenceDate: string | Date | number, dueDayOfMonth: number): number;
/**
 * Evaluates whether a member is currently eligible for a loan.
 */
export declare function isEligibleForLoan(member: Member, transactions: Transaction[], loans: Loan[], settings: GroupSettings, today?: string | Date | number): EligibilityResult;
//# sourceMappingURL=eligibility.d.ts.map