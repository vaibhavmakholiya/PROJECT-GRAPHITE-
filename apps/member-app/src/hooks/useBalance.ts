import { useState, useEffect, useCallback } from 'react';
import { MemberBalance, GroupSettings } from '@sanchay/core';
import { getRepository } from '../shared/data';

export function useBalance(memberId?: string) {
  const repo = getRepository();
  const [balance, setBalance] = useState<MemberBalance | null>(null);
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [bal, setts] = await Promise.all([
        repo.getMemberBalance(memberId),
        repo.getGroupSettings(),
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
