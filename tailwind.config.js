/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          base: 'var(--color-bg-base)',
          card: 'var(--color-card-bg)',
          header: 'var(--color-card-header)',
          border: 'var(--color-card-border)',
          'border-hover': 'var(--color-card-border-hover)',
          accent: 'var(--color-accent)',
          'accent-text': 'var(--color-accent-text)',
          'accent-bg': 'var(--color-accent-bg)',
          'accent-border': 'var(--color-accent-border)',
        },
        space: {
          950: '#060608', // Matte black base
          900: '#0b0f19', // Deep navy/dark graphite
          800: '#141b2d', // Medium navy
          700: '#1f293d', // Lighter graphite navy
        },
        cyber: {
          amber: '#f59e0b',    // Primary operator orange/amber
          orange: '#ea580c',   // Danger warnings
          cyan: '#06b6d4',     // Secondary cyan indicators
          green: '#10b981',    // Positive telemetry status
          red: '#ef4444',      // Critical fault alert
          blue: '#3b82f6',     // Auxiliary indicators
        }
      },
      fontFamily: {
        mono: ['var(--theme-font-mono, "JetBrains Mono")', 'JetBrains Mono', 'Share Tech Mono', 'ui-monospace', 'monospace'],
        sans: ['var(--theme-font-sans, "Inter")', 'Space Grotesk', 'Rajdhani', 'Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      },
      boxShadow: {
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.3), 0 0 6px -2px rgba(245, 158, 11, 0.2)',
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.3), 0 0 6px -2px rgba(6, 182, 212, 0.2)',
        'glow-green': '0 0 15px -3px rgba(16, 185, 129, 0.3), 0 0 6px -2px rgba(16, 185, 129, 0.2)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.3), 0 0 6px -2px rgba(239, 68, 68, 0.2)',
      }
    },
  },
  plugins: [],
}
