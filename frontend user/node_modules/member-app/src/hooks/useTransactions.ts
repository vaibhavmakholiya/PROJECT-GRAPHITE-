import { useState, useEffect, useCallback } from 'react';
import { type Transaction, type Receipt, getReversedTransactionIds } from '@sanchay/core';
import { getRepository } from '../shared/data';

export function useTransactions(memberId?: string) {
  const repo = getRepository();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLedger = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [txs, rcpts] = await Promise.all([
        repo.getTransactions(memberId),
        repo.getReceipts(memberId),
      ]);
      setTransactions(txs);
      setReceipts(rcpts);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const reversedTxIds = getReversedTransactionIds(transactions);

  return {
    transactions,
    receipts,
    reversedTxIds,
    loading,
    refreshLedger: fetchLedger,
  };
}
