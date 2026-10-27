/**
 * Loan Balance Tracking Logic
 * Computes outstanding loan balance from ledger transactions.
 */
import { getReversedTransactionIds, assertSafePaise } from './balance.js';
/**
 * Computes the remaining outstanding balance of a loan.
 * Outstanding = (Total Disbursed) - (Total Active Repayments).
 * Reversals cancel any mistaken repayments or disbursements.
 */
export function outstandingLoanBalance(loan, transactions) {
    const reversedTxIds = getReversedTransactionIds(transactions);
    let totalDisbursed = 0;
    let totalRepaid = 0;
    for (const tx of transactions) {
        if (tx.loanId !== loan.loanId)
            continue;
        if (reversedTxIds.has(tx.txId) || tx.type === 'reversal')
            continue;
        assertSafePaise(tx.amountPaise, `loan tx(${tx.txId}).amountPaise`);
        if (tx.type === 'loan_disbursement') {
            totalDisbursed += tx.amountPaise;
        }
        else if (tx.type === 'loan_repayment') {
            totalRepaid += tx.amountPaise;
        }
    }
    // If no disbursement tx is recorded yet, fall back to loan.principal
    const principalBase = totalDisbursed > 0 ? totalDisbursed : loan.principal;
    const remaining = principalBase - totalRepaid;
    return Math.max(0, remaining);
}
//# sourceMappingURL=loan.js.map