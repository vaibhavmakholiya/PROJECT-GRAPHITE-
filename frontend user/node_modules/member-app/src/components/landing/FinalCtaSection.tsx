import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const FinalCtaSection: React.FC = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install Sanchay, tap your browser menu (⋮ or Share) and select "Install App" or "Add to Home Screen".');
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-blue-700 text-white relative overflow-hidden">
      {/* Concentric Circle Motif */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full border border-white/20 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold tracking-wide backdrop-blur-sm shadow-subtle">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Empower Your Village Savings Group</span>
          </div>
        </Reveal>

        <Reveal delayMs={100}>
          <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-white leading-tight">
            Start Your Group&apos;s Ledger Today
          </h2>
        </Reveal>

        <Reveal delayMs={180}>
          <p className="text-base sm:text-lg text-blue-100 leading-relaxed max-w-xl mx-auto font-medium">
            Join hundreds of women in self-help groups who have discarded torn paper diaries for a permanent, transparent digital passbook that never needs internet.
          </p>
        </Reveal>

        <Reveal delayMs={260}>
          {/* Dual Action Buttons (Fix 1: min-h-[48px], high contrast) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto min-h-[48px] px-8 py-3.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-heading font-bold text-sm shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-2xl bg-blue-800/60 hover:bg-blue-800 border-2 border-white/30 text-white font-heading font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-subtle focus:outline-none focus:ring-3 focus:ring-blue-300"
            >
              <Download className="w-4 h-4" />
              <span>Install App on Phone</span>
            </button>
          </div>
        </Reveal>

        <Reveal delayMs={320}>
          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-blue-100">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Free for community groups
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" /> Zero storage fees
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
