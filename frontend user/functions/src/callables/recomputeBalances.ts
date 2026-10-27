import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db } from '../config.js';
import { safeLogger } from '../logger.js';
import { computeBalance, Transaction } from '@sanchay/core';

interface RecomputeBalancesData {
  groupId: string;
}

export const recomputeBalances = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { groupId } = request.data as RecomputeBalancesData;
  if (!groupId) {
    throw new HttpsError('invalid-argument', 'groupId is required.');
  }

  const token = request.auth.token;
  if (token.groupId !== groupId || token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only group admins can perform ledger audit recomputation.');
  }

  const txSnap = await db.collection('groups').doc(groupId).collection('transactions').get();
  const transactions: Transaction[] = txSnap.docs.map((doc) => doc.data() as Transaction);

  const balanceSummary = computeBalance(transactions);

  safeLogger.info('Ledger balance recomputed for audit', {
    groupId,
    totalTransactions: transactions.length,
    totalSavingsPaise: balanceSummary.totalSavingsPaise
  });

  return {
    success: true,
    totalTransactions: transactions.length,
    summary: balanceSummary
  };
});
