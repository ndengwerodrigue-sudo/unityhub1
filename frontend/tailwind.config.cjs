/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/index.css',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F14',
        surface: '#111827',
        card: 'rgba(255, 255, 255, 0.04)',
        'card-hover': 'rgba(255, 255, 255, 0.07)',
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.14)',
        },
        foreground: '#F8FAFC',
        muted: '#94A3B8',
        subtle: '#64748B',
        primary: '#6366F1',
        secondary: '#8B5CF6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        dark: {
          bg: '#0B0F14',
          surface: '#111827',
          card: '#111827',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          accent: '#6366F1',
        },
        cyber: {
          blue: '#6366F1',
          purple: '#8B5CF6',
          pink: '#A78BFA',
          green: '#22C55E',
          yellow: '#F59E0B',
          red: '#EF4444',
          cyan: '#3B82F6',
          indigo: '#6366F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-sm': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-md': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.025em', fontWeight: '600' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        premium: '0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(0, 0, 0, 0.35)',
        'premium-lg': '0 12px 48px rgba(0, 0, 0, 0.45)',
        'premium-hover': '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        glow: '0 0 32px rgba(99, 102, 241, 0.12)',
        'glow-sm': '0 0 16px rgba(99, 102, 241, 0.1)',
        neon: '0 0 20px rgba(99, 102, 241, 0.25)',
        cyber: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      ringOffsetColor: {
        background: '#0B0F14',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.45s ease-out',
        'slide-down': 'slideDown 0.35s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideDown: { '0%': { transform: 'translateY(-6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.98)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      backgroundImage: {
        'gradient-subtle': 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 100%)',
        'gradient-radial': 'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(99, 102, 241, 0.15), transparent 70%)',
        'gradient-mesh': 'radial-gradient(at 20% 0%, rgba(99,102,241,0.08) 0, transparent 50%), radial-gradient(at 80% 20%, rgba(139,92,246,0.06) 0, transparent 45%)',
      },
    },
  },
  plugins: [],
}
