/**
 * Balance Computation Logic
 * Enforces Rule 1: Money is an integer in paise.
 * Enforces Rule 2: Ledger is APPEND-ONLY. Balances are never stored; always computed.
 * Enforces Rule 3: Reversal entries cancel the transaction they reference.
 */

import {
  Transaction,
  MemberBalance,
  GroupBalanceSummary,
  AmountPaise
} from './types.js';

/**
 * Validates that an amount is a safe non-negative integer in paise.
 */
export function assertSafePaise(amount: number, fieldName = 'amount'): void {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error(`${fieldName} must be a non-negative safe integer in paise, received: ${amount}`);
  }
}

/**
 * Identifies all transaction IDs that have been cancelled by a reversal.
 */
export function getReversedTransactionIds(transactions: Transaction[]): Set<string> {
  const reversed = new Set<string>();
  for (const tx of transactions) {
    if (tx.type === 'reversal' && tx.reversesId) {
      reversed.add(tx.reversesId);
    }
  }
  return reversed;
}

/**
 * Computes the balance breakdown for a specific member from an array of transactions.
 * Balances are strictly computed on-the-fly; never stored.
 */
export function computeMemberBalance(
  memberId: string,
  transactions: Transaction[]
): MemberBalance {
  const reversedTxIds = getReversedTransactionIds(transactions);

  let contributionPaise = 0;
  let withdrawalPaise = 0;
  let repaymentPaise = 0;
  let disbursementPaise = 0;

  for (const tx of transactions) {
    // Only process transactions for this member
    if (tx.memberId !== memberId) continue;
    // Skip transactions cancelled by a reversal, and skip reversal entries themselves
    if (reversedTxIds.has(tx.txId) || tx.type === 'reversal') continue;

    assertSafePaise(tx.amountPaise, `tx(${tx.txId}).amountPaise`);

    switch (tx.type) {
      case 'contribution':
        contributionPaise += tx.amountPaise;
        break;
      case 'withdrawal':
        withdrawalPaise += tx.amountPaise;
        break;
      case 'loan_repayment':
        repaymentPaise += tx.amountPaise;
        break;
      case 'loan_disbursement':
        disbursementPaise += tx.amountPaise;
        break;
    }
  }

  const netSavingsPaise = contributionPaise - withdrawalPaise;

  return {
    memberId,
    contributionPaise,
    withdrawalPaise,
    netSavingsPaise,
    repaymentPaise,
    disbursementPaise
  };
}

/**
 * Computes the aggregated balance summary for all members and the entire group.
 */
export function computeBalance(transactions: Transaction[]): GroupBalanceSummary {
  const reversedTxIds = getReversedTransactionIds(transactions);

  let totalContributionsPaise = 0;
  let totalWithdrawalsPaise = 0;
  let totalLoansDisbursedPaise = 0;
  let totalRepaymentsPaise = 0;

  const memberMap: Record<string, {
    contributionPaise: number;
    withdrawalPaise: number;
    repaymentPaise: number;
    disbursementPaise: number;
  }> = {};

  for (const tx of transactions) {
    if (reversedTxIds.has(tx.txId) || tx.type === 'reversal') continue;

    assertSafePaise(tx.amountPaise, `tx(${tx.txId}).amountPaise`);

    if (!memberMap[tx.memberId]) {
      memberMap[tx.memberId] = {
        contributionPaise: 0,
        withdrawalPaise: 0,
        repaymentPaise: 0,
        disbursementPaise: 0
      };
    }

    const m = memberMap[tx.memberId];

    switch (tx.type) {
      case 'contribution':
        m.contributionPaise += tx.amountPaise;
        totalContributionsPaise += tx.amountPaise;
        break;
      case 'withdrawal':
        m.withdrawalPaise += tx.amountPaise;
        totalWithdrawalsPaise += tx.amountPaise;
        break;
      case 'loan_repayment':
        m.repaymentPaise += tx.amountPaise;
        totalRepaymentsPaise += tx.amountPaise;
        break;
      case 'loan_disbursement':
        m.disbursementPaise += tx.amountPaise;
        totalLoansDisbursedPaise += tx.amountPaise;
        break;
    }
  }

  const memberBalances: Record<string, MemberBalance> = {};
  for (const [mId, data] of Object.entries(memberMap)) {
    memberBalances[mId] = {
      memberId: mId,
      contributionPaise: data.contributionPaise,
      withdrawalPaise: data.withdrawalPaise,
      netSavingsPaise: data.contributionPaise - data.withdrawalPaise,
      repaymentPaise: data.repaymentPaise,
      disbursementPaise: data.disbursementPaise
    };
  }

  const totalSavingsPaise = totalContributionsPaise - totalWithdrawalsPaise;

  return {
    totalSavingsPaise,
    totalContributionsPaise,
    totalWithdrawalsPaise,
    totalLoansDisbursedPaise,
    totalRepaymentsPaise,
    memberBalances
  };
}
