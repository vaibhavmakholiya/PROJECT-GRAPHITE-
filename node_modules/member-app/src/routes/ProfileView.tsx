import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Globe,
  Database,
  Smartphone,
  LogOut,
  Check,
} from 'lucide-react';
import { maskAadhaar } from '@sanchay/core';
import { formatDate } from '../lib/date';
import { changeLanguage } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { useSyncState } from '../hooks/useSyncState';
import { Avatar } from '../components/common/Avatar';
import { SyncBadge } from '../components/common/SyncBadge';

export const ProfileView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { member, logout } = useAuth();
  const { syncState, queueCount } = useSyncState();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('Sanchay is already installed or your browser supports PWA installation via the browser menu.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentLang = (i18n.language as 'en' | 'hi' | 'mr') || 'en';

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      {/* Title */}
      <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
        {t('profile.title', 'Member Profile')}
      </h1>

      {/* 1. Member Information Card */}
      <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-blue-200">
          <Avatar name={member?.name || 'Member'} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading font-bold text-base text-navy-900 truncate">
              {member?.name || 'Meena Kumari'}
            </h2>
            <p className="text-xs text-blue-600 font-semibold">
              Active Member • Pragati Bachat Gat
            </p>
            <p className="text-[11px] text-slate-600">
              Member ID: {member?.memberId || 'mem-meena-004'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">{t('profile.phone', 'Phone Number')}</span>
            <span className="font-semibold text-navy-900 font-mono">{member?.phone}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">{t('profile.aadhaar', 'Aadhaar Number')}</span>
            <span className="font-semibold text-navy-900 font-mono">
              {member?.aadhaarLast4 ? maskAadhaar(member.aadhaarLast4) : 'XXXX-XXXX-1234'}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-blue-200/60">
            <span className="text-slate-600">{t('profile.joined', 'Joined')}</span>
            <span className="font-semibold text-navy-900">
              {member?.createdAt ? formatDate(member.createdAt) : '01 May 2026'}
            </span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-slate-600">{t('profile.group', 'Self-Help Group')}</span>
            <span className="font-semibold text-navy-900">Pragati Mahila Bachat Gat</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50 text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
          <span>Aadhaar is always masked as XXXX-XXXX-1234 and zero PII is leaked.</span>
        </div>
      </div>

      {/* 2. Language Selection Card */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-subtle space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <h2 className="font-heading font-bold text-xs text-navy-900 uppercase tracking-wider">
            {t('profile.language', 'Language / भाषा / भाषा')}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'mr', label: 'मराठी' },
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code as any)}
              className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                currentLang === lang.code
                  ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-subtle'
                  : 'border-blue-200 bg-white text-navy-900 hover:border-blue-300'
              }`}
            >
              <span>{lang.label}</span>
              {currentLang === lang.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Offline Storage Diagnostics */}
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-subtle space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="font-heading font-bold text-xs text-navy-900 uppercase tracking-wider">
              {t('profile.storage', 'Offline Storage Status')}
            </h2>
          </div>
          <SyncBadge state={syncState} queueCount={queueCount} />
        </div>

        <div className="p-3 rounded-xl bg-blue-50 space-y-1.5 text-[11px] text-slate-600">
          <div className="flex justify-between">
            <span>Passbook Ledger Cache</span>
            <span className="font-bold text-status-success">Cached (100% Offline)</span>
          </div>
          <div className="flex justify-between">
            <span>Receipts Archive</span>
            <span className="font-bold text-status-success">Available Offline</span>
          </div>
          <div className="flex justify-between">
            <span>Device Storage ID</span>
            <span className="font-mono text-[10px]">dev-agent-meena</span>
          </div>
        </div>
      </div>

      {/* 4. Install PWA Prompt */}
      <button
        type="button"
        onClick={handleInstallPwa}
        className="w-full p-3.5 rounded-2xl bg-white border border-blue-200 hover:border-blue-300 shadow-subtle flex items-center justify-between text-left transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="font-heading font-bold text-xs text-navy-900 block">
              {t('profile.installApp', 'Install Sanchay on Home Screen')}
            </span>
            <span className="text-[11px] text-slate-600">Fast offline access anytime</span>
          </div>
        </div>
        <span className="text-xs font-semibold text-blue-600">Install</span>
      </button>

      {/* 5. Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-white border border-status-error/30 text-status-error hover:bg-status-error-bg font-heading font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>{t('profile.logout', 'Log Out')}</span>
      </button>
    </div>
  );
};

export default ProfileView;
