/**
 * Test FMP avec Documentation Officielle
 * Teste l'API FMP en utilisant la documentation officielle
 */

const testFmpAvecDocumentation = async () => {
  console.log('🔑 TEST FMP AVEC DOCUMENTATION OFFICIELLE');
  console.log('==========================================');
  console.log('');

  // Test 1: Vérifier la variable d'environnement
  console.log('📋 ÉTAPE 1: Vérification de la Variable d\'Environnement');
  console.log('-------------------------------------------------------');
  
  const FMP_API_KEY = process.env.FMP_API_KEY;
  console.log('FMP_API_KEY:', FMP_API_KEY ? '✅ Configurée' : '❌ Manquante');
  
  if (FMP_API_KEY) {
    console.log('Longueur de la clé:', FMP_API_KEY.length);
    console.log('Début de la clé:', FMP_API_KEY.substring(0, 8) + '...');
  } else {
    console.log('❌ Impossible de tester - clé API manquante');
    console.log('📖 Guide: Ajouter FMP_API_KEY dans Vercel Environment Variables');
    return;
  }
  console.log('');

  // Test 2: Test avec l'endpoint Quote (selon la documentation)
  console.log('🔌 ÉTAPE 2: Test Endpoint Quote (Documentation Officielle)');
  console.log('----------------------------------------------------------');
  
  try {
    const quoteUrl = `https://financialmodelingprep.com/stable/quote/AAPL?apikey=${FMP_API_KEY}`;
    console.log('URL de test:', quoteUrl.replace(FMP_API_KEY, '***'));
    
    const response = await fetch(quoteUrl);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ API FMP Quote fonctionnelle !');
      console.log('Données reçues:', data.length > 0 ? `${data.length} éléments` : 'Aucune donnée');
      if (data.length > 0) {
        console.log('Exemple de données:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('❌ Erreur API FMP Quote:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
      
      if (response.status === 403) {
        console.log('');
        console.log('🚨 ERREUR 403 - CAUSES POSSIBLES:');
        console.log('1. Clé API incorrecte ou expirée');
        console.log('2. Compte FMP inactif ou suspendu');
        console.log('3. Limite de requêtes dépassée');
        console.log('4. Plan gratuit épuisé');
        console.log('');
        console.log('🔧 SOLUTIONS:');
        console.log('1. Vérifier la clé sur https://financialmodelingprep.com');
        console.log('2. Vérifier le statut du compte');
        console.log('3. Considérer un plan payant si nécessaire');
      }
    }
  } catch (error) {
    console.log('❌ Erreur lors du test Quote:', error.message);
  }
  console.log('');

  // Test 3: Test avec l'endpoint Profile (selon la documentation)
  console.log('🔌 ÉTAPE 3: Test Endpoint Profile (Documentation Officielle)');
  console.log('------------------------------------------------------------');
  
  try {
    const profileUrl = `https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${FMP_API_KEY}`;
    console.log('URL de test:', profileUrl.replace(FMP_API_KEY, '***'));
    
    const response = await fetch(profileUrl);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    
    if (response.ok) {
      console.log('✅ API FMP Profile fonctionnelle !');
      console.log('Données reçues:', data.length > 0 ? `${data.length} éléments` : 'Aucune donnée');
      if (data.length > 0) {
        console.log('Exemple de données:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('❌ Erreur API FMP Profile:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur lors du test Profile:', error.message);
  }
  console.log('');

  // Test 4: Test avec l'endpoint Historical Chart (selon la documentation)
  console.log('🔌 ÉTAPE 4: Test Endpoint Historical Chart (Documentation Officielle)');
  console.log('--------------------------------------------------------------------');
  
  try {
    const chartUrl = `https://financialmodelingprep.com/stable/historical-chart/1day/AAPL?apikey=${FMP_API_KEY}`;
    console.log('URL de test:', chartUrl.replace(FMP_API_KEY, '***'));
    
    const response = await fetch(chartUrl);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    
    if (response.ok) {
      console.log('✅ API FMP Historical Chart fonctionnelle !');
      console.log('Données reçues:', data.length > 0 ? `${data.length} éléments` : 'Aucune donnée');
      if (data.length > 0) {
        console.log('Exemple de données:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('❌ Erreur API FMP Historical Chart:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur lors du test Historical Chart:', error.message);
  }
  console.log('');

  // Test 5: Test avec notre API unifiée
  console.log('🔌 ÉTAPE 5: Test de Notre API Unifiée');
  console.log('-------------------------------------');
  
  try {
    const ourApiUrl = 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote';
    console.log('URL de test:', ourApiUrl);
    
    const response = await fetch(ourApiUrl);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse:', JSON.stringify(data, null, 2));
    
    if (response.ok && !data.error) {
      console.log('✅ Notre API unifiée fonctionnelle !');
    } else {
      console.log('❌ Notre API unifiée échouée');
      console.log('🔧 Vérifier la configuration dans api/unified-serverless.js');
    }
  } catch (error) {
    console.log('❌ Erreur lors du test de notre API:', error.message);
  }
  console.log('');

  // Résumé et recommandations
  console.log('🎯 RÉSUMÉ ET RECOMMANDATIONS');
  console.log('============================');
  console.log('');
  console.log('📖 DOCUMENTATION FMP:');
  console.log('- Base URL: https://financialmodelingprep.com/stable/');
  console.log('- Format API Key: ?apikey=YOUR_API_KEY');
  console.log('- Endpoints disponibles: quote, profile, historical-chart, etc.');
  console.log('');
  console.log('🔧 ACTIONS REQUISES:');
  console.log('1. Vérifier que la clé API FMP est correcte');
  console.log('2. Tester la clé directement sur le site FMP');
  console.log('3. Vérifier le statut du compte FMP');
  console.log('4. Mettre à jour la clé dans Vercel si nécessaire');
  console.log('5. Redéployer le projet après modification');
  console.log('');
  console.log('🌐 LIENS UTILES:');
  console.log('- Documentation: https://site.financialmodelingprep.com/developer/docs');
  console.log('- Dashboard: https://financialmodelingprep.com');
  console.log('- Test direct: https://financialmodelingprep.com/stable/quote/AAPL?apikey=VOTRE_CLE');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testFmpAvecDocumentation().catch(console.error);
}

export { testFmpAvecDocumentation };
