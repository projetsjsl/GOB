/**
 * Tests unitaires - Intent Detector SMS
 */

const { detectIntent, isValidTicker } = require('../intent-detector-sms');

describe('Intent Detector SMS', () => {
  describe('ANALYSE Intent', () => {
    test('detecte "Analyse AAPL"', () => {
      const result = detectIntent('Analyse AAPL');
      expect(result.intent).toBe('ANALYSE');
      expect(result.entities.ticker).toBe('AAPL');
      expect(result.needsClarification).toBe(false);
    });

    test('detecte "analyse courte BTC"', () => {
      const result = detectIntent('analyse courte BTC');
      expect(result.intent).toBe('ANALYSE');
      expect(result.entities.ticker).toBe('BTC');
      expect(result.entities.modifier).toBe('courte');
    });

    test('rejette ticker invalide', () => {
      const result = detectIntent('Analyse TOOLONG');
      expect(result.needsClarification).toBe(true);
    });
  });

  describe('DONNEES Intent', () => {
    test('detecte "Prix AAPL"', () => {
      const result = detectIntent('Prix AAPL');
      expect(result.intent).toBe('DONNEES');
      expect(result.entities.ticker).toBe('AAPL');
      expect(result.entities.dataType).toBe('price');
    });

    test('detecte "Taux Fed"', () => {
      const result = detectIntent('Taux Fed');
      expect(result.intent).toBe('DONNEES');
      expect(result.entities.type).toBe('fed');
    });

    test('detecte "Inflation US"', () => {
      const result = detectIntent('Inflation US');
      expect(result.intent).toBe('DONNEES');
      expect(result.entities.dataType).toBe('inflation');
      expect(result.entities.region).toBe('US');
    });
  });

  describe('RESUME Intent', () => {
    test('detecte "Résumé: dette Canada"', () => {
      const result = detectIntent('Résumé: dette Canada');
      expect(result.intent).toBe('RESUME');
      expect(result.entities.query).toBe('dette Canada');
    });

    test('detecte "Perplexity impact IA"', () => {
      const result = detectIntent('Perplexity impact IA');
      expect(result.intent).toBe('RESUME');
      expect(result.entities.query).toBeTruthy();
    });
  });

  describe('CALCUL Intent', () => {
    test('detecte "Calcul prêt 300k 25 ans 4.9%"', () => {
      const result = detectIntent('Calcul prêt 300k 25 ans 4.9%');
      expect(result.intent).toBe('CALCUL');
      expect(result.entities.calculationType).toBe('loan');
      expect(result.entities.amount).toBe(300000);
      expect(result.entities.years).toBe(25);
      expect(result.entities.rate).toBe(4.9);
    });

    test('detecte "Variation % 120 145"', () => {
      const result = detectIntent('Variation % 120 145');
      expect(result.intent).toBe('CALCUL');
      expect(result.entities.calculationType).toBe('variation');
      expect(result.entities.from).toBe(120);
      expect(result.entities.to).toBe(145);
    });
  });

  describe('SOURCES Intent', () => {
    test('detecte "Source ?"', () => {
      const result = detectIntent('Source ?');
      expect(result.intent).toBe('SOURCES');
    });

    test('detecte "Sources?"', () => {
      const result = detectIntent('Sources?');
      expect(result.intent).toBe('SOURCES');
    });
  });

  describe('AIDE Intent', () => {
    test('detecte "Aide"', () => {
      const result = detectIntent('Aide');
      expect(result.intent).toBe('AIDE');
    });

    test('detecte "?"', () => {
      const result = detectIntent('?');
      expect(result.intent).toBe('AIDE');
    });
  });

  describe('UNKNOWN Intent', () => {
    test('detecte message invalide', () => {
      const result = detectIntent('blabla random');
      expect(result.intent).toBe('UNKNOWN');
      expect(result.needsClarification).toBe(true);
    });
  });

  describe('Validation Ticker', () => {
    test('valide ticker correct', () => {
      expect(isValidTicker('AAPL')).toBe(true);
      expect(isValidTicker('BTC')).toBe(true);
      expect(isValidTicker('A')).toBe(true);
    });

    test('rejette ticker invalide', () => {
      expect(isValidTicker('TOOLONG')).toBe(false);
      expect(isValidTicker('aapl')).toBe(false);
      expect(isValidTicker('')).toBe(false);
    });
  });
});

// Exécuter tests si lancé directement
if (require.main === module) {
  console.log('Running intent detector tests...');
  // Note: Jest doit être installé pour exécuter réellement
  console.log('Use: npm test ou jest intent-detector.test.js');
}

module.exports = {};
