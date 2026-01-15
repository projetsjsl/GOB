/**
 * GOB Design System - Source Unique de Verite
 * 
 * Toutes les couleurs, espacements, typographie et tokens de design
 * doivent etre definis ici et utilises dans tout le projet.
 * 
 * Migration depuis:
 * - theme-system.js (themes dashboard)
 * - config/theme-colors.json (couleurs emails/site)
 * - v0-bootstrap.js (tokens composants V0)
 * - tailwind.config.ts (couleurs custom)
 */

export const GOBDesignTokens = {
  /**
   * Couleurs Semantiques (utilisees partout)
   * Ces couleurs sont les couleurs de base, independantes des themes
   */
  colors: {
    // Couleurs principales
    primary: {
      light: '#8b5cf6',    // violet-500 (pour gradients)
      default: '#6366f1',  // indigo-500 (couleur principale)
      dark: '#4f46e5',     // indigo-600 (variante foncee)
      darker: '#4338ca',   // indigo-700
    },
    secondary: {
      light: '#a78bfa',    // violet-400
      default: '#7c3aed',  // violet-600
      dark: '#6d28d9',     // violet-700
    },
    
    // Couleurs d'etat
    success: '#10b981',    // emerald-500
    successLight: '#34d399', // emerald-400
    successDark: '#059669',  // emerald-600
    
    danger: '#ef4444',     // red-500
    dangerLight: '#f87171', // red-400
    dangerDark: '#dc2626',  // red-600
    
    warning: '#f59e0b',    // amber-500
    warningLight: '#fbbf24', // amber-400
    warningDark: '#d97706',  // amber-600
    
    info: '#3b82f6',       // blue-500
    infoLight: '#60a5fa',  // blue-400
    infoDark: '#2563eb',   // blue-600
    
    // Couleurs de texte
    text: {
      primary: '#ffffff',      // Texte principal (dark mode)
      primaryLight: '#1a1a1a', // Texte principal (light mode)
      secondary: '#9ca3af',     // gray-400
      muted: '#6b7280',         // gray-500
      disabled: '#4b5563',      // gray-600
    },
    
    // Couleurs de fond
    background: {
      primary: '#000000',       // Fond principal (dark)
      primaryLight: '#ffffff',  // Fond principal (light)
      secondary: '#111827',     // gray-900
      tertiary: '#1f2937',      // gray-800
      elevated: '#18181b',      // zinc-900
    },
    
    // Couleurs de bordure
    border: {
      default: '#374151',       // gray-700
      light: '#4b5563',         // gray-600
      subtle: 'rgba(255, 255, 255, 0.1)',
      accent: 'rgba(99, 102, 241, 0.3)', // indigo avec transparence
    },
    
    // Couleurs speciales pour themes specifiques
    terminal: {
      primary: '#ffcc00',   // yellow terminal
      secondary: '#00ff00', // green terminal
      background: '#000000',
      text: '#ffcc00',
    },
    
    marketq: {
      primary: '#00d4ff',   // cyan brillant
      secondary: '#0066cc',  // blue profond
      background: '#0a0e27',
      text: '#e0e7ff',
    },
  },

  /**
   * Espacements Standardises (echelle de 4px)
   */
  spacing: {
    xs: '4px',   // 0.25rem
    sm: '8px',   // 0.5rem
    md: '16px',  // 1rem
    lg: '24px',  // 1.5rem
    xl: '32px',  // 2rem
    '2xl': '48px', // 3rem
    '3xl': '64px', // 4rem
  },

  /**
   * Typographie
   */
  typography: {
    fontFamily: {
      primary: 'Inter, sans-serif',
      secondary: 'Roboto, sans-serif',
      mono: '"Courier New", "Courier", "Consolas", "Monaco", "Menlo", "SF Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  /**
   * Ombres
   */
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 25px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.2)',
    primary: '0 4px 12px rgba(99, 102, 241, 0.15)',
    glow: '0 0 30px rgba(99, 102, 241, 0.3)',
  },

  /**
   * Border Radius
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },

  /**
   * Transitions
   */
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  /**
   * Z-Index Scale
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    max: 9999,
  },
} as const;

/**
 * Export des couleurs pour utilisation dans Tailwind
 */
export const tailwindColors = {
  'gob-primary': GOBDesignTokens.colors.primary.default,
  'gob-primary-light': GOBDesignTokens.colors.primary.light,
  'gob-primary-dark': GOBDesignTokens.colors.primary.dark,
  'gob-secondary': GOBDesignTokens.colors.secondary.default,
  'gob-success': GOBDesignTokens.colors.success,
  'gob-danger': GOBDesignTokens.colors.danger,
  'gob-warning': GOBDesignTokens.colors.warning,
  'gob-info': GOBDesignTokens.colors.info,
  'gob-text-primary': GOBDesignTokens.colors.text.primary,
  'gob-text-secondary': GOBDesignTokens.colors.text.secondary,
  'gob-bg-primary': GOBDesignTokens.colors.background.primary,
  'gob-bg-secondary': GOBDesignTokens.colors.background.secondary,
  'gob-border': GOBDesignTokens.colors.border.default,
};

/**
 * Export pour utilisation dans CSS (variables CSS)
 */
export const cssVariables = {
  '--gob-primary': GOBDesignTokens.colors.primary.default,
  '--gob-primary-light': GOBDesignTokens.colors.primary.light,
  '--gob-primary-dark': GOBDesignTokens.colors.primary.dark,
  '--gob-secondary': GOBDesignTokens.colors.secondary.default,
  '--gob-success': GOBDesignTokens.colors.success,
  '--gob-danger': GOBDesignTokens.colors.danger,
  '--gob-warning': GOBDesignTokens.colors.warning,
  '--gob-info': GOBDesignTokens.colors.info,
  '--gob-text-primary': GOBDesignTokens.colors.text.primary,
  '--gob-text-secondary': GOBDesignTokens.colors.text.secondary,
  '--gob-bg-primary': GOBDesignTokens.colors.background.primary,
  '--gob-bg-secondary': GOBDesignTokens.colors.background.secondary,
  '--gob-border': GOBDesignTokens.colors.border.default,
  '--gob-spacing-xs': GOBDesignTokens.spacing.xs,
  '--gob-spacing-sm': GOBDesignTokens.spacing.sm,
  '--gob-spacing-md': GOBDesignTokens.spacing.md,
  '--gob-spacing-lg': GOBDesignTokens.spacing.lg,
  '--gob-spacing-xl': GOBDesignTokens.spacing.xl,
};
