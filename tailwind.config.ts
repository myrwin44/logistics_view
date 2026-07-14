import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ─── Brand palette ────────────────────────────────────────────
        // Primary amber/gold — buttons, active states, highlights
        primary:        '#FFBF00',
        'primary-dark': '#CC9900',       // hover/pressed state
        'primary-light':'#FFF78D',       // surface tint, hover bg

        // Dark green — sidebar bg, header surfaces
        'brand-dark':   '#283F24',
        'brand-mid':    '#467235',       // hover, secondary accent
        'brand-mid-light': '#5a8f44',    // lighter variant for subtle use

        // Legacy aliases (kept for components not yet migrated)
        'ai-provenance':'#467235',
        surface:        '#FEFCE8',       // warm cream derived from #FFF78D
        'surface-info': '#FFFDE7',
        'status-amber': '#FFF78D',
        'status-green': '#F0FDF4',
        'status-neutral':'#F3F4F6',

        // Sidebar CSS-variable tokens (Req 9.1)
        'sidebar-bg':     'var(--sidebar-bg)',     // maps to #283F24
        'sidebar-border': 'var(--sidebar-border)', // maps to rgba(255,255,255,0.09)

        // Ink / text
        ink:            '#1A2E14',       // darkest green-tinted ink
        'ink-muted':    '#4B5563',
        border:         '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
