import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, Coins, Bell, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAlerts } from '../../hooks/useAlerts';

interface BottomNavProps {
  memberId?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ memberId }) => {
  const { t } = useTranslation();
  const { unreadCount } = useAlerts(memberId);

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.home', 'Home'),
      icon: Home,
    },
    {
      to: '/transactions',
      label: t('nav.transactions', 'Passbook'),
      icon: BookOpen,
    },
    {
      to: '/loans',
      label: t('nav.loans', 'Loans'),
      icon: Coins,
    },
    {
      to: '/alerts',
      label: t('nav.alerts', 'Alerts'),
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      to: '/profile',
      label: t('nav.profile', 'Profile'),
      icon: User,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-blue-200 safe-bottom shadow-elevated"
      aria-label="Primary Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
                    <Icon className={cn('w-5 h-5 mb-1 transition-transform', isActive && 'scale-110')} />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold leading-tight">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="truncate max-w-[64px] text-[11px]">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
