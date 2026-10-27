import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Coins,
  History,
  Megaphone,
  AlertTriangle,
  Settings,
  RefreshCw,
  LogOut,
  Globe,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { RoleSwitcher } from '../../shared/components/RoleSwitcher';
import { getRepository } from '../../shared/data';
import { changeLanguage } from '../../shared/i18n';
import logo from '../../assets/sanchay-logo.png';

export const AdminSidebar: React.FC = () => {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const repo = getRepository();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(repo.getPendingSyncCount());
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(() => {
      setPendingCount(repo.getPendingSyncCount());
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [repo]);

  const navLinks = [
    { to: '/admin', end: true, label: t('admin:nav.home', 'Dashboard'), icon: LayoutDashboard },
    { to: '/admin/members', label: t('admin:nav.members', 'Members'), icon: Users },
    { to: '/admin/add', label: t('admin:nav.add', 'Add Entry'), icon: PlusCircle },
    { to: '/admin/loans', label: t('admin:nav.loans', 'Loans & Credit'), icon: Coins },
    { to: '/admin/history', label: t('admin:nav.history', 'Ledger History'), icon: History },
    { to: '/admin/announcements', label: t('admin:nav.announcements', 'Announcements'), icon: Megaphone },
    { to: '/admin/conflicts', label: t('admin:nav.conflicts', 'Conflicts & Review'), icon: AlertTriangle },
    { to: '/admin/settings', label: t('admin:nav.settings', 'Group Settings'), icon: Settings },
    { to: '/admin/sync', label: t('admin:nav.sync', 'Offline & Sync'), icon: RefreshCw },
  ];

  const handleLogout = async () => {
    await repo.logout();
    navigate('/login', { replace: true });
  };

  const handleLang = (lang: 'en' | 'hi' | 'mr') => {
    changeLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <aside className="w-60 bg-[#1F1F2E] min-h-screen hidden md:flex flex-col justify-between shrink-0 shadow-xl select-none text-white">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Sanchay Logo" className="w-8 h-8 rounded-full bg-white p-1" />
            <div>
              <b className="text-white text-sm tracking-[0.2em] font-heading block leading-none">SANCHAY</b>
              <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Admin Portal</span>
            </div>
          </div>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Language"
            >
              <Globe className="w-4 h-4 text-blue-400" />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-[#2A2A3D] rounded-xl shadow-xl border border-white/10 py-1 z-50 text-xs font-semibold text-white">
                <button onClick={() => handleLang('en')} className="w-full text-left px-3 py-1.5 hover:bg-white/10">English</button>
                <button onClick={() => handleLang('hi')} className="w-full text-left px-3 py-1.5 hover:bg-white/10">हिन्दी</button>
                <button onClick={() => handleLang('mr')} className="w-full text-left px-3 py-1.5 hover:bg-white/10">मराठी</button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation items from frontend admin */}
        <nav className="p-3 space-y-1 text-[13px]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors font-medium',
                    isActive
                      ? 'bg-white/15 text-white font-bold shadow-xs'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-blue-300" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer & Status */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Role Switcher if applicable */}
        <RoleSwitcher />

        {/* Sync & Connectivity Status from frontend admin */}
        <div
          className={cn(
            'text-[11px] px-3 py-2 rounded-full text-center font-medium transition-all',
            isOnline
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          )}
        >
          {isOnline ? '● Online - Auto Sync ON' : '○ Offline Mode'}
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('common:logout', 'Logout')}</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
