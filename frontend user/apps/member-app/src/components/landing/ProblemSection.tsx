import React from 'react';
import { useTranslation } from 'react-i18next';
import { Reveal } from '../common/Reveal';

export const ProblemSection: React.FC = () => {
  const { t } = useTranslation();

  const cards = [
    {
      title: t('landing.problem.card1Title', 'The notebook gets lost'),
      desc: t(
        'landing.problem.card1Desc',
        'Physical paper diaries tear, get water-damaged in monsoons, or are left behind when leaders change.'
      ),
      iconColor: '#1D6DB5',
      iconBg: '#E3F1FD',
      renderIcon: () => (
        <svg viewBox="0 0 48 48" className="w-8 h-8 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 8h24a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" />
          <path d="M6 16h32" />
          <path d="M14 24l6 6 12-12" stroke="#1D6DB5" opacity="0.4" />
          <path d="M12 34l8-8" stroke="#1D6DB5" />
          <path d="M20 34l-8-8" stroke="#1D6DB5" />
        </svg>
      ),
    },
    {
      title: t('landing.problem.card2Title', 'Someone says they paid, but paper says they didn’t'),
      desc: t(
        'landing.problem.card2Desc',
        'When monthly entries are scribbled in ink, overwritten digits lead to misunderstandings and mistrust.'
      ),
      iconColor: '#1D6DB5',
      iconBg: '#E3F1FD',
      renderIcon: () => (
        <svg viewBox="0 0 48 48" className="w-8 h-8 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="18" />
          <path d="M24 16v10" />
          <circle cx="24" cy="32" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: t('landing.problem.card3Title', 'The app needs internet you don’t have'),
      desc: t(
        'landing.problem.card3Desc',
        'Standard banking apps spin infinitely when mobile signal drops. Meetings can’t wait for internet towers.'
      ),
      iconColor: '#1D6DB5',
      iconBg: '#E3F1FD',
      renderIcon: () => (
        <svg viewBox="0 0 48 48" className="w-8 h-8 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="4" x2="44" y2="44" stroke="#1D6DB5" strokeWidth="3" />
          <path d="M10 20a16 16 0 0 1 28 0" opacity="0.4" />
          <path d="M16 26a10 10 0 0 1 16 0" />
          <circle cx="24" cy="36" r="3" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white border-y border-blue-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              The Reality Today
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              {t('landing.problem.title', 'The Notebook Problem')}
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              {t(
                'landing.problem.subtitle',
                'Millions of self-help groups manage community wealth on fragile notebooks. One drop of rain or forgotten pen entry creates conflict.'
              )}
            </p>
          </Reveal>
        </div>

        {/* 3 Staggered Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {cards.map((card, idx) => (
            <Reveal key={idx} delayMs={idx * 150} className="h-full">
              <div className="h-full p-7 rounded-3xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 shadow-subtle hover:shadow-card flex flex-col justify-between">
                <div className="space-y-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-subtle border border-blue-200"
                    style={{ backgroundColor: card.iconBg, color: card.iconColor }}
                  >
                    {card.renderIcon()}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-navy-900 tracking-tight leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-blue-200 flex items-center gap-2 text-xs font-bold text-blue-600">
                  <span>Solved with Sanchay</span>
                  <span>→</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
