/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        border: 'hsl(var(--border))',
        ink: 'hsl(var(--text))',
        dim: 'hsl(var(--muted))',
        brand: 'hsl(var(--brand))',
        'brand-fg': 'hsl(var(--brand-fg))',
      },
      borderRadius: { xl2: '14px', xl3: '20px', xl4: '24px' },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        pop: '0 8px 32px -6px rgb(0 0 0 / 0.18)',
        glow: '0 0 0 3px rgba(16,185,129,0.2)',
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'] },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, hsl(142 65% 28%), hsl(160 60% 35%))',
      },
    },
  },
  plugins: [],
};
