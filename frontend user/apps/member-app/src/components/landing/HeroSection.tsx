import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, WifiOff } from 'lucide-react';
import { HeroIllustration } from './HeroIllustration';
import { Reveal } from '../common/Reveal';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 overflow-hidden bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <Reveal delayMs={50}>
              {/* Status Pill (Fix 3: Works with zero internet + WifiOff, no unsourced stats) */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-subtle">
                <WifiOff className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('landing.hero.badge', 'Works with zero internet')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
              </div>
            </Reveal>

            <Reveal delayMs={120}>
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-navy-900 tracking-tight leading-[1.12]">
                {t('landing.hero.title', 'Every rupee, remembered.')}
              </h1>
            </Reveal>

            <Reveal delayMs={200}>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                {t(
                  'landing.hero.subtitle',
                  "Sanchay keeps your group's savings safe, even when the internet isn't there. An offline passbook designed for self-help groups."
                )}
              </p>
            </Reveal>

            <Reveal delayMs={280}>
              {/* Dual Action Buttons (Fix 1: min-h-[48px], blue-600 primary, white secondary) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/register"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-sm shadow-card hover:shadow-elevated transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-3 focus:ring-blue-300"
                >
                  <span>{t('landing.hero.getStarted', 'Get Started')}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-2xl bg-white border-[1.5px] border-blue-200 text-blue-600 hover:bg-blue-100/50 hover:border-blue-300 font-heading font-semibold text-sm transition-all shadow-subtle flex items-center justify-center focus:outline-none focus:ring-3 focus:ring-blue-300"
                >
                  <span>{t('landing.hero.seeHow', 'See how it works')}</span>
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Hero SVG Animation */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <Reveal delayMs={200} direction="none" className="w-full">
              <HeroIllustration />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
