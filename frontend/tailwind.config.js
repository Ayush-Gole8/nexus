/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sector colors — Operations Amber theme
        power:     '#ffe234',
        water:     '#00d4b8',
        transport: '#ff6b2b',
        telecom:   '#7b68ff',
        emergency: '#ff3355',
        // Amber accent scale
        amber: {
          dim:    '#7a5c1e',
          mid:    '#c8870a',
          DEFAULT: '#f0a500',
          bright: '#ffc53d',
        },
        // Background tiers
        'bg-void':     '#0a0907',
        'bg-base':     '#100f0c',
        'bg-surface':  '#181611',
        'bg-elevated': '#201e18',
        'bg-overlay':  '#2a2720',
        // Text
        'tx-primary':   '#f0ece4',
        'tx-secondary':  '#a89f8c',
        'tx-muted':      '#5c5649',
        // Status
        'st-op':   '#22d97a',
        'st-deg':  '#f0a500',
        'st-fail': '#ff3355',
      },
      fontFamily: {
        display: ['Syne', 'DM Sans', 'sans-serif'],
        data: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderColor: {
        hairline: 'rgba(240,165,0,0.08)',
        subtle:   'rgba(240,165,0,0.14)',
        default:  'rgba(240,165,0,0.22)',
        focus:    'rgba(240,165,0,0.55)',
      },
    },
  },
  plugins: [],
};
