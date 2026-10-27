import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { changeLanguage } from '../i18n';
import { useAuth } from '../hooks/useAuth';

export const SplashView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isActive } = useAuth();
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>(
    (i18n.language as 'en' | 'hi' | 'mr') || 'en'
  );

  // Check if splash animation has already run in this browser session
  const [hasAnimated, setHasAnimated] = useState<boolean>(() => {
    return sessionStorage.getItem('sanchay_splash_animated') === 'true';
  });

  useEffect(() => {
    if (!hasAnimated) {
      sessionStorage.setItem('sanchay_splash_animated', 'true');
      setHasAnimated(true);
    }
  }, [hasAnimated]);

  const handleSelectLanguage = (lang: 'en' | 'hi' | 'mr') => {
    setSelectedLang(lang);
    changeLanguage(lang);
  };

  const handleContinue = () => {
    if (isAuthenticated && isActive) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const languages: { code: 'en' | 'hi' | 'mr'; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'Default' },
    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { code: 'mr', label: 'मराठी', sub: 'Marathi' },
  ];

  return (
    <div className="flex flex-col justify-between min-h-full p-6 text-center animate-fade-in">
      {/* Top Brand & Logo */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-32 h-32 mb-5 rounded-3xl bg-white p-3 shadow-elevated border border-blue-200 flex items-center justify-center">
          <img
            src="/logo.png"
            alt="Sanchay Community Logo"
            className={`w-full h-full object-contain ${
              hasAnimated ? '' : 'animate-logo-entrance'
            }`}
          />
        </div>

        <h1 className="font-heading font-extrabold text-3xl text-navy-900 tracking-tight mb-2">
          {t('app.title', 'Sanchay')}
        </h1>
        <p className="text-sm text-blue-600 font-semibold mb-1">
          {t('app.subtitle', 'Community Savings Ledger')}
        </p>
        <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
          {t('splash.description', 'Your trusted community savings passbook, always accessible even without internet.')}
        </p>
      </div>

      {/* Middle: Language Selector */}
      <div className="my-8">
        <label className="block text-xs font-heading font-semibold text-slate-600 uppercase tracking-wider mb-3">
          {t('splash.selectLanguage', 'Select your preferred language')}
        </label>
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleSelectLanguage(l.code)}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                selectedLang === l.code
                  ? 'border-blue-600 bg-blue-100 text-blue-600 font-bold shadow-subtle ring-1 ring-blue-600'
                  : 'border-blue-200 bg-white text-navy-900 hover:border-blue-300'
              }`}
            >
              <span className="text-sm font-semibold">{l.label}</span>
              <span className="text-[10px] text-slate-600">{l.sub}</span>
              {selectedLang === l.code && (
                <Check className="w-3.5 h-3.5 mt-1 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="pb-4 space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
        >
          <span>{t('splash.continue', 'Continue')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
          <span>100% Offline-Resilient & Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};

export default SplashView;
