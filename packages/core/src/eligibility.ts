/**
 * Loan Eligibility & Maximum Limit Engine
 * Requirements:
 *   - No outstanding loan balance.
 *   - Every monthly contribution due up to today is paid in full.
 *   - Returns { eligible: boolean, reasons: string[] }.
 */

import {
  Member,
  Transaction,
  Loan,
  GroupSettings,
  MemberBalance,
  AmountPaise,
  EligibilityResult
} from './types.js';
import { computeMemberBalance } from './balance.js';
import { outstandingLoanBalance } from './loan.js';

/**
 * Calculates the maximum loan amount a member is eligible to request based on group settings.
 */
export function maxLoanAmount(
  balance: MemberBalance | AmountPaise,
  settings: GroupSettings
): AmountPaise {
  const netSavings = typeof balance === 'number' ? balance : balance.netSavingsPaise;
  if (netSavings <= 0) return 0;
  const calculated = Math.floor(netSavings * settings.maxLoanMultiple);
  if (settings.maxLoanAmountPaise && settings.maxLoanAmountPaise > 0) {
    return Math.min(calculated, settings.maxLoanAmountPaise);
  }
  return calculated;
}

/**
 * Counts how many monthly contribution dues have occurred between member's creation and reference date.
 */
export function countDueContributions(
  memberCreatedAt: string | Date | number,
  referenceDate: string | Date | number,
  dueDayOfMonth: number
): number {
  const created = new Date(memberCreatedAt);
  const ref = new Date(referenceDate);

  if (ref < created) return 0;

  let dues = 0;

  // Start from the year and month the member joined
  let curYear = created.getUTCFullYear();
  let curMonth = created.getUTCMonth(); // 0-indexed

  const endYear = ref.getUTCFullYear();
  const endMonth = ref.getUTCMonth();

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    // Find the last day of this current month
    const maxDayInMonth = new Date(Date.UTC(curYear, curMonth + 1, 0)).getUTCDate();
    const effectiveDueDay = Math.min(dueDayOfMonth, maxDayInMonth);
    const dueDate = new Date(Date.UTC(curYear, curMonth, effectiveDueDay, 23, 59, 59, 999));

    // If due date was after or on member creation, and on or before ref date, it counts as due
    if (dueDate >= created && dueDate <= ref) {
      dues++;
    }

    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  return dues;
}

/**
 * Evaluates whether a member is currently eligible for a loan.
 */
export function isEligibleForLoan(
  member: Member,
  transactions: Transaction[],
  loans: Loan[],
  settings: GroupSettings,
  today: string | Date | number = new Date()
): EligibilityResult {
  const reasons: string[] = [];

  // Check 1: Member active status
  if (member.status !== 'active') {
    reasons.push(`Member status is '${member.status}', must be 'active'.`);
  }

  // Check 2: No outstanding loan balance
  const memberLoans = loans.filter((l) => l.memberId === member.memberId && l.status !== 'closed');
  for (const loan of memberLoans) {
    const outstanding = outstandingLoanBalance(loan, transactions);
    if (outstanding > 0) {
      reasons.push(`Member has an existing loan with an outstanding balance of ${outstanding} paise.`);
      break;
    }
  }

  // Check 3: Every monthly contribution due up to today is paid
  const dueCount = countDueContributions(member.createdAt, today, settings.dueDayOfMonth);
  const requiredContributionsPaise = dueCount * settings.monthlyContributionPaise;

  const balance = computeMemberBalance(member.memberId, transactions);
  if (balance.contributionPaise < requiredContributionsPaise) {
    const deficitPaise = requiredContributionsPaise - balance.contributionPaise;
    reasons.push(
      `Unpaid monthly contributions: required ${requiredContributionsPaise} paise (${dueCount} months), paid ${balance.contributionPaise} paise (shortfall: ${deficitPaise} paise).`
    );
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}
