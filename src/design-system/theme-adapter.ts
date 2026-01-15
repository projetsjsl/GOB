/**
 * Theme Adapter - Bridge between theme-system.js and design-system tokens
 * 
 * Adapte les themes existants pour utiliser les tokens du design system
 * tout en maintenant la compatibilite avec le systeme de themes actuel
 */

import { GOBDesignTokens } from './tokens';

/**
 * Adapte un theme du systeme existant pour utiliser les tokens du design system
 */
export function adaptThemeToDesignSystem(theme: any) {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      // Utiliser les tokens du design system comme fallback
      primary: theme.colors.primary || GOBDesignTokens.colors.primary.default,
      secondary: theme.colors.secondary || GOBDesignTokens.colors.secondary.default,
      success: theme.colors.success || GOBDesignTokens.colors.success,
      danger: theme.colors.danger || GOBDesignTokens.colors.danger,
      warning: theme.colors.warning || GOBDesignTokens.colors.warning,
      // Mapper les couleurs de texte
      text: theme.colors.text || GOBDesignTokens.colors.text.primary,
      textSecondary: theme.colors.textSecondary || GOBDesignTokens.colors.text.secondary,
      // Mapper les couleurs de fond
      background: theme.colors.background || GOBDesignTokens.colors.background.primary,
      surface: theme.colors.surface || GOBDesignTokens.colors.background.secondary,
      // Mapper les bordures
      border: theme.colors.border || GOBDesignTokens.colors.border.default,
    },
    spacing: {
      ...GOBDesignTokens.spacing,
      ...theme.spacing, // Permettre override si necessaire
    },
    typography: {
      ...GOBDesignTokens.typography,
      ...theme.typography, // Permettre override si necessaire
    },
  };
}

/**
 * Genere les variables CSS pour un theme donne
 */
export function generateThemeCSSVariables(theme: any): Record<string, string> {
  const adapted = adaptThemeToDesignSystem(theme);
  
  return {
    '--theme-primary': adapted.colors.primary,
    '--theme-secondary': adapted.colors.secondary,
    '--theme-success': adapted.colors.success,
    '--theme-danger': adapted.colors.danger,
    '--theme-warning': adapted.colors.warning,
    '--theme-text': adapted.colors.text,
    '--theme-text-secondary': adapted.colors.textSecondary,
    '--theme-bg': adapted.colors.background === 'fixed' 
      ? GOBDesignTokens.colors.background.primary 
      : adapted.colors.background,
    '--theme-surface': typeof adapted.colors.surface === 'string' && adapted.colors.surface.startsWith('rgba')
      ? adapted.colors.surface
      : adapted.colors.surface,
    '--theme-border': adapted.colors.border,
    '--theme-font-primary': adapted.fonts?.primary || GOBDesignTokens.typography.fontFamily.primary,
    '--theme-font-secondary': adapted.fonts?.secondary || GOBDesignTokens.typography.fontFamily.secondary,
    '--theme-font-mono': adapted.fonts?.mono || GOBDesignTokens.typography.fontFamily.mono,
  };
}
