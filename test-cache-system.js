#!/usr/bin/env node

/**
 * Test du système de cache Supabase pour les actualités
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testCacheEndpoint(type, params = {}) {
  try {
    const url = new URL(`${BASE_URL}/api/unified-serverless`);
    url.searchParams.set('endpoint', 'news/cached');
    url.searchParams.set('type', type);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    console.log(`🔍 Test Cache ${type}: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Cache ${type}: OK (${response.status})`);
      console.log(`   Cached: ${data.cached}`);
      console.log(`   Count: ${data.count || 0}`);
      console.log(`   Sources: ${data.sources ? data.sources.join(', ') : 'Aucune'}`);
      if (data.message) console.log(`   Message: ${data.message}`);
      return { success: true, data };
    } else {
      console.log(`❌ Cache ${type}: ${response.status} - ${data.error || 'Erreur inconnue'}`);
      return { success: false, error: data.error, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Cache ${type}: Erreur réseau - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runCacheTests() {
  console.log('🚀 Test du système de cache Supabase\n');
  
  const tests = [
    { type: 'general', params: { limit: 10 }, name: 'Actualités générales' },
    { type: 'symbol', params: { symbol: 'AAPL', limit: 5 }, name: 'Actualités AAPL' },
    { type: 'symbol', params: { symbol: 'GOOGL', limit: 5 }, name: 'Actualités GOOGL' }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testCacheEndpoint(test.type, test.params);
    results.push({
      name: test.name,
      type: test.type,
      ...result
    });
    console.log(''); // Ligne vide pour la lisibilité
  }

  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS CACHE:');
  console.log('==========================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const cached = result.success && result.data ? ` (${result.data.cached ? 'Cached' : 'Not Cached'})` : '';
    console.log(`${status} ${result.name}: ${result.success ? 'OK' + cached : result.error || 'Erreur'}`);
  });
  
  console.log(`\n🎯 Résultat: ${successful}/${results.length} tests réussis`);
  
  if (failed === 0) {
    console.log('🎉 Le système de cache fonctionne correctement !');
  } else {
    console.log(`⚠️ ${failed} test(s) échoué(s) - Vérification nécessaire`);
  }
  
  // Test de l'endpoint news normal pour comparaison
  console.log('\n🔍 Test de l\'endpoint news normal pour comparaison:');
  try {
    const url = new URL(`${BASE_URL}/api/unified-serverless`);
    url.searchParams.set('endpoint', 'news');
    url.searchParams.set('symbol', 'AAPL');
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ News normal: OK');
    } else {
      console.log(`❌ News normal: ${response.status} - ${data.error || 'Erreur'}`);
    }
  } catch (error) {
    console.log(`❌ News normal: Erreur réseau - ${error.message}`);
  }
}

// Exécuter les tests
runCacheTests().catch(console.error);
