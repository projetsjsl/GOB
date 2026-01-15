/**
 * Tests pour les Design Tokens
 * 
 * Verifie que tous les tokens sont correctement definis et coherents
 */

import { describe, it, expect } from 'vitest';
import { GOBDesignTokens, tailwindColors, cssVariables } from '../tokens';

describe('GOB Design Tokens', () => {
  describe('Colors', () => {
    it('should have all primary color variants', () => {
      expect(GOBDesignTokens.colors.primary.light).toBe('#8b5cf6');
      expect(GOBDesignTokens.colors.primary.default).toBe('#6366f1');
      expect(GOBDesignTokens.colors.primary.dark).toBe('#4f46e5');
    });

    it('should have all state colors defined', () => {
      expect(GOBDesignTokens.colors.success).toBe('#10b981');
      expect(GOBDesignTokens.colors.danger).toBe('#ef4444');
      expect(GOBDesignTokens.colors.warning).toBe('#f59e0b');
      expect(GOBDesignTokens.colors.info).toBe('#3b82f6');
    });

    it('should have text colors defined', () => {
      expect(GOBDesignTokens.colors.text.primary).toBe('#ffffff');
      expect(GOBDesignTokens.colors.text.secondary).toBe('#9ca3af');
      expect(GOBDesignTokens.colors.text.muted).toBe('#6b7280');
    });

    it('should have background colors defined', () => {
      expect(GOBDesignTokens.colors.background.primary).toBe('#000000');
      expect(GOBDesignTokens.colors.background.secondary).toBe('#111827');
    });

    it('should have border colors defined', () => {
      expect(GOBDesignTokens.colors.border.default).toBe('#374151');
      expect(GOBDesignTokens.colors.border.subtle).toBe('rgba(255, 255, 255, 0.1)');
    });
  });

  describe('Spacing', () => {
    it('should have all spacing values defined', () => {
      expect(GOBDesignTokens.spacing.xs).toBe('4px');
      expect(GOBDesignTokens.spacing.sm).toBe('8px');
      expect(GOBDesignTokens.spacing.md).toBe('16px');
      expect(GOBDesignTokens.spacing.lg).toBe('24px');
      expect(GOBDesignTokens.spacing.xl).toBe('32px');
    });

    it('should follow 4px scale', () => {
      const spacingValues = Object.values(GOBDesignTokens.spacing).map(v => parseInt(v));
      spacingValues.forEach(value => {
        expect(value % 4).toBe(0);
      });
    });
  });

  describe('Typography', () => {
    it('should have font families defined', () => {
      expect(GOBDesignTokens.typography.fontFamily.primary).toContain('Inter');
      expect(GOBDesignTokens.typography.fontFamily.mono).toContain('Courier');
    });

    it('should have font sizes defined', () => {
      expect(GOBDesignTokens.typography.fontSize.xs).toBe('0.75rem');
      expect(GOBDesignTokens.typography.fontSize.base).toBe('1rem');
      expect(GOBDesignTokens.typography.fontSize.lg).toBe('1.125rem');
    });
  });

  describe('Tailwind Colors Export', () => {
    it('should export all colors for Tailwind', () => {
      expect(tailwindColors['gob-primary']).toBe(GOBDesignTokens.colors.primary.default);
      expect(tailwindColors['gob-success']).toBe(GOBDesignTokens.colors.success);
      expect(tailwindColors['gob-danger']).toBe(GOBDesignTokens.colors.danger);
    });
  });

  describe('CSS Variables Export', () => {
    it('should export all CSS variables', () => {
      expect(cssVariables['--gob-primary']).toBe(GOBDesignTokens.colors.primary.default);
      expect(cssVariables['--gob-spacing-md']).toBe(GOBDesignTokens.spacing.md);
    });
  });
});
