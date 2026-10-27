/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#FFFFFF',
        'blue-50': 'var(--blue-50)',
        'blue-100': 'var(--blue-100)',
        'blue-200': 'var(--blue-200)',
        'blue-300': 'var(--blue-300)',
        'blue-500': 'var(--blue-500)',
        'blue-600': 'var(--blue-600)',
        'blue-700': 'var(--blue-700)',
        'navy-900': 'var(--navy-900)',
        'slate-600': 'var(--slate-600)',
        status: {
          success: 'var(--status-success)',
          'success-bg': 'var(--status-success-bg)',
          'success-border': 'var(--status-success-border)',
          amber: 'var(--status-amber)',
          'amber-bg': 'var(--status-amber-bg)',
          'amber-border': 'var(--status-amber-border)',
          error: 'var(--status-error)',
          'error-bg': 'var(--status-error-bg)',
          'error-border': 'var(--status-error-border)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Sora', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(11, 37, 64, 0.05)',
        'elevated': '0 8px 24px rgba(29, 109, 181, 0.08)',
        'card': '0 4px 16px rgba(11, 37, 64, 0.06)',
      },
      keyframes: {
        logoEntrance: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        potPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        rippleRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'logo-entrance': 'logoEntrance 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'slide-up': 'slideUp 250ms ease-out forwards',
        'marquee': 'marquee 25s linear infinite',
        'pot-pulse': 'potPulse 2s ease-in-out infinite',
        'ripple': 'rippleRing 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
    },
  },
  plugins: [],
};
