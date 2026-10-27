import React, { useState, useEffect } from 'react';
import { CountUp } from '../common/CountUp';

export const HeroIllustration: React.FC = () => {
  const [activeCoinIndex, setActiveCoinIndex] = useState(0);
  const [pulsePot, setPulsePot] = useState(false);
  const [totalPotValue, setTotalPotValue] = useState(125000);

  // Staggered loop for coins arcing into the central savings pot
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (!isVisible) return;
      setActiveCoinIndex((prev) => (prev + 1) % 8);
      setPulsePot(true);
      setTotalPotValue((v) => v + 500);

      const timer = setTimeout(() => {
        setPulsePot(false);
      }, 700);

      return () => clearTimeout(timer);
    }, 2400);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 8 circle positions for members around central pot (cx=300, cy=300, r=180)
  // 8 circle positions for members around central pot (cx=300, cy=300, r=180)
  // Fix 4: Figures in blue-500 (#2F86D1) & navy-900 (#0B2540)
  const figures = [
    { id: 1, angle: 0, color: '#2F86D1', label: 'Sunita' },
    { id: 2, angle: 45, color: '#0B2540', label: 'Kavita' },
    { id: 3, angle: 90, color: '#2F86D1', label: 'Meena' },
    { id: 4, angle: 135, color: '#0B2540', label: 'Aarti' },
    { id: 5, angle: 180, color: '#2F86D1', label: 'Pooja' },
    { id: 6, angle: 225, color: '#0B2540', label: 'Rekha' },
    { id: 7, angle: 270, color: '#2F86D1', label: 'Sarita' },
    { id: 8, angle: 315, color: '#0B2540', label: 'Geeta' },
  ];

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto flex items-center justify-center select-none overflow-visible pt-8">
      {/* Background Circular Aura / Ring (Fix 4: blue-200 ring) */}
      <div className="absolute inset-4 rounded-full bg-white/70 border-2 border-blue-200 -z-10 shadow-elevated" />
      <div className="absolute inset-16 rounded-full border border-dashed border-blue-200 -z-10" />

      {/* Floating Pot Ticker Badge (Fix 4: Relocated above ring to eliminate top avatar overlap) */}
      <div className="absolute top-0 sm:-top-2 z-20 px-4 py-2 rounded-full bg-white border border-blue-200 shadow-card flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
        <span className="text-xs font-semibold text-slate-600">Group Pool:</span>
        <span className="font-heading font-extrabold text-sm text-blue-600">
          <CountUp end={totalPotValue} prefix="₹" />
        </span>
      </div>

      <svg
        viewBox="0 0 600 600"
        className="w-full h-full overflow-visible"
        aria-label="Community Circle savings illustration"
      >
        <defs>
          <filter id="potShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0B2540" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Central Savings Pot Ripple Rings */}
        {pulsePot && (
          <circle
            cx="300"
            cy="310"
            r="70"
            fill="none"
            stroke="#9CCBF3"
            strokeWidth="3"
            className="animate-ripple"
          />
        )}

        {/* Central Savings Pot (Fix 4: Pot in blue-600 with blue-300 rim) */}
        <g
          className={`transition-transform duration-300 ${
            pulsePot ? 'scale-105 origin-center' : ''
          }`}
          style={{ transformOrigin: '300px 310px' }}
          filter="url(#potShadow)"
        >
          {/* Pot Base & Belly */}
          <ellipse cx="300" cy="355" rx="55" ry="12" fill="#C7E3FA" />
          <path
            d="M 240 290 C 230 350, 370 350, 360 290 Z"
            fill="#1D6DB5"
          />
          <path
            d="M 235 285 Q 300 270 365 285 Q 300 300 235 285 Z"
            fill="#17588F"
          />
          <ellipse cx="300" cy="285" rx="60" ry="10" fill="#9CCBF3" />
          <ellipse cx="300" cy="284" rx="45" ry="6" fill="#F3F9FF" />

          {/* Central Coin (Fix 5: White coin with blue-600 ₹ and blue-300 ring) */}
          <circle cx="300" cy="283" r="14" fill="#FFFFFF" stroke="#9CCBF3" strokeWidth="2" />
          <text
            x="300"
            y="287.5"
            textAnchor="middle"
            fill="#1D6DB5"
            fontSize="12"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            ₹
          </text>
        </g>

        {/* Arcing Flying Coin (Fix 5: White coin with blue-600 ₹ and blue-300 ring) */}
        {(() => {
          const activeFig = figures[activeCoinIndex];
          const rad = (activeFig.angle * Math.PI) / 180;
          const startX = 300 + Math.cos(rad) * 170;
          const startY = 300 + Math.sin(rad) * 170;

          return (
            <g
              key={activeCoinIndex}
              className="animate-fade-in"
              style={{
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <line
                x1={startX}
                y1={startY}
                x2="300"
                y2="285"
                stroke="#C7E3FA"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.8"
              />
              <circle
                cx={(startX + 300) / 2}
                cy={(startY + 285) / 2 - 25}
                r="13"
                fill="#FFFFFF"
                stroke="#9CCBF3"
                strokeWidth="2"
              >
                <animate
                  attributeName="cy"
                  values={`${(startY + 285) / 2 - 35};${(startY + 285) / 2 - 15};${(startY + 285) / 2 - 35}`}
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                x={(startX + 300) / 2}
                y={(startY + 285) / 2 - 21}
                textAnchor="middle"
                fill="#1D6DB5"
                fontSize="12"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                ₹
              </text>
            </g>
          );
        })()}

        {/* 8 Community Figures arranged in Circle */}
        {figures.map((fig, idx) => {
          const rad = (fig.angle * Math.PI) / 180;
          const x = 300 + Math.cos(rad) * 190;
          const y = 300 + Math.sin(rad) * 190;
          const isCurrentContributor = idx === activeCoinIndex;

          return (
            <g
              key={fig.id}
              className="transition-all duration-300"
              style={{
                transformOrigin: `${x}px ${y}px`,
                animationDelay: `${idx * 80}ms`,
              }}
            >
              {/* Figure Pulse indicator */}
              {isCurrentContributor && (
                <circle
                  cx={x}
                  cy={y}
                  r="34"
                  fill="none"
                  stroke={fig.color}
                  strokeWidth="2"
                  className="animate-ping"
                  opacity="0.4"
                />
              )}

              {/* Body Circle */}
              <circle
                cx={x}
                cy={y}
                r="24"
                fill="#FFFFFF"
                stroke={isCurrentContributor ? '#1D6DB5' : '#C7E3FA'}
                strokeWidth={isCurrentContributor ? '3' : '2'}
                className="shadow-card"
              />

              {/* Head / Torso Icon */}
              <circle
                cx={x}
                cy={y - 6}
                r="8"
                fill={fig.color}
              />
              <path
                d={`M ${x - 14} ${y + 16} Q ${x} ${y + 2} ${x + 14} ${y + 16} Z`}
                fill={fig.color}
              />

              {/* Member Name Tag (Fix 4: Legible size >=12px desktop / 11px mobile with high contrast) */}
              <rect
                x={x - 28}
                y={y + 28}
                width="56"
                height="20"
                rx="10"
                fill="#FFFFFF"
                stroke="#C7E3FA"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y={y + 42}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#0B2540"
                fontFamily="sans-serif"
              >
                {fig.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
