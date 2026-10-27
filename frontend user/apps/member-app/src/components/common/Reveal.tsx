import React, { useEffect, useRef, useState } from 'react';

interface RevealProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  direction?: 'up' | 'none';
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delayMs = 0,
  className = '',
  direction = 'up',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If user prefers reduced motion, reveal immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const current = elementRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  const transformStyle = isVisible
    ? 'translate3d(0, 0, 0)'
    : direction === 'up'
    ? 'translate3d(0, 24px, 0)'
    : 'translate3d(0, 0, 0)';

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: transformStyle,
        transitionProperty: 'opacity, transform',
        transitionDuration: '600ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delayMs}ms`,
        willChange: isVisible ? 'auto' : 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};
