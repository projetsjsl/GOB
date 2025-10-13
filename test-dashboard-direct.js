#!/usr/bin/env node

/**
 * Test direct du dashboard pour vérifier les corrections
 */

const BASE_URL = 'https://gobapps.com';

async function testDashboard() {
  console.log('🚀 Test direct du dashboard\n');
  
  try {
    console.log(`🔍 Test du dashboard: ${BASE_URL}/beta-combined-dashboard.html`);
    
    const response = await fetch(`${BASE_URL}/beta-combined-dashboard.html`);
    
    if (response.ok) {
      console.log('✅ Dashboard accessible:', response.status);
      
      const html = await response.text();
      
      // Vérifier que les corrections sont présentes
      const hasCacheIntegration = html.includes('Cache Supabase');
      const hasFetchSymbolNews = html.includes('fetchSymbolNews');
      const hasQuoteDataFix = !html.includes('quoteData?.source') || html.includes('quote?.source');
      
      console.log('\n📊 Vérification des corrections:');
      console.log(`   Intégration cache: ${hasCacheIntegration ? '✅' : '❌'}`);
      console.log(`   Fonction fetchSymbolNews: ${hasFetchSymbolNews ? '✅' : '❌'}`);
      console.log(`   Correction quoteData: ${hasQuoteDataFix ? '✅' : '❌'}`);
      
      if (hasCacheIntegration && hasFetchSymbolNews && hasQuoteDataFix) {
        console.log('\n🎉 Toutes les corrections sont présentes dans le dashboard !');
        console.log('Le dashboard devrait maintenant fonctionner sans "eternal loop".');
      } else {
        console.log('\n⚠️ Certaines corrections sont manquantes.');
      }
      
    } else {
      console.log(`❌ Dashboard inaccessible: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur test dashboard: ${error.message}`);
  }
}

// Test des APIs directement
async function testAPIsDirectly() {
  console.log('\n🔧 Test des APIs directement:\n');
  
  const apis = [
    { name: 'Variables env', url: `${BASE_URL}/api/unified-serverless?endpoint=test-env` },
    { name: 'Marketaux', url: `${BASE_URL}/api/unified-serverless?endpoint=marketaux&symbol=AAPL` },
    { name: 'News normal', url: `${BASE_URL}/api/unified-serverless?endpoint=news&symbol=AAPL` }
  ];
  
  for (const api of apis) {
    try {
      const response = await fetch(api.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${api.name}: OK (${response.status})`);
      } else {
        console.log(`❌ ${api.name}: ${response.status} - ${data.error || 'Erreur'}`);
      }
    } catch (error) {
      console.log(`❌ ${api.name}: Erreur réseau - ${error.message}`);
    }
  }
}

// Exécuter les tests
async function runAllTests() {
  await testDashboard();
  await testAPIsDirectly();
  
  console.log('\n🎯 Résumé:');
  console.log('Si le dashboard est accessible et contient les corrections,');
  console.log('il devrait fonctionner sans "eternal loop".');
  console.log('Les APIs peuvent encore être en cours de déploiement.');
}

runAllTests().catch(console.error);
