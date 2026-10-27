import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Heart } from 'lucide-react';
import { changeLanguage } from '../../i18n';

export const LandingFooter: React.FC = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
  ] as const;

  return (
    <footer className="bg-navy-900 text-slate-300 py-14 border-t border-blue-700/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start justify-between">
          {/* Brand & Vision */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 flex items-center justify-center p-1 shadow-subtle shrink-0">
                <img
                  src="/logo.png"
                  alt="Sanchay"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-heading font-extrabold text-xl text-white tracking-tight">
                Sanchay
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              An offline-first community savings-group passbook and ledger engineered for self-help groups (SHG / Bachat Gat) in low-connectivity areas.
            </p>
            <div className="text-[11px] text-blue-200/80 font-mono">
              Built for Hackathon Problem Statement 12 (Fintech)
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <div className="md:col-span-4 space-y-2 text-xs">
            <p className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Navigation
            </p>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy & Trust</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <Link to="/login" className="text-blue-400 font-bold hover:underline">Member Login →</Link>
            </div>
          </div>

          {/* Language Selector */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <p className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Language / भाषा
            </p>
            <div className="flex flex-wrap gap-2">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => changeLanguage(l.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    i18n.language === l.code
                      ? 'bg-blue-600 text-white shadow-subtle'
                      : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Attribution Bar */}
        <div className="pt-8 border-t border-blue-700/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <p>
            © {new Date().getFullYear()} Sanchay · Prototype Project for Rural Fintech Inclusion.
          </p>
          <p className="text-[11px] text-slate-400">
            * Sanchay is a functional hackathon prototype. No real money or bank accounts are linked.
          </p>
        </div>
      </div>
    </footer>
  );
};
