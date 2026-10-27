import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Megaphone,
  Bell,
  CheckCheck,
  Download,
} from 'lucide-react';
import { formatDate } from '../lib/date';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/SkeletonLoader';

export const AlertsView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member } = useAuth();
  const {
    announcements,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
  } = useAlerts(member?.memberId);
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Title & Mark All Read */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
          {t('alerts.title', 'Alerts & Notices')}
        </h1>
        {unreadCount > 0 && activeTab === 'notifications' && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>{t('alerts.markAllRead', 'Mark all as read')}</span>
          </button>
        )}
      </div>

      {/* Segmented Tab Switcher */}
      <div className="flex gap-2 border-b border-blue-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all relative cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-white border border-blue-200 text-blue-600 font-bold shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <span>{t('alerts.notificationsTab', 'Personal')}</span>
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('announcements')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-white border border-blue-200 text-blue-600 font-bold shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <span>{t('alerts.announcementsTab', 'Group Announcements')}</span>
        </button>
      </div>

      {/* Tab 1: Personal Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={t('alerts.empty', 'No notifications right now.')}
            />
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.read) markAsRead(n.id);
                  if (n.refId) {
                    navigate(`/receipts/${n.refId}`);
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-subtle ${
                  n.read
                    ? 'bg-white border-blue-200'
                    : 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                    <h3 className="font-heading font-bold text-xs text-navy-900">{n.title}</h3>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-4">{n.body}</p>

                {n.refId && (
                  <div className="pl-4 pt-2">
                    <span className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>Download Receipt</span>
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Group Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No group announcements"
            />
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-5 rounded-2xl border border-blue-200 bg-white shadow-subtle space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xs text-navy-900">{ann.title}</h3>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      Posted by SHG Admin • {formatDate(ann.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-navy-900 leading-relaxed pt-1 pl-12">
                  {ann.body}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AlertsView;
