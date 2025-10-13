#!/usr/bin/env node

/**
 * Test des corrections du dashboard
 * Vérifie que les erreurs principales sont résolues
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testAPIEndpoint(endpoint, params = {}) {
  try {
    const url = new URL(`${BASE_URL}/api/unified-serverless`);
    url.searchParams.set('endpoint', endpoint);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log(`🔍 Test ${endpoint}: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${endpoint}: OK (${response.status})`);
      return { success: true, data };
    } else {
      console.log(`❌ ${endpoint}: ${response.status} - ${data.error || 'Erreur inconnue'}`);
      return { success: false, error: data.error, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: Erreur réseau - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Test des corrections du dashboard\n');
  
  const tests = [
    { endpoint: 'test-env', name: 'Variables d\'environnement' },
    { endpoint: 'test-gemini', name: 'Test Gemini' },
    { endpoint: 'marketaux', params: { symbol: 'AAPL' }, name: 'Marketaux (simulé)' },
    { endpoint: 'claude', name: 'Claude (simulé)' },
    { endpoint: 'fmp', params: { action: 'quote', symbol: 'AAPL' }, name: 'FMP Quote' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testAPIEndpoint(test.endpoint, test.params);
    results.push({
      name: test.name,
      endpoint: test.endpoint,
      ...result
    });
    console.log(''); // Ligne vide pour la lisibilité
  }

  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS:');
  console.log('==================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.success ? 'OK' : result.error || 'Erreur'}`);
  });
  
  console.log(`\n🎯 Résultat: ${successful}/${results.length} tests réussis`);
  
  if (failed === 0) {
    console.log('🎉 Toutes les corrections sont fonctionnelles !');
  } else {
    console.log(`⚠️ ${failed} test(s) échoué(s) - Vérification nécessaire`);
  }
}

// Exécuter les tests
runTests().catch(console.error);
