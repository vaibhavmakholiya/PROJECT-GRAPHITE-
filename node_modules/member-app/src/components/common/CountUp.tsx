import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  durationMs?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  durationMs = 1500,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [value, setValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          let startTime: number | null = null;

          const step = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / durationMs, 1);
            // Ease-out expo curve
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(Math.floor(ease * end));

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setValue(end);
            }
          };

          requestAnimationFrame(step);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      { threshold: 0.2 }
    );

    const current = elementRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [end, durationMs]);

  // Standard Indian digit grouping e.g. 50,000 or 1,25,000
  const formatted = value.toLocaleString('en-IN');

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
