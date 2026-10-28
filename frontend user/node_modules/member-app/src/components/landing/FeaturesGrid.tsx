import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  WifiOff,
  GitMerge,
  Wallet,
  CalendarCheck,
  FileDown,
  Camera,
} from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const FeaturesGrid: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: WifiOff,
      title: 'Works with zero internet',
      desc: 'Record deposits, loans, and meeting attendance anywhere. Never wait for connectivity.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
    {
      icon: GitMerge,
      title: 'Smart sync, no silent overwrites',
      desc: 'If two leaders enter details offline, both versions are kept transparently for meeting review.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
    {
      icon: Wallet,
      title: 'Clear running balance per member',
      desc: 'Real-time personal savings and total group fund calculated in exact paise with zero math errors.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
    {
      icon: CalendarCheck,
      title: 'Simple loan tracking & schedules',
      desc: 'Transparent reducing-interest EMI tables with exact monthly principal and interest breakdowns.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
    {
      icon: FileDown,
      title: 'Downloadable PDF receipts',
      desc: 'Generate official digital passbook receipts right on your device, even when completely offline.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
    {
      icon: Camera,
      title: 'On-device Aadhaar card scan',
      desc: 'Scan membership cards instantly with device OCR. Your photo is never uploaded or saved.',
      color: 'text-blue-600',
      bg: 'bg-blue-100 border border-blue-200',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-transparent relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              Engineered for Trust
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Everything Your Bachat Gat Needs
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Six essential capabilities designed for village community self-reliance and complete financial transparency.
            </p>
          </Reveal>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <Reveal key={idx} delayMs={idx * 80}>
                <div className="p-7 rounded-3xl bg-white border border-blue-200 hover:border-blue-300 hover:-translate-y-1 transition-all duration-200 shadow-subtle hover:shadow-card flex flex-col justify-between h-full group focus-within:ring-2 focus-within:ring-blue-300">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-2xl ${feat.bg} ${feat.color} flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <h3 className="font-heading font-bold text-lg text-navy-900 tracking-tight leading-snug">
                      {feat.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
