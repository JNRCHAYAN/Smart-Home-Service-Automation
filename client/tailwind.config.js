/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        inset: 'var(--inset)',
        line: 'var(--line)',
        line2: 'var(--line-strong)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          soft: 'var(--brand-soft)',
          text: 'var(--brand-text)',
          border: 'var(--brand-border)',
          ring: 'var(--brand)'
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
          text: 'var(--success-text)',
          border: 'var(--success-border)'
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
          text: 'var(--warning-text)',
          border: 'var(--warning-border)'
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--danger-soft)',
          text: 'var(--danger-text)',
          border: 'var(--danger-border)'
        },
        info: {
          DEFAULT: 'var(--info)',
          soft: 'var(--info-soft)',
          text: 'var(--info-text)',
          border: 'var(--info-border)'
        }
      },
      fontFamily: {
        sans: [
          'Open Sans',
          'Noto Sans Bengali',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif'
        ],
        heading: [
          'Poppins',
          'Open Sans',
          'Noto Sans Bengali',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ]
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        pop: '0 10px 24px -6px rgba(15, 23, 42, 0.18), 0 4px 10px -4px rgba(15, 23, 42, 0.1)',
        glow: '0 0 0 4px var(--brand-soft)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
};
