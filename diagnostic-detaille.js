/**
 * Diagnostic Détaillé des APIs
 * Identifie les problèmes spécifiques avec chaque API
 */

const diagnosticDetaille = async () => {
  console.log('🔍 DIAGNOSTIC DÉTAILLÉ DES APIs');
  console.log('===============================');
  console.log('');

  // Test direct de l'API FMP
  console.log('🔌 TEST DIRECT API FMP');
  console.log('----------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('Réponse complète:', JSON.stringify(data, null, 2));
    
    if (data.details && data.details.includes('403')) {
      console.log('');
      console.log('🚨 PROBLÈME IDENTIFIÉ: 403 Forbidden');
      console.log('Causes possibles:');
      console.log('1. Clé API FMP incorrecte ou expirée');
      console.log('2. Limite de requêtes dépassée');
      console.log('3. Compte FMP inactif');
      console.log('4. Variable d\'environnement FMP_API_KEY non accessible');
    }
  } catch (error) {
    console.log('Erreur:', error.message);
  }
  
  console.log('');
  
  // Test de l'API Market Data
  console.log('🔌 TEST DIRECT API MARKET DATA');
  console.log('------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=marketdata&symbol=AAPL&source=yahoo');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Erreur:', error.message);
  }
  
  console.log('');
  
  // Test de l'API Marketaux (qui fonctionne)
  console.log('🔌 TEST DIRECT API MARKETAUX');
  console.log('----------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=marketaux&symbol=AAPL&limit=1');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Succès:', data.success || 'Non défini');
    console.log('Données présentes:', data.data ? 'Oui' : 'Non');
  } catch (error) {
    console.log('Erreur:', error.message);
  }
  
  console.log('');
  
  // Test de l'API unifiée
  console.log('🔌 TEST API UNIFIÉE');
  console.log('-------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=AAPL&dataType=quote&syncIfNeeded=true');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Erreur:', error.message);
  }
  
  console.log('');
  console.log('🎯 RECOMMANDATIONS:');
  console.log('==================');
  console.log('1. Vérifier que FMP_API_KEY est correctement configurée dans Vercel');
  console.log('2. Tester la clé FMP directement sur leur site');
  console.log('3. Vérifier que le compte FMP est actif');
  console.log('4. Configurer Supabase pour le cache local');
  console.log('5. Redéployer après toute modification des variables');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnosticDetaille().catch(console.error);
}

export { diagnosticDetaille };
