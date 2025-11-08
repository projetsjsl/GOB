/**
 * Configuration centralisée des couleurs du thème GOB
 * 
 * Ce module charge et expose les couleurs définies dans config/theme-colors.json
 * pour une utilisation cohérente dans tous les emails et le site web.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Charge la configuration des couleurs
 */
function loadThemeConfig() {
  try {
    const configPath = join(__dirname, '..', 'config', 'theme-colors.json');
    const configContent = readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('❌ Erreur chargement config couleurs:', error);
    // Fallback vers couleurs par défaut
    return getDefaultTheme();
  }
}

/**
 * Couleurs par défaut en cas d'erreur de chargement
 */
function getDefaultTheme() {
  return {
    colors: {
      primary: { value: '#6366f1' },
      primaryDark: { value: '#4f46e5' },
      primaryLight: { value: '#8b5cf6' },
      success: { value: '#10b981' },
      text: {
        dark: { value: '#1f2937' },
        medium: { value: '#4b5563' },
        light: { value: '#6b7280' }
      },
      background: {
        light: { value: '#f8fafc' },
        medium: { value: '#f1f5f9' }
      },
      border: {
        light: { value: '#e5e7eb' }
      }
    },
    gradients: {
      primary: { value: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }
    }
  };
}

// Charger la config une seule fois
const themeConfig = loadThemeConfig();

/**
 * Accès rapide aux couleurs
 */
export const colors = {
  primary: themeConfig.colors.primary.value,
  primaryDark: themeConfig.colors.primaryDark.value,
  primaryLight: themeConfig.colors.primaryLight.value,
  secondary: themeConfig.colors.secondary?.value || themeConfig.colors.primaryLight.value,
  success: themeConfig.colors.success.value,
  warning: themeConfig.colors.warning?.value || '#f59e0b',
  error: themeConfig.colors.error?.value || '#ef4444',
  text: {
    dark: themeConfig.colors.text.dark.value,
    medium: themeConfig.colors.text.medium.value,
    light: themeConfig.colors.text.light.value,
    muted: themeConfig.colors.text.muted?.value || '#9ca3af'
  },
  background: {
    white: themeConfig.colors.background.white.value,
    light: themeConfig.colors.background.light.value,
    medium: themeConfig.colors.background.medium.value,
    dark: themeConfig.colors.background.dark?.value || '#e2e8f0'
  },
  border: {
    light: themeConfig.colors.border.light.value,
    medium: themeConfig.colors.border.medium?.value || '#d1d5db',
    dark: themeConfig.colors.border.dark?.value || '#9ca3af'
  }
};

/**
 * Accès rapide aux gradients
 */
export const gradients = {
  primary: themeConfig.gradients.primary.value,
  primaryAlt: themeConfig.gradients.primaryAlt?.value || themeConfig.gradients.primary.value,
  secondary: themeConfig.gradients.secondary?.value || themeConfig.gradients.primary.value,
  success: themeConfig.gradients.success?.value || `linear-gradient(135deg, #059669 0%, ${colors.success} 100%)`,
  warning: themeConfig.gradients.warning?.value || `linear-gradient(135deg, ${colors.warning} 0%, #fbbf24 100%)`,
  info: themeConfig.gradients.info?.value || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
};

/**
 * Configuration pour les briefings
 */
export const briefingTypes = themeConfig.briefingTypes || {
  morning: {
    headerGradient: gradients.warning,
    backgroundColor: '#fef3c7',
    tickerBoxGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    tickerBoxBorder: colors.warning,
    tickerTextColor: '#92400e',
    emoji: '🌅'
  },
  midday: {
    headerGradient: gradients.info,
    backgroundColor: '#eff6ff',
    tickerBoxGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    tickerBoxBorder: '#3b82f6',
    tickerTextColor: '#1e40af',
    emoji: '☀️'
  },
  evening: {
    headerGradient: gradients.secondary,
    backgroundColor: '#f3e8ff',
    tickerBoxGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    tickerBoxBorder: colors.primaryLight,
    tickerTextColor: '#6b21a8',
    emoji: '🌆'
  }
};

/**
 * Configuration email
 */
export const emailConfig = themeConfig.email || {
  fonts: {
    primary: "'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    monospace: 'monospace'
  },
  spacing: {
    containerMaxWidth: '700px',
    padding: {
      small: '20px',
      medium: '30px',
      large: '40px'
    },
    borderRadius: {
      small: '8px',
      medium: '12px',
      large: '16px'
    }
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
    large: '0 10px 25px rgba(99, 102, 241, 0.15), 0 4px 6px rgba(0, 0, 0, 0.1)',
    primary: '0 4px 12px rgba(99, 102, 241, 0.15)'
  }
};

/**
 * Export de la config complète pour usage avancé
 */
export const theme = themeConfig;

/**
 * Helper pour générer des styles inline avec les couleurs du thème
 */
export function getEmailStyles() {
  return {
    body: {
      fontFamily: emailConfig.fonts.primary,
      lineHeight: '1.7',
      color: colors.text.dark,
      backgroundColor: colors.background.light
    },
    container: {
      maxWidth: emailConfig.spacing.containerMaxWidth,
      margin: '0 auto',
      background: colors.background.white,
      borderRadius: emailConfig.spacing.borderRadius.large,
      boxShadow: emailConfig.shadows.large
    },
    header: {
      background: gradients.primary,
      color: colors.background.white,
      padding: emailConfig.spacing.large,
      textAlign: 'center'
    },
    content: {
      background: colors.background.white,
      padding: emailConfig.spacing.large
    },
    footer: {
      textAlign: 'center',
      padding: emailConfig.spacing.medium,
      background: colors.background.medium,
      borderTop: `2px solid ${colors.border.light}`
    }
  };
}

export default {
  colors,
  gradients,
  briefingTypes,
  emailConfig,
  theme,
  getEmailStyles
};

