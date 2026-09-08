/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Trust blue (Home-Services palette)
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        accent: {
          // Safety orange — for CTAs only
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        },
        ink: {
          950: '#0b1120',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc'
        },
        surface: '#ffffff'
      },
      fontFamily: {
        // Poppins (headings) + Open Sans (body) — Modern Professional pairing
        sans: ['Open Sans', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Poppins', 'Open Sans', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(30, 58, 138, 0.05), 0 1px 3px 0 rgba(30, 58, 138, 0.07)',
        lift: '0 6px 16px -4px rgba(30, 58, 138, 0.13), 0 2px 6px -2px rgba(30, 58, 138, 0.06)',
        hero: '0 12px 30px -8px rgba(234, 88, 12, 0.35)'
      },
      borderRadius: {
        xl2: '1.25rem'
      }
    }
  },
  plugins: []
};
