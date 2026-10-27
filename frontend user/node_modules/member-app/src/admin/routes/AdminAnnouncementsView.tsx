import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Send, CheckCircle2, Clock } from 'lucide-react';
import { getRepository, Announcement } from '../../shared/data';
import { formatDateTime } from '../../shared/utils/date';

export const AdminAnnouncementsView: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const repo = getRepository();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadAnnouncements = async () => {
    const list = await repo.getAnnouncements();
    setAnnouncements(list);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    try {
      await repo.createAnnouncement(title.trim(), body.trim());
      setTitle('');
      setBody('');
      setSuccess(true);
      loadAnnouncements();
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-navy-900 tracking-tight">
          {t('admin:announcements.title')}
        </h1>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Broadcast meeting reminders and loan notices to all registered member devices
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-2xl bg-status-success-bg border border-status-success-border text-status-success text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Announcement broadcast to all member devices!</span>
        </div>
      )}

      {/* Creation Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-4 text-xs"
      >
        <div className="flex items-center gap-2 font-bold text-navy-900 text-sm pb-2 border-b border-blue-100">
          <Megaphone className="w-4 h-4 text-blue-600" />
          <span>{t('admin:announcements.create')}</span>
        </div>

        <div>
          <label className="block font-semibold text-navy-900 mb-1">
            {t('admin:announcements.titleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next monthly circle meeting date"
            className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 focus:border-blue-600 outline-none font-medium"
            required
          />
        </div>

        <div>
          <label className="block font-semibold text-navy-900 mb-1">
            {t('admin:announcements.bodyLabel')}
          </label>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Details about time, location, documents required..."
            className="w-full py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 focus:border-blue-600 outline-none font-medium resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isSubmitting ? t('admin:announcements.broadcasting') : t('admin:announcements.broadcast')}</span>
        </button>
      </form>

      {/* Announcements List */}
      <div className="bg-white rounded-3xl border border-blue-200 p-5 sm:p-6 shadow-subtle space-y-3">
        <h3 className="font-heading font-bold text-sm text-navy-900">Active Group Broadcasts</h3>
        <div className="divide-y divide-blue-100 text-xs">
          {announcements.map((item) => (
            <div key={item.id} className="py-3.5 space-y-1">
              <div className="flex justify-between items-center">
                <b className="text-navy-900 font-semibold">{item.title}</b>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementsView;
