import type { Config } from 'tailwindcss'
import { tailwindColors } from './src/design-system/tokens'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './public/**/*.html',
    './public/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        // GOB Design System - Source unique de vérité depuis tokens.ts
        ...tailwindColors,
        // Couleurs legacy (à migrer progressivement)
        'gob-dark': '#0a0a0a',
        'gob-surface': '#1a1a1a',
        'gob-border': '#2a2a2a',
        // Variables CSS pour thèmes dynamiques
        'theme-primary': 'var(--theme-primary)',
        'theme-bg': 'var(--theme-bg)',
        'theme-surface': 'var(--theme-surface)',
        'theme-text': 'var(--theme-text)',
        'theme-border': 'var(--theme-border)',
      },
      spacing: {
        'gob-xs': 'var(--gob-spacing-xs)',
        'gob-sm': 'var(--gob-spacing-sm)',
        'gob-md': 'var(--gob-spacing-md)',
        'gob-lg': 'var(--gob-spacing-lg)',
        'gob-xl': 'var(--gob-spacing-xl)',
      },
      fontFamily: {
        'gob-primary': 'var(--gob-font-primary)',
        'gob-secondary': 'var(--gob-font-secondary)',
        'gob-mono': 'var(--gob-font-mono)',
      },
      boxShadow: {
        'gob-sm': 'var(--gob-shadow-sm)',
        'gob-md': 'var(--gob-shadow-md)',
        'gob-lg': 'var(--gob-shadow-lg)',
        'gob-primary': 'var(--gob-shadow-primary)',
      },
      borderRadius: {
        'gob-sm': 'var(--gob-radius-sm)',
        'gob-md': 'var(--gob-radius-md)',
        'gob-lg': 'var(--gob-radius-lg)',
        'gob-xl': 'var(--gob-radius-xl)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
