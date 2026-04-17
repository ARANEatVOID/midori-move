/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bgPrimary: 'var(--color-bg-primary)',
        bgSecondary: 'var(--color-bg-secondary)',
        bgCard: 'var(--color-bg-card)',
        accentPrimary: 'var(--color-accent-primary)',
        accentSecondary: 'var(--color-accent-secondary)',
        accentGlow: 'var(--color-accent-glow)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        borderTone: 'var(--color-border)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        organic: 'var(--ease-organic)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at center, rgba(87,255,140,0.18), rgba(87,255,140,0) 60%)',
      },
    },
  },
  plugins: [],
}
