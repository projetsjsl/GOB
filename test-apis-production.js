/**
 * Test des APIs en Production (Vercel)
 * Vérifie que toutes les APIs fonctionnent correctement
 */

const testProductionAPIs = async () => {
  console.log('🧪 Test des APIs en Production Vercel');
  console.log('=====================================');

  // URL de base (à modifier selon votre déploiement)
  const BASE_URL = 'https://gobapps.com'; // Remplacez par votre URL Vercel
  
  const testCases = [
    {
      name: 'FMP Quote',
      url: `${BASE_URL}/api/fmp?endpoint=quote&symbol=AAPL`,
      expectedFields: ['symbol', 'price', 'change']
    },
    {
      name: 'FMP Profile', 
      url: `${BASE_URL}/api/fmp?endpoint=profile&symbol=AAPL`,
      expectedFields: ['symbol', 'companyName', 'industry']
    },
    {
      name: 'Market Data Quote',
      url: `${BASE_URL}/api/marketdata?endpoint=quote&symbol=AAPL&source=auto`,
      expectedFields: ['symbol', 'price', 'change']
    },
    {
      name: 'Marketaux News',
      url: `${BASE_URL}/api/marketaux?endpoint=ticker-sentiment&symbol=AAPL&limit=5`,
      expectedFields: ['data']
    },
    {
      name: 'Hybrid Data Quote',
      url: `${BASE_URL}/api/hybrid-data?symbol=AAPL&dataType=quote&syncIfNeeded=true`,
      expectedFields: ['success', 'data', 'source']
    },
    {
      name: 'Hybrid Data Profile',
      url: `${BASE_URL}/api/hybrid-data?symbol=AAPL&dataType=profile&syncIfNeeded=true`,
      expectedFields: ['success', 'data', 'source']
    }
  ];

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const testCase of testCases) {
    try {
      console.log(`\n📊 Test: ${testCase.name}`);
      console.log(`🔗 URL: ${testCase.url}`);
      
      const startTime = Date.now();
      const response = await fetch(testCase.url);
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        const responseTime = endTime - startTime;
        
        // Vérifier les champs attendus
        const missingFields = testCase.expectedFields.filter(field => {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return !data[parent] || !data[parent][child];
          }
          return !data[field];
        });
        
        if (missingFields.length === 0) {
          console.log(`✅ Succès (${responseTime}ms)`);
          console.log(`   Source: ${data.source || 'N/A'}`);
          console.log(`   Données: ${JSON.stringify(data).substring(0, 100)}...`);
          results.success++;
        } else {
          console.log(`⚠️ Champs manquants: ${missingFields.join(', ')}`);
          results.errors.push(`${testCase.name}: Champs manquants`);
          results.failed++;
        }
      } else {
        console.log(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
        results.errors.push(`${testCase.name}: ${response.status}`);
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
      results.errors.push(`${testCase.name}: ${error.message}`);
      results.failed++;
    }
  }

  // Résumé
  console.log('\n📈 RÉSUMÉ DES TESTS');
  console.log('===================');
  console.log(`✅ Succès: ${results.success}`);
  console.log(`❌ Échecs: ${results.failed}`);
  console.log(`📊 Taux de réussite: ${Math.round((results.success / (results.success + results.failed)) * 100)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERREURS DÉTECTÉES:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }

  // Recommandations
  console.log('\n💡 RECOMMANDATIONS:');
  if (results.failed === 0) {
    console.log('🎉 Toutes les APIs fonctionnent parfaitement !');
    console.log('✅ Le système est prêt pour Supabase');
  } else if (results.failed <= 2) {
    console.log('⚠️ Quelques APIs ont des problèmes mineurs');
    console.log('🔧 Vérifier les clés API et la configuration');
  } else {
    console.log('🚨 Problèmes majeurs détectés');
    console.log('🔧 Vérifier la configuration des APIs');
    console.log('📞 Consulter les logs Vercel pour plus de détails');
  }

  return results;
};

// Test spécifique pour Supabase
const testSupabaseConnection = async () => {
  console.log('\n🗄️ Test de Connexion Supabase');
  console.log('==============================');
  
  const BASE_URL = 'https://gobapps.com';
  
  try {
    // Test de l'API watchlist (qui utilise déjà Supabase)
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connexion Supabase réussie');
      console.log(`   Watchlist: ${data.tickers?.length || 0} tickers`);
      return true;
    } else {
      console.log(`❌ Erreur Supabase: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Exception Supabase: ${error.message}`);
    return false;
  }
};

// Exécuter tous les tests
const runAllTests = async () => {
  console.log('🚀 DÉMARRAGE DES TESTS COMPLETS');
  console.log('================================');
  
  const apiResults = await testProductionAPIs();
  const supabaseOk = await testSupabaseConnection();
  
  console.log('\n🎯 CONCLUSION FINALE');
  console.log('====================');
  
  if (apiResults.success >= 4 && supabaseOk) {
    console.log('🎉 SYSTÈME ENTIÈREMENT OPÉRATIONNEL !');
    console.log('✅ APIs fonctionnelles');
    console.log('✅ Supabase connecté');
    console.log('✅ Prêt pour le cache local');
  } else if (apiResults.success >= 4) {
    console.log('⚠️ APIs OK mais Supabase à configurer');
    console.log('🔧 Suivre le guide ACTION-IMMEDIATE-SUPABASE.md');
  } else {
    console.log('🚨 Problèmes détectés');
    console.log('🔧 Vérifier la configuration des APIs');
  }
};

// Exporter pour utilisation
export { testProductionAPIs, testSupabaseConnection, runAllTests };

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
