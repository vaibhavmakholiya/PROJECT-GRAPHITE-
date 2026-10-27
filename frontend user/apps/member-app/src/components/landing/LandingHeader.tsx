import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, ArrowRight, ShieldCheck } from 'lucide-react';
import { changeLanguage } from '../../i18n';

export const LandingHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'hi', label: 'हिन्दी', short: 'HI' },
    { code: 'mr', label: 'मराठी', short: 'MR' },
  ] as const;

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const navLinks = [
    { label: t('landing.nav.howItWorks', 'How it works'), href: '#how-it-works' },
    { label: t('landing.nav.demo', 'Live Demo'), href: '#demo' },
    { label: t('landing.nav.features', 'Features'), href: '#features' },
    { label: t('landing.nav.privacy', 'Privacy & Trust'), href: '#privacy' },
    { label: t('landing.nav.faq', 'FAQ'), href: '#faq' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-subtle border-b border-blue-200'
            : 'bg-white border-b border-blue-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          {/* Logo & Brand (Fix 2: Logo >= 40px in white badge, FINTECH PROTOTYPE moved out) */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-white border border-blue-200 flex items-center justify-center p-1 shadow-subtle shrink-0">
              <img
                src="/logo.png"
                alt="Sanchay Community Circle Logo"
                className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
                Sanchay
              </span>
              <span className="text-xs text-slate-600 -mt-0.5 font-medium hidden sm:inline">
                {t('landing.tagline', 'Offline-First Savings Group Ledger')}
              </span>
            </div>
          </Link>

          {/* Fintech Prototype Badge (Fix 2: Beside nav on desktop, hidden on mobile) */}
          <div className="hidden lg:flex items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Fintech Prototype
            </span>
          </div>

          {/* Desktop Navigation Anchors */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-blue-600 transition-colors relative py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-semibold text-navy-900 hover:border-blue-300 transition-colors cursor-pointer shadow-subtle min-h-[44px]"
                aria-label="Change Language"
                aria-expanded={isLangOpen}
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span>{currentLang.label}</span>
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-elevated border border-blue-200 py-1.5 z-50 animate-fade-in">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        changeLanguage(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        i18n.language === l.code
                          ? 'text-blue-600 font-bold bg-blue-50'
                          : 'text-navy-900'
                      }`}
                    >
                      <span>{l.label}</span>
                      {i18n.language === l.code && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary CTA (Fix 1: min-h-[48px], blue-600 bg, white text, focus ring) */}
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-heading font-bold shadow-subtle hover:shadow-elevated transition-all flex items-center gap-2 group cursor-pointer min-h-[48px] focus:outline-none focus:ring-3 focus:ring-blue-300"
            >
              <span>{t('landing.header.openApp', 'Open Sanchay')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl border border-blue-200 bg-white text-navy-900 hover:text-blue-600 focus:outline-none cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center shadow-subtle"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-blue-200 px-5 py-5 space-y-4 animate-slide-up shadow-elevated">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-semibold text-navy-900 hover:text-blue-600 py-1.5"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-3 border-t border-blue-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Language:</span>
              <div className="flex gap-1.5">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      changeLanguage(l.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      i18n.language === l.code
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-navy-900 border border-blue-200'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full min-h-[48px] py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center font-heading font-bold text-sm shadow-subtle flex items-center justify-center gap-2 focus:outline-none focus:ring-3 focus:ring-blue-300"
            >
              <span>{t('landing.header.openApp', 'Open Sanchay')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom CTA Bar (Fix 1: min-h-[48px] primary CTA) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-blue-200 px-4 py-2.5 flex items-center justify-between gap-3 shadow-elevated safe-bottom">
        <div className="text-xs">
          <p className="font-bold text-navy-900">Sanchay Passbook</p>
          <p className="text-[11px] text-slate-600">Works with zero internet</p>
        </div>
        <Link
          to="/register"
          className="min-h-[48px] py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-subtle focus:outline-none focus:ring-3 focus:ring-blue-300"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </>
  );
};
