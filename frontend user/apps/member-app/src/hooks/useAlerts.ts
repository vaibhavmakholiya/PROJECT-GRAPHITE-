import { useState, useEffect, useCallback } from 'react';
import { Announcement, Notification } from '../data/repository';
import { mockRepository } from '../data/mockRepository';

export function useAlerts(memberId?: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [anns, notifs] = await Promise.all([
        mockRepository.getAnnouncements(),
        memberId ? mockRepository.getNotifications(memberId) : Promise.resolve([]),
      ]);
      setAnnouncements(anns);
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAsRead = async (id: string) => {
    await mockRepository.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    for (const notif of notifications) {
      if (!notif.read) {
        await mockRepository.markNotificationAsRead(notif.id);
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    announcements,
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshAlerts: fetchAlerts,
  };
}
