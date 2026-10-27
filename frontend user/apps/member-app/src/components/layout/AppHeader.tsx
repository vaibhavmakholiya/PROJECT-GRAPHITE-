import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SyncBadge } from '../common/SyncBadge';
import { Avatar } from '../common/Avatar';
import { SyncState } from '../../data/repository';
import { Member } from '@sanchay/core';

interface AppHeaderProps {
  member: Member | null;
  syncState: SyncState;
  queueCount: number;
  onOpenDevDrawer: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  member,
  syncState,
  queueCount,
  onOpenDevDrawer,
}) => {
  const location = useLocation();

  const desktopNav = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Passbook', path: '/transactions' },
    { label: 'Loans', path: '/loans' },
    { label: 'Receipts', path: '/receipts' },
    { label: 'Alerts', path: '/alerts' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-blue-200 safe-top shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
        {/* Brand Logo & SHG title */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl bg-white border border-blue-200 flex items-center justify-center p-1 shadow-subtle shrink-0">
            <img
              src="/logo.png"
              alt="Sanchay"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-navy-900 text-lg tracking-tight">
              Sanchay
            </span>
            <span className="text-[11px] font-medium text-slate-600 truncate max-w-[160px]">
              {member ? 'प्रगती महिला बचत गट' : 'बचत गट वहीखाता'}
            </span>
          </div>
        </Link>

        {/* Desktop Web Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          {desktopNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`py-1 transition-colors ${
                  isActive
                    ? 'text-blue-600 font-bold border-b-2 border-blue-600'
                    : 'hover:text-navy-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Area: Sync status badge + Member Profile link */}
        <div className="flex items-center gap-3">
          <SyncBadge
            state={syncState}
            queueCount={queueCount}
            onClick={onOpenDevDrawer}
          />

          <Link
            to="/"
            className="hidden sm:inline-block text-xs font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl border border-blue-200 hover:border-blue-300 transition-colors bg-white shadow-subtle"
          >
            Public Site ↗
          </Link>

          {member && (
            <Link to="/profile" title={member.name} className="focus:outline-none">
              <Avatar name={member.name} size="sm" className="ring-2 ring-transparent hover:ring-blue-300 transition-all bg-blue-600" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
