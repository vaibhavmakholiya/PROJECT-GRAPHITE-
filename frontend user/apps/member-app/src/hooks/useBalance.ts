import { useState, useEffect, useCallback } from 'react';
import { MemberBalance, GroupSettings } from '@sanchay/core';
import { mockRepository } from '../data/mockRepository';

export function useBalance(memberId?: string) {
  const [balance, setBalance] = useState<MemberBalance | null>(null);
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [bal, setts] = await Promise.all([
        mockRepository.getMemberBalance(memberId),
        mockRepository.getGroupSettings(),
      ]);
      setBalance(bal);
      setSettings(setts);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    settings,
    loading,
    refreshBalance: fetchBalance,
  };
}
