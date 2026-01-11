/**
 * Tests pour Theme Adapter
 */

import { describe, it, expect } from 'vitest';
import { adaptThemeToDesignSystem, generateThemeCSSVariables } from '../theme-adapter';
import { GOBDesignTokens } from '../tokens';

describe('Theme Adapter', () => {
  const mockTheme = {
    id: 'test-theme',
    name: 'Test Theme',
    colors: {
      primary: '#ff0000',
      secondary: '#00ff00',
      text: '#ffffff',
      background: '#000000',
      surface: '#111111',
      border: '#333333',
    },
    fonts: {
      primary: 'Arial',
      secondary: 'Helvetica',
      mono: 'Courier',
    },
  };

  describe('adaptThemeToDesignSystem', () => {
    it('should adapt theme with custom colors', () => {
      const adapted = adaptThemeToDesignSystem(mockTheme);
      expect(adapted.colors.primary).toBe('#ff0000');
      expect(adapted.colors.secondary).toBe('#00ff00');
    });

    it('should use design tokens as fallback for missing colors', () => {
      const incompleteTheme = {
        ...mockTheme,
        colors: {
          primary: '#ff0000',
          // Missing other colors
        },
      };
      const adapted = adaptThemeToDesignSystem(incompleteTheme);
      expect(adapted.colors.success).toBe(GOBDesignTokens.colors.success);
      expect(adapted.colors.danger).toBe(GOBDesignTokens.colors.danger);
    });

    it('should include spacing from design tokens', () => {
      const adapted = adaptThemeToDesignSystem(mockTheme);
      expect(adapted.spacing.md).toBe(GOBDesignTokens.spacing.md);
    });
  });

  describe('generateThemeCSSVariables', () => {
    it('should generate CSS variables for theme', () => {
      const variables = generateThemeCSSVariables(mockTheme);
      expect(variables['--theme-primary']).toBe('#ff0000');
      expect(variables['--theme-text']).toBe('#ffffff');
      expect(variables['--theme-bg']).toBe('#000000');
    });

    it('should handle fixed background keyword', () => {
      const themeWithFixed = {
        ...mockTheme,
        colors: {
          ...mockTheme.colors,
          background: 'fixed',
        },
      };
      const variables = generateThemeCSSVariables(themeWithFixed);
      expect(variables['--theme-bg']).toBe(GOBDesignTokens.colors.background.primary);
    });

    it('should generate font variables', () => {
      const variables = generateThemeCSSVariables(mockTheme);
      expect(variables['--theme-font-primary']).toBe('Arial');
      expect(variables['--theme-font-mono']).toBe('Courier');
    });
  });
});
