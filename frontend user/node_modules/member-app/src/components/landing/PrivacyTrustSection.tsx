import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, EyeOff, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const PrivacyTrustSection: React.FC = () => {
  const { t } = useTranslation();

  const promises = [
    {
      icon: EyeOff,
      title: 'Your Aadhaar photo is never uploaded',
      desc: 'Our optical card reader runs 100% inside your phone browser using WebAssembly. The picture is erased from device memory the second scanning finishes.',
    },
    {
      icon: Lock,
      title: 'We never store your 12-digit number',
      desc: 'Only the last 4 digits (e.g. XXXX-XXXX-1234) and a one-way cryptographic hash are saved for identity confirmation. Your full number is never written to disk or database.',
    },
    {
      icon: FileText,
      title: 'Records are never erased or hidden',
      desc: 'Sanchay is an append-only ledger. When mistakes happen, a transparent correction entry is added with a reason. Nobody can secretly wipe or alter a deposit.',
    },
  ];

  return (
    <section id="privacy" className="py-20 sm:py-28 bg-navy-900 text-white relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-blue-700/30 pointer-events-none -z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-blue-500/20 pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-700/40 border border-blue-600 text-blue-200 text-xs font-bold tracking-wide shadow-subtle">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>Honest Commitments</span>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-5xl tracking-tight text-white">
              Privacy and Trust We Actually Implement
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-blue-100 leading-relaxed max-w-xl mx-auto font-normal">
              No marketing buzzwords or invented certificates. Here is exactly how our code protects your group&apos;s data.
            </p>
          </Reveal>
        </div>

        {/* Animated Shield Visual + 3 Pillars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Animated Shield SVG */}
          <div className="lg:col-span-4 flex justify-center">
            <Reveal delayMs={150} direction="none">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-600/10 animate-pulse" />
                <svg
                  viewBox="0 0 100 100"
                  className="w-36 h-36 sm:w-44 sm:h-44 stroke-blue-300"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer Shield Outline */}
                  <path
                    d="M 50 10 Q 80 18 85 45 Q 85 75 50 90 Q 15 75 15 45 Q 20 18 50 10 Z"
                    className="stroke-blue-300"
                  />
                  {/* Inner Checkmark */}
                  <path
                    d="M 35 50 L 45 60 L 65 40"
                    stroke="#1E8E5A"
                    strokeWidth="4"
                  />
                </svg>
              </div>
            </Reveal>
          </div>

          {/* 3 Commitment Cards */}
          <div className="lg:col-span-8 space-y-4">
            {promises.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <Reveal key={idx} delayMs={idx * 120}>
                  <div className="p-6 rounded-3xl bg-white/10 border border-blue-700/50 hover:border-blue-400 transition-colors shadow-subtle flex items-start gap-4 backdrop-blur-sm">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-subtle">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-lg text-white">
                        {p.title}
                      </h3>
                      <p className="text-sm text-blue-100/90 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
