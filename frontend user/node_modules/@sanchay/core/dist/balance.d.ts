/**
 * Balance Computation Logic
 * Enforces Rule 1: Money is an integer in paise.
 * Enforces Rule 2: Ledger is APPEND-ONLY. Balances are never stored; always computed.
 * Enforces Rule 3: Reversal entries cancel the transaction they reference.
 */
import { Transaction, MemberBalance, GroupBalanceSummary } from './types.js';
/**
 * Validates that an amount is a safe non-negative integer in paise.
 */
export declare function assertSafePaise(amount: number, fieldName?: string): void;
/**
 * Identifies all transaction IDs that have been cancelled by a reversal.
 */
export declare function getReversedTransactionIds(transactions: Transaction[]): Set<string>;
/**
 * Computes the balance breakdown for a specific member from an array of transactions.
 * Balances are strictly computed on-the-fly; never stored.
 */
export declare function computeMemberBalance(memberId: string, transactions: Transaction[]): MemberBalance;
/**
 * Computes the aggregated balance summary for all members and the entire group.
 */
export declare function computeBalance(transactions: Transaction[]): GroupBalanceSummary;
//# sourceMappingURL=balance.d.ts.map