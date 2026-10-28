import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Reveal } from '../common/Reveal';

interface FaqItem {
  q: string;
  a: string;
}

export const FaqAccordion: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: 'Does it really work without internet?',
      a: 'Yes. Once the app is opened, all passbook entries, balance calculations, receipts, and loans work 100% offline. Note: Only initial registration requires internet once to receive a phone verification OTP code.',
    },
    {
      q: 'What happens if two leaders enter the same contribution while offline?',
      a: 'Neither record is silently overwritten or lost. When both devices reconnect, Sanchay displays both versions side-by-side with an amber "Needs Review" card. The group leader reviews the entries in the meeting and can post an explicit reversal entry, keeping the full ledger auditable.',
    },
    {
      q: 'Does every single member need their own smartphone?',
      a: 'No. In most villages, only the group president or secretary needs a smartphone during meetings to record collections. Any member who does own a phone can log in anytime to view their personal balance and download receipts.',
    },
    {
      q: 'Is my Aadhaar card safe on my phone?',
      a: 'Yes. The card scanning runs entirely in your local browser memory using on-device WebAssembly OCR. Your photo is never uploaded to any cloud server, never saved to disk, and immediately wiped from memory as soon as text extraction finishes.',
    },
    {
      q: 'Can I get an official receipt for my payments?',
      a: 'Yes. You can generate and download a formal digital receipt PDF with a single tap, even when completely offline. It includes the group stamp, president signature marker, and contribution details.',
    },
    {
      q: 'Can I use Sanchay on my laptop or computer?',
      a: 'Yes. Sanchay is built as an offline-first Progressive Web App (PWA). You can open it in Chrome, Edge, Safari, or Firefox on any smartphone, tablet, or desktop computer.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 sm:py-24 bg-white/80 backdrop-blur-md border-y border-blue-200/80 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-14">
          <Reveal>
            <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-subtle">
              Common Questions
            </span>
          </Reveal>

          <Reveal delayMs={100}>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-navy-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </Reveal>

          <Reveal delayMs={180}>
            <p className="text-base text-slate-600 leading-relaxed font-medium">
              Transparent, honest answers about how Sanchay works in low-connectivity areas.
            </p>
          </Reveal>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={idx} delayMs={idx * 60}>
                <div className="rounded-2xl border border-blue-200 bg-blue-50 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    aria-expanded={isOpen}
                  >
                    <span className="font-heading font-bold text-base text-navy-900">
                      {faq.q}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-blue-600 text-white border-blue-600' : 'bg-white border-blue-200 text-slate-600'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-blue-200/70 pt-3 animate-fade-in font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
