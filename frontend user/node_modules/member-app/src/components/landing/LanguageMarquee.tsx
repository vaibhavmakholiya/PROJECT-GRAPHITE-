import React from 'react';
import { Globe } from 'lucide-react';

export const LanguageMarquee: React.FC = () => {
  const languageItems = [
    'English',
    'हिन्दी',
    'मराठी',
    'English',
    'हिन्दी',
    'मराठी',
    'English',
    'हिन्दी',
    'मराठी',
    'English',
    'हिन्दी',
    'मराठी',
  ];

  return (
    <section className="py-12 bg-blue-100 border-y border-blue-200 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 text-center">
        <p className="text-xs uppercase font-extrabold tracking-wider text-blue-700 flex items-center justify-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>Multilingual from Day One</span>
        </p>
        <p className="text-sm font-semibold text-navy-900 mt-1 max-w-lg mx-auto">
          Every screen, label, receipt, and error message is written in plain sentences for first-time smartphone users.
        </p>
      </div>

      {/* Infinite Scrolling Ticker (Pauses on Hover / Focus) */}
      <div className="relative w-full overflow-hidden group">
        <div className="flex w-max space-x-8 animate-marquee group-hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
          {[...languageItems, ...languageItems].map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-4 text-xl sm:text-2xl font-heading font-extrabold text-blue-700 whitespace-nowrap"
            >
              <span>{item}</span>
              <span className="text-blue-400 text-sm">●</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
