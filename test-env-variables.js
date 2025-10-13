/**
 * Test des Variables d'Environnement sur Vercel
 * Vérifie si les variables d'environnement sont accessibles
 */

const testEnvVariables = async () => {
  console.log('🔑 TEST DES VARIABLES D\'ENVIRONNEMENT VERCEL');
  console.log('==============================================');
  console.log('');

  // Test 1: Vérifier si notre API peut accéder aux variables d'environnement
  console.log('📋 ÉTAPE 1: Test d\'Accès aux Variables d\'Environnement');
  console.log('-------------------------------------------------------');
  
  try {
    // Créer un endpoint de test temporaire pour vérifier les variables d'environnement
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=test-env');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Variables d\'environnement accessibles');
      console.log('Réponse:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Impossible d\'accéder aux variables d\'environnement');
      console.log('Status:', response.status);
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 2: Vérifier la configuration FMP spécifiquement
  console.log('🔌 ÉTAPE 2: Test de Configuration FMP');
  console.log('-------------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse:', JSON.stringify(data, null, 2));
    
    if (data.details && data.details.includes('FMP_API_KEY not configured')) {
      console.log('');
      console.log('🚨 PROBLÈME IDENTIFIÉ: Variable FMP_API_KEY non configurée');
      console.log('🔧 SOLUTION:');
      console.log('1. Aller dans Vercel Dashboard → Settings → Environment Variables');
      console.log('2. Ajouter FMP_API_KEY avec votre clé API');
      console.log('3. Redéployer le projet');
    } else if (data.details && data.details.includes('403')) {
      console.log('');
      console.log('🚨 PROBLÈME IDENTIFIÉ: Clé API FMP invalide');
      console.log('🔧 SOLUTION:');
      console.log('1. Vérifier la clé API sur https://financialmodelingprep.com');
      console.log('2. Tester la clé directement');
      console.log('3. Mettre à jour la clé dans Vercel si nécessaire');
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 3: Vérifier d'autres APIs pour comparaison
  console.log('🔍 ÉTAPE 3: Test d\'Autres APIs pour Comparaison');
  console.log('-----------------------------------------------');
  
  const otherApis = [
    { name: 'Marketaux', endpoint: 'marketaux', params: 'symbol=AAPL&limit=1' },
    { name: 'Gemini', endpoint: 'gemini-chat', params: '' }
  ];

  for (const api of otherApis) {
    try {
      console.log(`  🔄 Test ${api.name}...`);
      const url = `https://gobapps.com/api/unified-serverless?endpoint=${api.endpoint}&${api.params}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`    ✅ ${api.name}: Fonctionnel`);
      } else {
        console.log(`    ❌ ${api.name}: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${api.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 4: Recommandations spécifiques
  console.log('🎯 ÉTAPE 4: Recommandations Spécifiques');
  console.log('---------------------------------------');
  
  console.log('🔧 POUR RÉSOUDRE LE PROBLÈME FMP:');
  console.log('');
  console.log('1. VÉRIFIER LA VARIABLE D\'ENVIRONNEMENT:');
  console.log('   - Aller sur https://vercel.com/dashboard');
  console.log('   - Sélectionner le projet GOB');
  console.log('   - Settings → Environment Variables');
  console.log('   - Vérifier que FMP_API_KEY est présente');
  console.log('   - Vérifier qu\'elle n\'a pas d\'espaces en début/fin');
  console.log('');
  console.log('2. VÉRIFIER LA CLÉ API FMP:');
  console.log('   - Aller sur https://financialmodelingprep.com');
  console.log('   - Se connecter à votre compte');
  console.log('   - Vérifier que la clé est active');
  console.log('   - Tester avec: https://financialmodelingprep.com/stable/quote/AAPL?apikey=VOTRE_CLE');
  console.log('');
  console.log('3. REDÉPLOYER APRÈS MODIFICATION:');
  console.log('   - Toute modification des variables d\'environnement nécessite un redéploiement');
  console.log('   - Dans Vercel Dashboard → Deployments → Redeploy');
  console.log('');

  console.log('📊 RÉSUMÉ:');
  console.log('==========');
  console.log('Le code utilise correctement process.env.FMP_API_KEY');
  console.log('Le problème vient soit de:');
  console.log('1. Variable d\'environnement non configurée dans Vercel');
  console.log('2. Clé API FMP invalide ou expirée');
  console.log('3. Compte FMP avec limitations');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnvVariables().catch(console.error);
}

export { testEnvVariables };
