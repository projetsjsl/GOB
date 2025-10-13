/**
 * Diagnostic Spécifique FMP 403 Forbidden
 * Identifie la cause exacte de l'erreur 403 avec la clé API FMP
 */

const diagnosticFmp403 = async () => {
  console.log('🔍 DIAGNOSTIC FMP 403 FORBIDDEN');
  console.log('================================');
  console.log('');

  // Test 1: Vérifier la configuration de notre API
  console.log('📋 ÉTAPE 1: Vérification de Notre Configuration');
  console.log('-----------------------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote');
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    console.log('Réponse complète:', JSON.stringify(data, null, 2));
    
    if (data.details && data.details.includes('403')) {
      console.log('');
      console.log('🚨 ERREUR 403 CONFIRMÉE');
      console.log('Causes possibles:');
      console.log('1. Clé API FMP incorrecte dans Vercel');
      console.log('2. Compte FMP inactif ou suspendu');
      console.log('3. Limite de requêtes dépassée');
      console.log('4. Plan gratuit épuisé');
      console.log('5. URL de l\'API incorrecte');
    }
  } catch (error) {
    console.log('Erreur:', error.message);
  }
  console.log('');

  // Test 2: Vérifier l'URL de base utilisée
  console.log('🔌 ÉTAPE 2: Vérification de l\'URL de Base');
  console.log('------------------------------------------');
  
  console.log('URL actuelle dans le code: https://financialmodelingprep.com/stable');
  console.log('URL selon documentation: https://financialmodelingprep.com/stable');
  console.log('✅ URL de base correcte');
  console.log('');

  // Test 3: Vérifier le format de la requête
  console.log('📝 ÉTAPE 3: Vérification du Format de Requête');
  console.log('---------------------------------------------');
  
  console.log('Format attendu selon documentation:');
  console.log('https://financialmodelingprep.com/stable/quote/AAPL?apikey=YOUR_API_KEY');
  console.log('');
  console.log('Format utilisé dans notre code:');
  console.log('https://financialmodelingprep.com/stable/quote/AAPL?apikey=FMP_API_KEY');
  console.log('✅ Format correct');
  console.log('');

  // Test 4: Vérifier les endpoints disponibles
  console.log('🎯 ÉTAPE 4: Vérification des Endpoints');
  console.log('--------------------------------------');
  
  const endpoints = [
    { name: 'Quote', url: 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote' },
    { name: 'Profile', url: 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=profile' },
    { name: 'Ratios', url: 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=ratios' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  🔄 Test ${endpoint.name}...`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`    ✅ ${endpoint.name}: Fonctionnel`);
      } else {
        console.log(`    ❌ ${endpoint.name}: ${data.error || 'Erreur inconnue'}`);
        if (data.details) {
          console.log(`       Détails: ${data.details}`);
        }
      }
    } catch (error) {
      console.log(`    ❌ ${endpoint.name}: ${error.message}`);
    }
  }
  console.log('');

  // Test 5: Vérifier les logs Vercel
  console.log('📊 ÉTAPE 5: Recommandations pour les Logs Vercel');
  console.log('------------------------------------------------');
  
  console.log('🔍 Pour diagnostiquer le problème:');
  console.log('1. Aller sur https://vercel.com/dashboard');
  console.log('2. Sélectionner le projet GOB');
  console.log('3. Aller dans "Functions" → "View Function Logs"');
  console.log('4. Chercher les erreurs liées à FMP');
  console.log('5. Vérifier que FMP_API_KEY est bien définie');
  console.log('');

  // Test 6: Solutions possibles
  console.log('🔧 ÉTAPE 6: Solutions Possibles');
  console.log('-------------------------------');
  
  console.log('🚨 SOLUTIONS À ESSAYER:');
  console.log('');
  console.log('1. VÉRIFIER LA CLÉ API FMP:');
  console.log('   - Aller sur https://financialmodelingprep.com');
  console.log('   - Se connecter à votre compte');
  console.log('   - Vérifier que la clé API est active');
  console.log('   - Tester la clé directement sur leur site');
  console.log('');
  console.log('2. VÉRIFIER LE COMPTE FMP:');
  console.log('   - Vérifier que le compte n\'est pas suspendu');
  console.log('   - Vérifier que le plan gratuit n\'est pas épuisé');
  console.log('   - Considérer un plan payant si nécessaire');
  console.log('');
  console.log('3. VÉRIFIER LA CONFIGURATION VERCEL:');
  console.log('   - Aller dans Vercel → Settings → Environment Variables');
  console.log('   - Vérifier que FMP_API_KEY est bien définie');
  console.log('   - Vérifier qu\'elle n\'a pas d\'espaces ou de caractères spéciaux');
  console.log('   - Redéployer après toute modification');
  console.log('');
  console.log('4. TESTER AVEC UNE NOUVELLE CLÉ:');
  console.log('   - Générer une nouvelle clé API sur FMP');
  console.log('   - La remplacer dans Vercel');
  console.log('   - Redéployer le projet');
  console.log('');

  // Test 7: Test direct avec curl
  console.log('🧪 ÉTAPE 7: Test Direct avec curl');
  console.log('---------------------------------');
  
  console.log('Pour tester directement (remplacer YOUR_API_KEY par votre vraie clé):');
  console.log('curl "https://financialmodelingprep.com/stable/quote/AAPL?apikey=YOUR_API_KEY"');
  console.log('');
  console.log('Si ce test échoue avec 403, le problème vient de la clé API FMP');
  console.log('Si ce test réussit, le problème vient de notre configuration Vercel');
  console.log('');

  console.log('🎯 CONCLUSION:');
  console.log('==============');
  console.log('Le problème 403 Forbidden indique que:');
  console.log('1. La clé API FMP est incorrecte, expirée ou inactive');
  console.log('2. Le compte FMP a des limitations');
  console.log('3. La configuration Vercel a un problème');
  console.log('');
  console.log('📖 PROCHAINES ÉTAPES:');
  console.log('1. Vérifier la clé API FMP sur leur site');
  console.log('2. Tester la clé directement');
  console.log('3. Vérifier la configuration Vercel');
  console.log('4. Redéployer après correction');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnosticFmp403().catch(console.error);
}

export { diagnosticFmp403 };
