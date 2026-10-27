import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Coins,
  MoreHorizontal,
  History,
  Megaphone,
  AlertTriangle,
  Settings,
  RefreshCw,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminBottomNav: React.FC = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainTabs = [
    { to: '/admin', end: true, label: t('admin:nav.home', 'Home'), icon: LayoutDashboard },
    { to: '/admin/members', label: t('admin:nav.members', 'Members'), icon: Users },
    { to: '/admin/add', label: t('admin:nav.add', 'Add'), icon: PlusCircle, highlight: true },
    { to: '/admin/loans', label: t('admin:nav.loans', 'Loans'), icon: Coins },
  ];

  const moreTabs = [
    { to: '/admin/history', label: t('admin:nav.history', 'Ledger History'), icon: History },
    { to: '/admin/announcements', label: t('admin:nav.announcements', 'Announcements'), icon: Megaphone },
    { to: '/admin/conflicts', label: t('admin:nav.conflicts', 'Conflicts'), icon: AlertTriangle },
    { to: '/admin/settings', label: t('admin:nav.settings', 'Settings'), icon: Settings },
    { to: '/admin/sync', label: t('admin:nav.sync', 'Sync Diagnostics'), icon: RefreshCw },
  ];

  return (
    <>
      {/* "More" Drawer for mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-40 bg-navy-900/40 backdrop-blur-xs md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative bg-white rounded-t-3xl border-t border-blue-200 p-5 shadow-elevated safe-bottom z-50 animate-slide-up">
            <div className="flex justify-between items-center pb-3 border-b border-blue-100 mb-3">
              <h3 className="text-sm font-bold text-navy-900">More Admin Options</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-navy-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMoreMenu(false)}
                    className={({ isActive }: { isActive: boolean }) =>
                      cn(
                        'flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition',
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-blue-50/50 text-navy-900 border-blue-200 hover:bg-blue-100/50'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-blue-200 safe-bottom shadow-elevated md:hidden"
        aria-label="Admin Mobile Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16">
          {mainTabs.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) =>
                  cn(
                    'relative flex flex-col items-center justify-center touch-target text-xs transition-colors select-none py-1',
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-navy-900 font-normal'
                  )
                }
              >
                {({ isActive }: { isActive: boolean }) => (
                  <>
                    <div className="relative">
                      {item.highlight ? (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center -mt-2 shadow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                      ) : (
                        <Icon className={cn('w-5 h-5 mb-1 transition-transform', isActive && 'scale-110')} />
                      )}
                    </div>
                    <span className="truncate max-w-[64px] text-[11px]">{item.label}</span>
                    {isActive && !item.highlight && (
                      <span className="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* 5th Tab: More */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="relative flex flex-col items-center justify-center touch-target text-xs text-slate-600 hover:text-navy-900 font-normal py-1"
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-[11px]">{t('admin:nav.more', 'More')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default AdminBottomNav;
