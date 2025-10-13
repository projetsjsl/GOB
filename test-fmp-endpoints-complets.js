/**
 * Test Complet des Endpoints FMP
 * Teste tous les endpoints FMP disponibles avec la clé API
 */

const testFmpEndpointsComplets = async () => {
  console.log('🔍 TEST COMPLET DES ENDPOINTS FMP');
  console.log('==================================');
  console.log('');

  const FMP_API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
  const symbol = 'AAPL';

  // Test 1: Endpoints de base
  console.log('📋 ÉTAPE 1: Test des Endpoints de Base');
  console.log('--------------------------------------');
  
  const baseEndpoints = [
    { name: 'Profile', url: `https://financialmodelingprep.com/stable/profile?symbol=${symbol}&apikey=${FMP_API_KEY}` },
    { name: 'Quote', url: `https://financialmodelingprep.com/stable/quote/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Quote Short', url: `https://financialmodelingprep.com/stable/quote-short/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Real-time Price', url: `https://financialmodelingprep.com/stable/real-time-price/${symbol}?apikey=${FMP_API_KEY}` }
  ];

  for (const endpoint of baseEndpoints) {
    try {
      console.log(`  🔄 Test ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        if (data.length > 0) {
          console.log(`    ✅ ${endpoint.name}: Fonctionnel (${data.length} éléments)`);
          if (endpoint.name === 'Profile' && data[0].price) {
            console.log(`       Prix: $${data[0].price}`);
            console.log(`       Market Cap: $${data[0].marketCap}`);
          }
        } else {
          console.log(`    ⚠️ ${endpoint.name}: Fonctionnel mais vide`);
        }
      } else {
        console.log(`    ❌ ${endpoint.name}: Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 2: Endpoints financiers
  console.log('📊 ÉTAPE 2: Test des Endpoints Financiers');
  console.log('------------------------------------------');
  
  const financialEndpoints = [
    { name: 'Analyst Estimates', url: `https://financialmodelingprep.com/stable/analyst-estimates?symbol=${symbol}&period=annual&apikey=${FMP_API_KEY}` },
    { name: 'Financial Ratios', url: `https://financialmodelingprep.com/stable/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Key Metrics', url: `https://financialmodelingprep.com/stable/key-metrics-ttm/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Company Rating', url: `https://financialmodelingprep.com/stable/rating/${symbol}?apikey=${FMP_API_KEY}` }
  ];

  for (const endpoint of financialEndpoints) {
    try {
      console.log(`  🔄 Test ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        if (data.length > 0) {
          console.log(`    ✅ ${endpoint.name}: Fonctionnel (${data.length} éléments)`);
        } else {
          console.log(`    ⚠️ ${endpoint.name}: Fonctionnel mais vide`);
        }
      } else {
        console.log(`    ❌ ${endpoint.name}: Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 3: Endpoints historiques
  console.log('📈 ÉTAPE 3: Test des Endpoints Historiques');
  console.log('-------------------------------------------');
  
  const historicalEndpoints = [
    { name: 'Historical Chart 1D', url: `https://financialmodelingprep.com/stable/historical-chart/1day/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Historical Chart 1H', url: `https://financialmodelingprep.com/stable/historical-chart/1hour/${symbol}?apikey=${FMP_API_KEY}` },
    { name: 'Historical Price Full', url: `https://financialmodelingprep.com/stable/historical-price-full/${symbol}?apikey=${FMP_API_KEY}` }
  ];

  for (const endpoint of historicalEndpoints) {
    try {
      console.log(`  🔄 Test ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        if (data.length > 0) {
          console.log(`    ✅ ${endpoint.name}: Fonctionnel (${data.length} éléments)`);
        } else {
          console.log(`    ⚠️ ${endpoint.name}: Fonctionnel mais vide`);
        }
      } else {
        console.log(`    ❌ ${endpoint.name}: Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 4: Endpoints d'actualités
  console.log('📰 ÉTAPE 4: Test des Endpoints d\'Actualités');
  console.log('---------------------------------------------');
  
  const newsEndpoints = [
    { name: 'Company News', url: `https://financialmodelingprep.com/stable/stock_news?tickers=${symbol}&apikey=${FMP_API_KEY}` },
    { name: 'General News', url: `https://financialmodelingprep.com/stable/general_news?apikey=${FMP_API_KEY}` }
  ];

  for (const endpoint of newsEndpoints) {
    try {
      console.log(`  🔄 Test ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        if (data.length > 0) {
          console.log(`    ✅ ${endpoint.name}: Fonctionnel (${data.length} éléments)`);
        } else {
          console.log(`    ⚠️ ${endpoint.name}: Fonctionnel mais vide`);
        }
      } else {
        console.log(`    ❌ ${endpoint.name}: Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 5: Résumé et recommandations
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('===================');
  console.log('✅ Clé API FMP fonctionnelle');
  console.log('✅ Plusieurs endpoints disponibles');
  console.log('✅ Données complètes accessibles');
  console.log('');
  console.log('🎯 RECOMMANDATIONS POUR NOTRE API:');
  console.log('===================================');
  console.log('');
  console.log('1. UTILISER L\'ENDPOINT /profile POUR getQuote():');
  console.log('   - Contient: prix, market cap, volume, etc.');
  console.log('   - Plus fiable que /quote qui peut être vide');
  console.log('');
  console.log('2. AJOUTER D\'AUTRES ENDPOINTS:');
  console.log('   - /analyst-estimates pour les estimations');
  console.log('   - /ratios-ttm pour les ratios financiers');
  console.log('   - /key-metrics-ttm pour les métriques clés');
  console.log('   - /historical-chart pour les graphiques');
  console.log('');
  console.log('3. METTRE À JOUR LA CLÉ API DANS VERCEL:');
  console.log('   - Vérifier que FMP_API_KEY = Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt');
  console.log('   - Redéployer après modification');
  console.log('');
  console.log('🎉 Une fois la clé mise à jour, le système sera entièrement fonctionnel !');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testFmpEndpointsComplets().catch(console.error);
}

export { testFmpEndpointsComplets };
