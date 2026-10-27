/**
 * Loan Balance Tracking Logic
 * Computes outstanding loan balance from ledger transactions.
 */
import { Loan, Transaction, AmountPaise } from './types.js';
/**
 * Computes the remaining outstanding balance of a loan.
 * Outstanding = (Total Disbursed) - (Total Active Repayments).
 * Reversals cancel any mistaken repayments or disbursements.
 */
export declare function outstandingLoanBalance(loan: Loan, transactions: Transaction[]): AmountPaise;
//# sourceMappingURL=loan.d.ts.map