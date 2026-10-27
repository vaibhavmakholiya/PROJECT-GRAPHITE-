import { useState, useEffect } from 'react';
import { getRepository, SyncState } from '../shared/data';

export function useSyncState() {
  const repo = getRepository();
  const [syncState, setSyncStateInternal] = useState<SyncState>(repo.getSyncState());
  const [queueCount, setQueueCountInternal] = useState<number>(repo.getPendingSyncCount());
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const syncWithRepo = () => {
      setSyncStateInternal(repo.getSyncState());
      setQueueCountInternal(repo.getPendingSyncCount());
    };

    const handleOnline = () => {
      setIsBrowserOnline(true);
      if (repo.getPendingSyncCount() > 0) {
        repo.setSyncState('syncing');
        setSyncStateInternal('syncing');
      } else {
        repo.setSyncState('synced', 0);
        setSyncStateInternal('synced');
      }
      syncWithRepo();
    };

    const handleOffline = () => {
      setIsBrowserOnline(false);
      repo.setSyncState('offline');
      setSyncStateInternal('offline');
      syncWithRepo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic sync check to catch optimistic writes and Firestore synchronization
    const interval = setInterval(syncWithRepo, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [repo]);

  const updateSyncState = (state: SyncState, queue = 0) => {
    repo.setSyncState(state, queue);
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
