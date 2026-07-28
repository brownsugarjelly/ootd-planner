/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F5F2ED',
          soft: '#FBF9F5',
        },
        ink: {
          DEFAULT: '#221E1B',
          muted: '#8A8178',
        },
        line: {
          DEFAULT: '#E4DED4',
          soft: '#EDE8DF',
        },
        thread: {
          50: '#FBF1F2',
          100: '#F5DEE1',
          200: '#E9C0C6',
          300: '#D99CA6',
          400: '#C97885',
          500: '#B85C6B',
          600: '#9C4756',
          700: '#7D3745',
          800: '#5E2933',
          900: '#3F1B22',
        },
        sage: {
          50: '#F3F5F0',
          100: '#E4E9DC',
          200: '#C9D3BB',
          300: '#ADBC9A',
          400: '#92A57C',
          500: '#7C8A6E',
          600: '#647159',
          700: '#4D5744',
          800: '#383F31',
          900: '#24291F',
        },
        dusk: {
          bg: '#1B1917',
          surface: '#242220',
          surface2: '#2C2A26',
          line: '#37332E',
          text: '#F1ECE4',
          muted: '#A79E92',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(34, 30, 27, 0.08), 0 8px 24px -8px rgba(34, 30, 27, 0.10)',
        softer: '0 1px 4px rgba(34, 30, 27, 0.06)',
        'soft-dark': '0 2px 10px -2px rgba(0, 0, 0, 0.35), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'rise-in': 'rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pop-in': 'pop-in 180ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
