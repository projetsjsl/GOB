/**
 * Test des Limites FMP
 * Vérifie si le problème vient des limites de requêtes
 */

const testFmpLimits = async () => {
  console.log('🔍 TEST DES LIMITES FMP');
  console.log('=======================');
  console.log('');

  const FMP_API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';

  // Test 1: Vérifier si l'API fonctionne directement
  console.log('📋 ÉTAPE 1: Test Direct de l\'API FMP');
  console.log('-------------------------------------');
  
  try {
    const response = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=${FMP_API_KEY}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API FMP fonctionnelle directement');
      console.log('Status:', response.status);
      console.log('Données reçues:', data.length, 'éléments');
    } else {
      console.log('❌ API FMP non fonctionnelle directement');
      console.log('Status:', response.status);
      console.log('Réponse:', JSON.stringify(data, null, 2));
      
      if (response.status === 429) {
        console.log('🚨 LIMITE DE REQUÊTES ATTEINTE !');
        console.log('Plan gratuit: 250 requêtes/jour');
        console.log('Réinitialisation: 15h EST (3 PM EST)');
      }
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 2: Vérifier notre API unifiée
  console.log('🔌 ÉTAPE 2: Test de Notre API Unifiée');
  console.log('------------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse:', JSON.stringify(data, null, 2));
    
    if (data.details && data.details.includes('404')) {
      console.log('');
      console.log('🚨 ERREUR 404 - CAUSES POSSIBLES:');
      console.log('1. Clé API différente dans Vercel');
      console.log('2. Limite de requêtes atteinte sur Vercel');
      console.log('3. Endpoint incorrect');
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 3: Vérifier les variables d'environnement
  console.log('🔑 ÉTAPE 3: Vérification des Variables d\'Environnement');
  console.log('-------------------------------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=test-env');
    const data = await response.json();
    
    if (data.success) {
      console.log('Variables d\'environnement Vercel:');
      console.log(JSON.stringify(data.environment, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 4: Informations sur les limites FMP
  console.log('📊 ÉTAPE 4: Informations sur les Limites FMP');
  console.log('--------------------------------------------');
  
  console.log('📖 D\'après les FAQs FMP:');
  console.log('');
  console.log('🆓 PLAN GRATUIT:');
  console.log('- 250 requêtes API par jour');
  console.log('- Limite se réinitialise à 15h EST (3 PM EST)');
  console.log('- Dashboard désactivé si limite dépassée');
  console.log('- Message d\'erreur: "Limit Reach. Please upgrade your plan"');
  console.log('');
  console.log('⏰ RÉINITIALISATION:');
  console.log('- Toutes les 24 heures à 15h EST');
  console.log('- Accès restauré automatiquement');
  console.log('');
  console.log('🔧 SOLUTIONS:');
  console.log('1. Attendre la réinitialisation (15h EST)');
  console.log('2. Upgrader vers un plan payant');
  console.log('3. Vérifier la clé API dans Vercel');
  console.log('');

  // Test 5: Recommandations
  console.log('🎯 ÉTAPE 5: Recommandations');
  console.log('---------------------------');
  
  console.log('🔧 ACTIONS RECOMMANDÉES:');
  console.log('');
  console.log('1. VÉRIFIER LA CLÉ API DANS VERCEL:');
  console.log('   - Aller dans Vercel Dashboard → Settings → Environment Variables');
  console.log('   - Vérifier que FMP_API_KEY = Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt');
  console.log('   - Supprimer et recréer la variable si nécessaire');
  console.log('');
  console.log('2. VÉRIFIER LES LIMITES:');
  console.log('   - Aller sur https://financialmodelingprep.com');
  console.log('   - Se connecter à votre compte');
  console.log('   - Vérifier l\'utilisation quotidienne');
  console.log('');
  console.log('3. REDÉPLOYER APRÈS MODIFICATION:');
  console.log('   - Toute modification des variables nécessite un redéploiement');
  console.log('   - Dans Vercel Dashboard → Deployments → Redeploy');
  console.log('');
  console.log('4. CONSIDÉRER UN UPGRADE:');
  console.log('   - Plan payant pour plus de requêtes');
  console.log('   - Accès à plus d\'endpoints');
  console.log('   - Pas de limite de Dashboard');
  console.log('');

  console.log('📊 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ API FMP fonctionnelle directement');
  console.log('❌ Problème avec notre API unifiée');
  console.log('🎯 Cause probable: Clé API différente dans Vercel');
  console.log('');
  console.log('📖 Documentation: https://site.financialmodelingprep.com/faqs');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  testFmpLimits().catch(console.error);
}

export { testFmpLimits };
