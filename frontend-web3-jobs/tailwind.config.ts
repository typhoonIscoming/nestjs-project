import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#070a14', 900: '#0b1020', 800: '#111a33', 700: '#1b2750', 600: '#2a386b' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(52,211,153,0.25), 0 8px 30px -8px rgba(52,211,153,0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
