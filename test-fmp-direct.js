/**
 * Test Direct de l'API FMP
 * Vérifie si la clé API FMP est accessible et fonctionnelle
 */

const testFmpDirect = async () => {
  console.log('🔑 TEST DIRECT DE L\'API FMP');
  console.log('============================');
  console.log('');

  // Test 1: Vérifier si la variable d'environnement est accessible
  console.log('📋 ÉTAPE 1: Vérification de la Variable d\'Environnement');
  console.log('-------------------------------------------------------');
  
  const FMP_API_KEY = process.env.FMP_API_KEY;
  console.log('FMP_API_KEY:', FMP_API_KEY ? '✅ Configurée' : '❌ Manquante');
  
  if (FMP_API_KEY) {
    console.log('Longueur de la clé:', FMP_API_KEY.length);
    console.log('Début de la clé:', FMP_API_KEY.substring(0, 8) + '...');
  }
  console.log('');

  // Test 2: Test direct avec l'API FMP
  console.log('🔌 ÉTAPE 2: Test Direct avec l\'API FMP');
  console.log('---------------------------------------');
  
  if (!FMP_API_KEY) {
    console.log('❌ Impossible de tester - clé API manquante');
    return;
  }

  try {
    // Test avec l'endpoint de base de FMP
    const testUrl = `https://financialmodelingprep.com/api/v3/quote/AAPL?apikey=${FMP_API_KEY}`;
    console.log('URL de test:', testUrl.replace(FMP_API_KEY, '***'));
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ API FMP fonctionnelle !');
      console.log('Données reçues:', data.length > 0 ? `${data.length} éléments` : 'Aucune donnée');
      if (data.length > 0) {
        console.log('Exemple de données:', JSON.stringify(data[0], null, 2));
      }
    } else {
      console.log('❌ Erreur API FMP:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
      
      if (response.status === 403) {
        console.log('');
        console.log('🚨 ERREUR 403 - CAUSES POSSIBLES:');
        console.log('1. Clé API incorrecte');
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
    console.log('❌ Erreur lors du test:', error.message);
  }
  
  console.log('');
  
  // Test 3: Test avec un autre endpoint
  console.log('🔌 ÉTAPE 3: Test avec Endpoint Alternatif');
  console.log('------------------------------------------');
  
  try {
    const testUrl2 = `https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=${FMP_API_KEY}`;
    console.log('URL de test 2:', testUrl2.replace(FMP_API_KEY, '***'));
    
    const response2 = await fetch(testUrl2);
    const data2 = await response2.json();
    
    console.log('Status HTTP:', response2.status);
    
    if (response2.ok) {
      console.log('✅ Endpoint alternatif fonctionnel !');
      console.log('Données reçues:', data2.length > 0 ? `${data2.length} éléments` : 'Aucune donnée');
    } else {
      console.log('❌ Endpoint alternatif échoué:', response2.status);
      console.log('Réponse:', JSON.stringify(data2, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur lors du test alternatif:', error.message);
  }
  
  console.log('');
  console.log('🎯 RÉSUMÉ:');
  console.log('==========');
  console.log('Si les tests directs échouent avec 403:');
  console.log('- La clé API FMP est incorrecte ou expirée');
  console.log('- Le compte FMP a des limitations');
  console.log('- Il faut configurer une nouvelle clé API');
  console.log('');
  console.log('Si les tests directs réussissent:');
  console.log('- Le problème vient de la configuration Vercel');
  console.log('- Il faut redéployer ou vérifier les variables d\'environnement');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testFmpDirect().catch(console.error);
}

export { testFmpDirect };
