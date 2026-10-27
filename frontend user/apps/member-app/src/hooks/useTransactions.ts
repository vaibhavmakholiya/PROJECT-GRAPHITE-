import { useState, useEffect, useCallback } from 'react';
import { type Transaction, type Receipt, getReversedTransactionIds } from '@sanchay/core';
import { mockRepository } from '../data/mockRepository';

export function useTransactions(memberId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLedger = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [txs, rcpts] = await Promise.all([
        mockRepository.getTransactions(memberId),
        mockRepository.getReceipts(memberId),
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
