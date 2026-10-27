import React, { useState } from 'react';
import { Globe, LogOut } from 'lucide-react';
import { SyncBadge } from '../../components/common/SyncBadge';
import { RoleSwitcher } from '../../shared/components/RoleSwitcher';
import { changeLanguage } from '../../shared/i18n';
import { getRepository } from '../../shared/data';
import logo from '../../assets/sanchay-logo.png';

export const AdminHeader: React.FC = () => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const repo = getRepository();

  const handleLangSelect = (lang: 'en' | 'hi' | 'mr') => {
    changeLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-blue-200 safe-top shadow-xs md:hidden">
      <div className="px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Sanchay Logo" className="w-9 h-9 rounded-xl shadow-xs" />
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm text-navy-900 tracking-tight leading-tight">
              SANCHAY
            </span>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RoleSwitcher compact />
          <SyncBadge />

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
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-navy-900"
                >
                  English
                </button>
                <button
                  onClick={() => handleLangSelect('hi')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-navy-900"
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => handleLangSelect('mr')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 text-navy-900"
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

export default AdminHeader;
