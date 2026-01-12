/**
 * Tests unitaires - SMS Validator
 */

const { validateSMS, autoFixSMS, estimateSMSCost } = require('../sms-validator.cjs');

describe('SMS Validator', () => {
  describe('validateSMS', () => {
    test('valide SMS correct avec source', () => {
      const text = 'AAPL: 150.25$ (+2.3%). P/E: 28. Secteur tech.\n\nSource: FMP';
      const result = validateSMS(text);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.hasSource).toBe(true);
    });

    test('rejette SMS sans source', () => {
      const text = 'AAPL: 150.25$ (+2.3%). P/E: 28.';
      const result = validateSMS(text);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source manquante (obligatoire)');
    });

    test('valide SMS avec skip source check', () => {
      const text = 'Aide: Commandes disponibles...';
      const result = validateSMS(text, { skipSourceCheck: true });

      expect(result.valid).toBe(true);
    });

    test('rejette SMS trop long', () => {
      const longText = 'A'.repeat(400) + '\n\nSource: FMP';
      const result = validateSMS(longText);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('trop long'))).toBe(true);
    });

    test('detecte encodage GSM-7', () => {
      const text = 'Simple ASCII text.\n\nSource: FMP';
      const result = validateSMS(text);

      expect(result.metadata.encoding).toBe('GSM-7');
    });

    test('detecte encodage UCS-2', () => {
      const text = 'Texte avec émoji 😀\n\nSource: FMP';
      const result = validateSMS(text);

      expect(result.metadata.encoding).toBe('UCS-2');
    });
  });

  describe('autoFixSMS', () => {
    test('ajoute source manquante', () => {
      const text = 'AAPL: 150.25$ (+2.3%)';
      const result = autoFixSMS(text, { defaultSource: 'FMP' });

      expect(result.text).toContain('Source: FMP');
      expect(result.corrections).toContain('Source ajoutée automatiquement');
    });

    test('tronque texte trop long', () => {
      const longText = 'A'.repeat(400);
      const result = autoFixSMS(longText, { defaultSource: 'FMP' });

      expect(result.text.length).toBeLessThanOrEqual(320);
      expect(result.corrections.some(c => c.includes('Tronqué'))).toBe(true);
    });

    test('supprime caractères problématiques', () => {
      const text = 'Test 😀 emoji\n\nSource: FMP';
      const result = autoFixSMS(text);

      expect(result.text).not.toContain('😀');
      expect(result.corrections.some(c => c.includes('caractères spéciaux'))).toBe(true);
    });
  });

  describe('estimateSMSCost', () => {
    test('estime 1 SMS pour texte court', () => {
      const text = 'AAPL: 150.25$\n\nSource: FMP';
      const result = estimateSMSCost(text);

      expect(result.numSMS).toBe(1);
      expect(result.encoding).toBe('GSM-7');
    });

    test('estime 2 SMS pour texte long', () => {
      const text = 'A'.repeat(200) + '\n\nSource: FMP';
      const result = estimateSMSCost(text);

      expect(result.numSMS).toBe(2);
    });

    test('calcule coût correct', () => {
      const text = 'Test\n\nSource: FMP';
      const result = estimateSMSCost(text);

      expect(result.cost).toBe(0.01); // 1 SMS = 0.01 CAD
    });
  });
});

// Exécuter tests si lancé directement
if (require.main === module) {
  console.log('Running SMS validator tests...');
  console.log('Use: npm test ou jest sms-validator.test.js');
}

module.exports = {};
