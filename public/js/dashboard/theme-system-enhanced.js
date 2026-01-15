/**
 * Theme System Enhanced - Utilise le Design System
 * 
 * Version amelioree de theme-system.js qui utilise tokens.ts comme fallback
 * et genere les variables CSS via theme-adapter.ts
 * 
 * NOTE: Ce fichier sera progressivement integre dans theme-system.js
 */

// Import des tokens du design system (via window si disponible)
// En production, les tokens seront charges depuis le build
const GOBDesignTokens = window.GOBDesignTokens || {
  colors: {
    primary: { default: '#6366f1', light: '#8b5cf6', dark: '#4f46e5' },
    secondary: { default: '#7c3aed' },
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    text: { primary: '#ffffff', secondary: '#9ca3af' },
    background: { primary: '#000000', secondary: '#111827' },
    border: { default: '#374151' },
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  typography: {
    fontFamily: { primary: 'Inter, sans-serif', secondary: 'Roboto, sans-serif', mono: 'monospace' },
  },
};

/**
 * Genere les variables CSS pour un theme en utilisant les tokens comme fallback
 */
function generateThemeCSSVariablesEnhanced(theme) {
  const variables = {};
  
  // Couleurs principales avec fallback vers tokens
  variables['--theme-primary'] = theme.colors.primary || GOBDesignTokens.colors.primary.default;
  variables['--theme-secondary'] = theme.colors.secondary || GOBDesignTokens.colors.secondary.default;
  variables['--theme-success'] = theme.colors.success || GOBDesignTokens.colors.success;
  variables['--theme-danger'] = theme.colors.danger || GOBDesignTokens.colors.danger;
  variables['--theme-warning'] = theme.colors.warning || GOBDesignTokens.colors.warning;
  
  // Couleurs de texte avec fallback
  variables['--theme-text'] = theme.colors.text || GOBDesignTokens.colors.text.primary;
  variables['--theme-text-secondary'] = theme.colors.textSecondary || GOBDesignTokens.colors.text.secondary;
  
  // Couleurs de fond avec fallback
  if (theme.colors.background === 'fixed') {
    variables['--theme-bg'] = GOBDesignTokens.colors.background.primary;
  } else {
    variables['--theme-bg'] = theme.colors.background || GOBDesignTokens.colors.background.primary;
  }
  
  variables['--theme-surface'] = theme.colors.surface || GOBDesignTokens.colors.background.secondary;
  variables['--theme-border'] = theme.colors.border || GOBDesignTokens.colors.border.default;
  
  // Polices avec fallback
  variables['--theme-font-primary'] = theme.fonts?.primary || GOBDesignTokens.typography.fontFamily.primary;
  variables['--theme-font-secondary'] = theme.fonts?.secondary || GOBDesignTokens.typography.fontFamily.secondary;
  variables['--theme-font-mono'] = theme.fonts?.mono || GOBDesignTokens.typography.fontFamily.mono;
  
  return variables;
}

/**
 * Applique un theme avec support du design system
 * Cette fonction peut etre appelee depuis theme-system.js
 */
function applyThemeWithDesignSystem(theme, themeId) {
  const root = document.documentElement;
  const variables = generateThemeCSSVariablesEnhanced(theme);
  
  // Appliquer toutes les variables
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Appliquer les styles specifiques du theme
  if (theme.styles) {
    root.style.setProperty('--theme-header-bg', theme.styles.headerBg || '');
    root.style.setProperty('--theme-card-bg', theme.styles.cardBg || '');
    root.style.setProperty('--theme-card-border', theme.styles.cardBorder || '');
    root.style.setProperty('--theme-border-radius', theme.styles.borderRadius || '0.75rem');
    root.style.setProperty('--theme-shadow', theme.styles.shadow || '');
  }
  
  // Ajouter classe au body
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${themeId}`);
  
  return variables;
}

// Exposer pour utilisation dans theme-system.js
if (typeof window !== 'undefined') {
  window.GOBThemeAdapter = {
    generateThemeCSSVariables: generateThemeCSSVariablesEnhanced,
    applyThemeWithDesignSystem,
    GOBDesignTokens,
  };
}
