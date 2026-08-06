import type { Config } from 'tailwindcss';

/**
 * Tailwind is used for layout only. Every colour and font resolves to a CSS
 * custom property defined in globals.css, so the theme system stays in one
 * place and the light/dark switch is a token swap rather than a class sweep.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)',
        panel: 'var(--panel)',
        raised: 'var(--raised)',
        rule: 'var(--rule)',
        'rule-soft': 'var(--rule-soft)',
        dim: 'var(--dim)',
        ink: 'var(--ink)',
        bright: 'var(--bright)',
        signal: 'var(--signal)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        shell: '78rem',
      },
      transitionTimingFunction: {
        // Instrument motion: fast départ, hard landing. No bounce anywhere.
        instrument: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
