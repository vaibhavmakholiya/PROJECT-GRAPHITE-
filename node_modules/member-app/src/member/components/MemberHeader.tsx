import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, LogOut, Home, BookOpen, Coins, Bell, User } from 'lucide-react';
import { Member } from '@sanchay/core';
import { SyncBadge } from '../../components/common/SyncBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { RoleSwitcher } from '../../shared/components/RoleSwitcher';
import { changeLanguage } from '../../shared/i18n';
import { getRepository } from '../../shared/data';
import logo from '../../assets/sanchay-logo.png';

interface MemberHeaderProps {
  member?: Member | null;
  onLogout?: () => void;
}

export const MemberHeader: React.FC<MemberHeaderProps> = ({ member, onLogout }) => {
  const { t, i18n } = useTranslation(['member', 'common']);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const repo = getRepository();

  const handleLangSelect = (lang: 'en' | 'hi' | 'mr') => {
    changeLanguage(lang);
    setShowLangMenu(false);
  };

  const currentLang = i18n.language || 'en';

  const navLinks = [
    { to: '/app', label: t('member:nav.home', 'Home'), icon: Home, end: true },
    { to: '/app/transactions', label: t('member:nav.transactions', 'Passbook'), icon: BookOpen },
    { to: '/app/loans', label: t('member:nav.loans', 'Loans'), icon: Coins },
    { to: '/app/alerts', label: t('member:nav.alerts', 'Alerts'), icon: Bell },
    { to: '/app/profile', label: t('member:nav.profile', 'Profile'), icon: User },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-200 safe-top shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="Sanchay Logo" className="w-9 h-9 rounded-xl shadow-xs" />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm text-navy-900 tracking-tight leading-tight">
              SANCHAY
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Member Passbook</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }: { isActive: boolean }) =>
                  `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-blue-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Role Switcher if dual-role */}
          <RoleSwitcher compact />

          {/* Sync Badge */}
          <SyncBadge />

          {/* Language Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-xl text-slate-600 hover:text-navy-900 hover:bg-blue-50 transition border border-transparent hover:border-blue-200"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-blue-600" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-blue-200 py-1 z-50 text-xs font-semibold">
                <button
                  onClick={() => handleLangSelect('en')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${currentLang === 'en' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-navy-900'}`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLangSelect('hi')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${currentLang === 'hi' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-navy-900'}`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => handleLangSelect('mr')}
                  className={`w-full text-left px-3 py-1.5 hover:bg-blue-50 ${currentLang === 'mr' ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-navy-900'}`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default MemberHeader;
