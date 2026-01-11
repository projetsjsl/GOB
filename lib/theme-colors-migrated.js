/**
 * Theme Colors - Version Migrée vers Design System
 * 
 * Ce fichier remplace lib/theme-colors.js et utilise src/design-system/tokens.ts
 * comme source unique de vérité pour les couleurs.
 * 
 * Migration depuis config/theme-colors.json
 */

// Import des tokens du design system
// En production, charger depuis le build compilé
// En développement, utiliser les tokens directement

/**
 * Charge les couleurs depuis le design system
 * Fallback vers config/theme-colors.json si design system non disponible
 */
export function getThemeColors() {
  // Essayer de charger depuis design system (si disponible via build)
  if (typeof window !== 'undefined' && window.GOBDesignTokens) {
    const tokens = window.GOBDesignTokens;
    return {
      primary: { value: tokens.colors.primary.default, name: 'Indigo-500' },
      primaryDark: { value: tokens.colors.primary.dark, name: 'Indigo-600' },
      primaryLight: { value: tokens.colors.primary.light, name: 'Violet-500' },
      secondary: { value: tokens.colors.secondary.default, name: 'Violet-600' },
      success: { value: tokens.colors.success, name: 'Emerald-500' },
      warning: { value: tokens.colors.warning, name: 'Amber-500' },
      error: { value: tokens.colors.danger, name: 'Red-500' },
      text: {
        dark: { value: '#1f2937', name: 'Gray-800' },
        medium: { value: '#4b5563', name: 'Gray-600' },
        light: { value: '#6b7280', name: 'Gray-500' },
        muted: { value: tokens.colors.text.muted, name: 'Gray-400' },
      },
      background: {
        white: { value: '#ffffff', name: 'White' },
        light: { value: '#f8fafc', name: 'Gray-50' },
        medium: { value: '#f1f5f9', name: 'Slate-100' },
        dark: { value: '#e2e8f0', name: 'Slate-200' },
      },
      border: {
        light: { value: '#e5e7eb', name: 'Gray-200' },
        medium: { value: '#d1d5db', name: 'Gray-300' },
        dark: { value: tokens.colors.border.default, name: 'Gray-400' },
      },
    };
  }
  
  // Fallback: charger depuis config/theme-colors.json (pour compatibilité)
  try {
    const { readFileSync } = require('fs');
    const { join, dirname } = require('path');
    const { fileURLToPath } = require('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const configPath = join(__dirname, '..', 'config', 'theme-colors.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.colors;
  } catch (error) {
    console.warn('⚠️ Impossible de charger les couleurs, utilisation des valeurs par défaut');
    // Valeurs par défaut du design system
    return {
      primary: { value: '#6366f1' },
      secondary: { value: '#7c3aed' },
      success: { value: '#10b981' },
      warning: { value: '#f59e0b' },
      error: { value: '#ef4444' },
    };
  }
}

/**
 * Obtient une couleur spécifique
 */
export function getColor(colorPath) {
  const colors = getThemeColors();
  const parts = colorPath.split('.');
  let value = colors;
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value?.value || value;
}

/**
 * Obtient un gradient
 */
export function getGradient(gradientName) {
  const gradients = {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    secondary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    success: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  };
  
  return gradients[gradientName] || gradients.primary;
}
