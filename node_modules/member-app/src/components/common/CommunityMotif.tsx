import React from 'react';

interface CommunityMotifProps {
  className?: string;
  opacity?: number;
}

export const CommunityMotif: React.FC<CommunityMotifProps> = ({
  className = '',
  opacity = 0.08,
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Central community savings pot */}
      <ellipse cx="100" cy="115" rx="32" ry="18" fill="currentColor" />
      <path
        d="M72 115 C72 145, 128 145, 128 115 Z"
        fill="currentColor"
      />
      <circle cx="100" cy="110" r="14" fill="#FFFFFF" fillOpacity="0.25" />

      {/* Surrounding concentric circle of community members */}
      <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 6" />

      {/* 8 Community member silhouettes around circle */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 100 + 72 * Math.cos(rad);
        const cy = 100 + 72 * Math.sin(rad);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy - 4} r="8" fill="currentColor" />
            <path
              d={`M${cx - 10} ${cy + 14} C${cx - 10} ${cy + 6}, ${cx + 10} ${cy + 6}, ${cx + 10} ${cy + 14} Z`}
              fill="currentColor"
            />
          </g>
        );
      })}
    </svg>
  );
};
