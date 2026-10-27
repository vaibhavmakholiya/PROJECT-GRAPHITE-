import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WifiOff, Wifi, GitMerge, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Reveal } from '../common/Reveal';

export const HowItWorksSticky: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      badge: 'Step 1: Offline First',
      title: 'Record anything with no internet',
      desc: 'During monthly meetings under a banyan tree or village hall with zero signal, enter savings contributions, loan repayments, or attendance. Everything saves immediately on your device storage.',
      screenHeader: 'Monthly Collection (Offline)',
      screenContent: (
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-amber-800">
              <WifiOff className="w-3.5 h-3.5" />
              Offline Mode
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 font-semibold text-amber-900 text-[10px]">
              Saved on this phone
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2 text-xs shadow-subtle">
            <div className="flex justify-between items-center font-bold">
              <span className="text-navy-900">Sunita Devi</span>
              <span className="text-blue-600">+₹500</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Monthly Share</span>
              <span className="font-mono text-status-amber font-semibold">Queued (Device #1)</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2 text-xs shadow-subtle">
            <div className="flex justify-between items-center font-bold">
              <span className="text-navy-900">Kavita Patil</span>
              <span className="text-blue-600">+₹500</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Monthly Share</span>
              <span className="font-mono text-status-amber font-semibold">Queued (Device #1)</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      badge: 'Step 2: Auto Sync',
      title: 'Sync automatically when signal returns',
      desc: 'Whenever anyone in the committee walks near the highway or gets mobile signal, Sanchay detects connectivity and syncs all queued entries in the background. No manual export needed.',
      screenHeader: 'Connected to Network',
      screenContent: (
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between p-2 rounded-xl bg-status-success-bg border border-status-success-border text-xs">
            <span className="flex items-center gap-1.5 font-bold text-status-success">
              <Wifi className="w-3.5 h-3.5" />
              Signal Restored
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white font-semibold text-status-success text-[10px] border border-status-success-border">
              2 entries synced
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-status-success-border space-y-2 text-xs shadow-subtle animate-fade-in">
            <div className="flex justify-between items-center font-bold">
              <span className="text-navy-900">Sunita Devi</span>
              <span className="text-status-success">+₹500</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Verified Ledger Entry</span>
              <span className="inline-flex items-center gap-1 text-status-success font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-status-success-border space-y-2 text-xs shadow-subtle animate-fade-in">
            <div className="flex justify-between items-center font-bold">
              <span className="text-navy-900">Kavita Patil</span>
              <span className="text-status-success">+₹500</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Verified Ledger Entry</span>
              <span className="inline-flex items-center gap-1 text-status-success font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      badge: 'Step 3: Conflict Transparency',
      title: 'Nothing is silently overwritten',
      desc: 'If two group leaders record entries while both offline, Sanchay keeps both versions visible. Leaders review differences transparently at the next meeting and post a correction, preserving audit integrity.',
      screenHeader: 'Audit Review',
      screenContent: (
        <div className="space-y-3 text-left">
          <div className="p-2.5 rounded-xl bg-status-amber-bg border border-status-amber-border text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-status-amber">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Two entries entered offline</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Both records preserved in append-only ledger for group review.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white rounded-xl border border-blue-200 space-y-1">
              <p className="font-bold text-navy-900">Version A (Sunita)</p>
              <p className="font-mono text-blue-600 font-bold">₹500 Paid</p>
              <p className="text-[10px] text-slate-600">10:15 AM (Cash)</p>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-blue-200 space-y-1">
              <p className="font-bold text-navy-900">Version B (Meena)</p>
              <p className="font-mono text-blue-600 font-bold">₹600 Paid</p>
              <p className="text-[10px] text-slate-600">10:22 AM (Cash)</p>
            </div>
          </div>

          <div className="p-2 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-center font-medium text-navy-900">
            Status: <span className="font-bold text-status-amber">Needs Meeting Review</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-blue-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-16">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              Simple 3-Step Process
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              {t('landing.howItWorks.title', 'How Sanchay Works')}
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Engineered specifically for low-connectivity rural communities where digital ledgers normally break down.
            </p>
          </Reveal>
        </div>

        {/* Desktop Sticky Scroll / Interactive Switcher */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Steps List */}
          <div className="lg:col-span-6 space-y-4">
            {steps.map((st, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={st.id}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white border-blue-600 shadow-card ring-1 ring-blue-600/20'
                      : 'bg-white/70 border-blue-200 hover:bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-bold text-xs ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-subtle'
                          : 'bg-blue-100 text-slate-600'
                      }`}
                    >
                      {st.id}
                    </span>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                      {st.badge}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-navy-900 mb-1.5">
                    {st.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Sticky Phone Mockup Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[340px] aspect-[1/2] rounded-[44px] bg-navy-900 p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col justify-between">
              {/* Speaker & Camera Notch */}
              <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2" />

              {/* Phone Display Area */}
              <div className="flex-1 bg-white rounded-[32px] p-4 flex flex-col justify-between overflow-hidden relative border border-blue-200">
                <div>
                  {/* Mock Mini App Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                        S
                      </div>
                      <span className="font-heading font-bold text-xs text-navy-900">
                        Pragati Bachat Gat
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-medium">10:30 AM</span>
                  </div>

                  <h4 className="font-heading font-bold text-xs text-navy-900 mb-3 text-left">
                    {steps[activeStep].screenHeader}
                  </h4>

                  {/* Active Step Content */}
                  <div className="transition-all duration-300">
                    {steps[activeStep].screenContent}
                  </div>
                </div>

                {/* Bottom Home Indicator */}
                <div className="pt-4 border-t border-blue-200 text-center">
                  <div className="w-20 h-1 bg-blue-200 rounded-full mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
