import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1400px' }
    },
    extend: {
      colors: {
        // Wapas brand tokens
        canvas: '#FEFCFA',
        navy: {
          DEFAULT: '#262D53',
          50: '#EEEFF6',
          100: '#D6D8E9',
          200: '#AEB2D3',
          300: '#868CBD',
          400: '#5E66A7',
          500: '#3B4280',
          600: '#262D53', // brand navy
          700: '#1D233F',
          800: '#15192E',
          900: '#0C0F1B'
        },
        blue: {
          DEFAULT: '#4A7FCE', // primary blue
          50: '#EEF4FC',
          100: '#D5E3F7',
          200: '#ABC7EF',
          300: '#81ABE7',
          400: '#6693DA',
          500: '#4A7FCE', // brand primary
          600: '#3A66AC',
          700: '#2C4D82',
          800: '#1E3459',
          900: '#101B30'
        },
        aqua: {
          DEFAULT: '#69C8D4', // accent blue
          50: '#EDFAFB',
          100: '#D2F1F4',
          200: '#A6E3E9',
          300: '#79D5DE',
          400: '#69C8D4', // brand accent
          500: '#3FA9B7',
          600: '#2F8592',
          700: '#25636D',
          800: '#1A4249',
          900: '#0E2225'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif']
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
        xl4: '2.25rem'
      },
      boxShadow: {
        soft: '0 1px 2px -1px rgba(38,45,83,0.04), 0 4px 16px -8px rgba(38,45,83,0.06)',
        floating: '0 4px 10px -6px rgba(38,45,83,0.10), 0 16px 40px -16px rgba(38,45,83,0.14)',
        glow: '0 0 0 1px rgba(105,200,212,0.25), 0 8px 30px -8px rgba(74,127,206,0.45)'
      },
      backgroundImage: {
        'wapas-gradient': 'linear-gradient(135deg, #4A7FCE 0%, #69C8D4 100%)',
        'wapas-gradient-dark': 'linear-gradient(135deg, #262D53 0%, #4A7FCE 100%)',
        'route-line': 'linear-gradient(90deg, rgba(74,127,206,0.15), rgba(105,200,212,0.6))'
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-700px 0' }, '100%': { backgroundPosition: '700px 0' } },
        'route-draw': { '0%': { strokeDashoffset: '400' }, '100%': { strokeDashoffset: '0' } },
        'truck-drive': { '0%': { transform: 'translateX(-4%)' }, '100%': { transform: 'translateX(4%)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '0.8' }, '100%': { transform: 'scale(2.2)', opacity: '0' } }
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        shimmer: 'shimmer 1.6s infinite linear',
        'route-draw': 'route-draw 1.6s ease-out forwards',
        'truck-drive': 'truck-drive 2.4s ease-in-out infinite alternate',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
