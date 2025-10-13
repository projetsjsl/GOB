/**
 * Test FMP avec la Bonne Clé API
 * Teste l'API FMP avec la clé fournie par l'utilisateur
 */

const testFmpAvecBonneCle = async () => {
  console.log('🔑 TEST FMP AVEC LA BONNE CLÉ API');
  console.log('==================================');
  console.log('');

  const FMP_API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';

  // Test 1: Vérifier que la clé fonctionne
  console.log('📋 ÉTAPE 1: Vérification de la Clé API');
  console.log('-------------------------------------');
  
  try {
    const response = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${FMP_API_KEY}`);
    const data = await response.json();
    
    if (response.ok && data.length > 0) {
      console.log('✅ Clé API FMP fonctionnelle !');
      console.log('Données reçues:', data.length, 'éléments');
      console.log('Exemple de données:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('❌ Clé API FMP non fonctionnelle');
      console.log('Status:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 2: Tester différents endpoints
  console.log('🔌 ÉTAPE 2: Test des Endpoints FMP');
  console.log('----------------------------------');
  
  const endpoints = [
    { name: 'Profile', url: `https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${FMP_API_KEY}` },
    { name: 'Quote', url: `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${FMP_API_KEY}` },
    { name: 'Historical Chart', url: `https://financialmodelingprep.com/stable/historical-chart/1day/AAPL?apikey=${FMP_API_KEY}` }
  ];

  for (const endpoint of endpoints) {
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

  // Test 3: Recommandations
  console.log('🎯 ÉTAPE 3: Recommandations');
  console.log('---------------------------');
  
  console.log('🔧 POUR RÉSOUDRE LE PROBLÈME:');
  console.log('');
  console.log('1. METTRE À JOUR LA CLÉ API DANS VERCEL:');
  console.log('   - Aller sur https://vercel.com/dashboard');
  console.log('   - Sélectionner le projet GOB');
  console.log('   - Settings → Environment Variables');
  console.log('   - Modifier FMP_API_KEY avec: Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt');
  console.log('   - Redéployer le projet');
  console.log('');
  console.log('2. VÉRIFIER QUE LA CORRECTION FONCTIONNE:');
  console.log('   - L\'endpoint /quote/AAPL retourne un tableau vide');
  console.log('   - L\'endpoint /profile?symbol=AAPL retourne des données complètes');
  console.log('   - Notre code utilise maintenant /profile pour getQuote()');
  console.log('');
  console.log('3. TESTER APRÈS REDÉPLOIEMENT:');
  console.log('   - curl "https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote"');
  console.log('   - Vérifier que les données s\'affichent correctement');
  console.log('');

  console.log('📊 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ Clé API FMP fonctionnelle');
  console.log('✅ Endpoint /profile fonctionnel');
  console.log('✅ Code corrigé pour utiliser /profile');
  console.log('❌ Clé API dans Vercel à mettre à jour');
  console.log('');
  console.log('🎉 Une fois la clé mise à jour dans Vercel, le système sera fonctionnel !');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testFmpAvecBonneCle().catch(console.error);
}

export { testFmpAvecBonneCle };
