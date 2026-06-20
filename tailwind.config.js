/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdfb',
          100: '#ccfbf4',
          200: '#99f6e9',
          300: '#5eead6',
          400: '#2dd4bf',
          500: '#19a88f',
          600: '#0d9373',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          DEFAULT: '#19a88f',
          foreground: '#ffffff',
        },
        indigo: {
          DEFAULT: '#5b5ac7',
          foreground: '#ffffff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '50%': { opacity: '1', transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'brand': '0 4px 24px -4px rgba(25, 168, 143, 0.35)',
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px -8px rgba(0,0,0,0.08)',
        'card-dark': '0 4px 12px rgba(0,0,0,0.3)',
        'elevated': '0 10px 40px -10px rgba(25, 168, 143, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
