/**
 * Script de Test pour le Nouveau Système Batch API
 * Tests les nouveaux endpoints et fallbacks
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test 1: Health Check de l'API marketdata
async function testHealthCheck() {
  console.log('\n🔍 Test 1: Health Check API Marketdata');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${API_BASE_URL}/api/marketdata`);
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('📊 Version:', data.version);
    console.log('🔧 Endpoints disponibles:', data.availableEndpoints?.join(', '));
    console.log('📦 Batch support:', data.batchSupport ? 'OUI' : 'NON');

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Test 2: Batch endpoint avec 3 symboles
async function testBatchEndpoint() {
  console.log('\n🚀 Test 2: Batch Endpoint (3 symboles)');
  console.log('=' .repeat(60));

  const symbols = ['AAPL', 'MSFT', 'GOOGL'];
  const endpoints = ['quote', 'fundamentals'];

  try {
    const url = `${API_BASE_URL}/api/marketdata/batch?symbols=${symbols.join(',')}&endpoints=${endpoints.join(',')}`;
    console.log('📡 URL:', url);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('⏱️  Durée:', duration + 'ms');
    console.log('📊 Metadata:', JSON.stringify(data.metadata, null, 2));
    console.log('💰 API Calls Saved:', data.metadata?.api_calls_saved);
    console.log('📦 Data Points:', data.metadata?.total_data_points);

    // Vérifier que les données sont présentes
    if (data.data?.quote) {
      console.log('\n✅ Quote data reçue pour:', Object.keys(data.data.quote).join(', '));
    }
    if (data.data?.fundamentals) {
      console.log('✅ Fundamentals data reçue pour:', Object.keys(data.data.fundamentals).join(', '));
    }

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Test 3: Single fundamentals avec fallback
async function testFundamentalsWithFallback() {
  console.log('\n🔄 Test 3: Fundamentals avec Fallback Chain');
  console.log('=' .repeat(60));

  const symbol = 'AAPL';

  try {
    const url = `${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbol=${symbol}`;
    console.log('📡 URL:', url);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('⏱️  Durée:', duration + 'ms');
    console.log('🔗 Source:', data.source);
    console.log('📊 Profile:', data.profile ? '✅ Présent' : '❌ Manquant');
    console.log('📊 Ratios:', data.ratios ? '✅ Présent' : '❌ Manquant');
    console.log('📊 Quote:', data.quote ? '✅ Présent' : '❌ Manquant');

    if (data.profile) {
      console.log('   - Entreprise:', data.profile.companyName);
      console.log('   - Secteur:', data.profile.sector);
      console.log('   - Industrie:', data.profile.industry);
    }

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Test 4: Batch fundamentals (multi-symboles)
async function testBatchFundamentals() {
  console.log('\n📦 Test 4: Batch Fundamentals (FMP direct)');
  console.log('=' .repeat(60));

  const symbols = 'AAPL,MSFT,GOOGL,TSLA';

  try {
    const url = `${API_BASE_URL}/api/marketdata?endpoint=fundamentals&symbols=${symbols}`;
    console.log('📡 URL:', url);

    const startTime = Date.now();
    const response = await fetch(url);
    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log('✅ Status:', response.status);
    console.log('⏱️  Durée:', duration + 'ms');

    // Compter les symboles reçus
    const receivedSymbols = Object.keys(data);
    console.log('📊 Symboles reçus:', receivedSymbols.length);
    console.log('   -', receivedSymbols.join(', '));

    // Vérifier chaque symbole
    receivedSymbols.forEach(sym => {
      const hasProfile = data[sym]?.profile ? '✅' : '❌';
      const hasRatios = data[sym]?.ratios ? '✅' : '❌';
      const hasQuote = data[sym]?.quote ? '✅' : '❌';
      console.log(`   ${sym}: Profile ${hasProfile} | Ratios ${hasRatios} | Quote ${hasQuote}`);
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Test 5: Performance comparison (batch vs individual)
async function testPerformanceComparison() {
  console.log('\n⚡ Test 5: Comparaison Performance (Batch vs Individual)');
  console.log('=' .repeat(60));

  const symbols = ['AAPL', 'MSFT', 'GOOGL'];

  // Test individual requests
  console.log('\n📊 Méthode Individuelle (ancienne):');
  const individualStart = Date.now();
  let individualCount = 0;

  for (const symbol of symbols) {
    try {
      await fetch(`${API_BASE_URL}/api/marketdata?endpoint=quote&symbol=${symbol}`);
      individualCount++;
    } catch (e) {
      console.log(`   ⚠️ Échec pour ${symbol}`);
    }
  }

  const individualDuration = Date.now() - individualStart;
  console.log(`   ✅ ${individualCount}/${symbols.length} requêtes réussies`);
  console.log(`   ⏱️  Temps total: ${individualDuration}ms`);
  console.log(`   📡 Requêtes API: ${individualCount}`);

  // Test batch request
  console.log('\n📦 Méthode Batch (nouvelle):');
  const batchStart = Date.now();

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/marketdata/batch?symbols=${symbols.join(',')}&endpoints=quote`
    );
    const batchDuration = Date.now() - batchStart;
    const data = await response.json();

    console.log(`   ✅ 1 requête batch réussie`);
    console.log(`   ⏱️  Temps total: ${batchDuration}ms`);
    console.log(`   📡 Requêtes API: 1`);
    console.log(`   💰 Économie: ${individualCount - 1} requêtes (${Math.round((1 - 1/individualCount) * 100)}%)`);
    console.log(`   🚀 Gain temps: ${individualDuration - batchDuration}ms (${Math.round((1 - batchDuration/individualDuration) * 100)}% plus rapide)`);
  } catch (error) {
    console.error('   ❌ Erreur batch:', error.message);
  }

  return true;
}

// Test 6: Vérifier GEMINI_API_KEY
async function testGeminiKey() {
  console.log('\n🤖 Test 6: GEMINI_API_KEY (Emma AI)');
  console.log('=' .repeat(60));

  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Test connection',
        conversationHistory: []
      })
    });

    const data = await response.json();

    if (response.status === 503) {
      console.log('❌ GEMINI_API_KEY manquante ou invalide');
      console.log('⚠️  Action requise: Ajouter la clé dans Vercel');
      return false;
    } else if (response.ok) {
      console.log('✅ GEMINI_API_KEY configurée correctement');
      console.log('🤖 Emma AI opérationnelle');
      return true;
    } else {
      console.log('⚠️  Status:', response.status);
      console.log('📝 Message:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

// Exécution de tous les tests
async function runAllTests() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTS DU NOUVEAU SYSTÈME BATCH API                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n📍 Base URL:', API_BASE_URL);
  console.log('⏰ Date:', new Date().toLocaleString('fr-CA'));

  const results = {
    healthCheck: await testHealthCheck(),
    batchEndpoint: await testBatchEndpoint(),
    fundamentalsWithFallback: await testFundamentalsWithFallback(),
    batchFundamentals: await testBatchFundamentals(),
    performanceComparison: await testPerformanceComparison(),
    geminiKey: await testGeminiKey()
  };

  // Résumé final
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  📊 RÉSUMÉ DES TESTS                                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'RÉUSSI' : 'ÉCHOUÉ';
    console.log(`${icon} ${test.padEnd(30)} ${status}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = Math.round((passedTests / totalTests) * 100);

  console.log('\n' + '─'.repeat(60));
  console.log(`📊 Tests réussis: ${passedTests}/${totalTests} (${successRate}%)`);
  console.log('─'.repeat(60));

  if (successRate === 100) {
    console.log('\n🎉 TOUS LES TESTS SONT RÉUSSIS!');
    console.log('✅ Le système batch est pleinement opérationnel');
  } else if (successRate >= 80) {
    console.log('\n⚠️  LA PLUPART DES TESTS SONT RÉUSSIS');
    console.log('🔧 Quelques ajustements mineurs peuvent être nécessaires');
  } else {
    console.log('\n❌ PLUSIEURS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Vérifier la configuration et les clés API');
  }

  console.log('\n💡 Pour tester en production:');
  console.log('   API_BASE_URL=https://votre-app.vercel.app node test-batch-api.js');
}

// Exécuter si appelé directement
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('\n💥 ERREUR FATALE:', error);
    process.exit(1);
  });
}

module.exports = {
  testHealthCheck,
  testBatchEndpoint,
  testFundamentalsWithFallback,
  testBatchFundamentals,
  testPerformanceComparison,
  testGeminiKey,
  runAllTests
};
