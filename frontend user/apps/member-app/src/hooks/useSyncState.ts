import { useState, useEffect } from 'react';
import { mockRepository } from '../data/mockRepository';
import type { SyncState } from '../data/repository';

export function useSyncState() {
  const [syncState, setSyncStateInternal] = useState<SyncState>(mockRepository.getSyncState());
  const [queueCount, setQueueCountInternal] = useState<number>(mockRepository.getPendingSyncCount());
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      if (syncState === 'offline') {
        mockRepository.setSyncState('synced', 0);
        setSyncStateInternal('synced');
        setQueueCountInternal(0);
      }
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
      mockRepository.setSyncState('offline', 2);
      setSyncStateInternal('offline');
      setQueueCountInternal(2);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncState]);

  const updateSyncState = (state: SyncState, queue = 0) => {
    mockRepository.setSyncState(state, queue);
    setSyncStateInternal(state);
    setQueueCountInternal(queue);
  };

  return {
    syncState,
    queueCount,
    isBrowserOnline,
    updateSyncState,
  };
}
