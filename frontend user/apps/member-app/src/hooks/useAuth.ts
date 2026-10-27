import { useState, useEffect, useCallback } from 'react';
import { Member } from '@sanchay/core';
import { mockRepository } from '../data/mockRepository';

export function useAuth() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshMember = useCallback(async () => {
    try {
      const current = await mockRepository.getCurrentMember();
      setMember(current);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMember();
  }, [refreshMember]);

  const login = async (phone: string, otp: string) => {
    setLoading(true);
    try {
      const logged = await mockRepository.loginWithPhone(phone, otp);
      setMember(logged);
      return logged;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await mockRepository.logout();
    setMember(null);
  };

  const register = async (params: import('../data/repository').RegisterMemberParams) => {
    setLoading(true);
    try {
      const created = await mockRepository.registerMember(params);
      setMember(created);
      return created;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: Member['status']) => {
    await mockRepository.setMemberStatus(status);
    await refreshMember();
  };

  return {
    member,
    loading,
    login,
    register,
    logout,
    updateStatus,
    refreshMember,
    isAuthenticated: !!member,
    isActive: member?.status === 'active',
    isPending: member?.status === 'pending',
  };
}
