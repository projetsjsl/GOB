/**
 * Test Rapide des APIs
 * Vérifie rapidement si les APIs sont fonctionnelles
 */

const testApisRapide = async () => {
  console.log('⚡ TEST RAPIDE DES APIs');
  console.log('======================');
  console.log('');

  const tests = [
    {
      name: 'FMP Quote',
      url: 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote',
      critical: true
    },
    {
      name: 'Market Data Yahoo',
      url: 'https://gobapps.com/api/unified-serverless?endpoint=marketdata&symbol=AAPL&source=yahoo',
      critical: true
    },
    {
      name: 'Marketaux News',
      url: 'https://gobapps.com/api/unified-serverless?endpoint=marketaux&symbol=AAPL&limit=3',
      critical: false
    },
    {
      name: 'Hybrid Data Quote',
      url: 'https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=AAPL&dataType=quote&syncIfNeeded=true',
      critical: true
    }
  ];

  let successCount = 0;
  let criticalFailures = 0;

  for (const test of tests) {
    try {
      console.log(`🔄 ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`   ✅ ${test.name}: OK`);
        successCount++;
      } else {
        console.log(`   ❌ ${test.name}: ${data.error || 'Erreur inconnue'}`);
        if (test.critical) {
          criticalFailures++;
        }
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ${error.message}`);
      if (test.critical) {
        criticalFailures++;
      }
    }
  }

  console.log('');
  console.log('📊 RÉSULTATS:');
  console.log(`✅ Succès: ${successCount}/${tests.length}`);
  console.log(`🚨 Échecs critiques: ${criticalFailures}`);

  if (criticalFailures === 0) {
    console.log('');
    console.log('🎉 TOUTES LES APIs CRITIQUES FONCTIONNENT !');
    console.log('✅ Le système est prêt pour la production');
    console.log('');
    console.log('📋 PROCHAINES ÉTAPES:');
    console.log('1. Tester le dashboard: https://gobapps.com/beta-combined-dashboard.html');
    console.log('2. Vérifier l\'onglet JLab™');
    console.log('3. Lancer: node populate-all-tickers-data.js');
  } else {
    console.log('');
    console.log('🚨 PROBLÈMES CRITIQUES DÉTECTÉS !');
    console.log('📖 Suivre le guide: ACTION-IMMEDIATE-VALIDATION.md');
    console.log('');
    console.log('🔧 ACTIONS REQUISES:');
    console.log('1. Configurer la clé API FMP dans Vercel');
    console.log('2. Configurer Supabase (projet gob-watchlist)');
    console.log('3. Redéployer le projet');
  }

  return { successCount, criticalFailures, total: tests.length };
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testApisRapide().catch(console.error);
}

export { testApisRapide };
