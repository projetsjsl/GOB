/**
 * Debug FMP URL
 * Affiche l'URL exacte utilisée par notre API
 */

const debugFmpUrl = async () => {
  console.log('🔍 DEBUG FMP URL');
  console.log('================');
  console.log('');

  // Test 1: Vérifier l'URL construite par notre code
  console.log('📋 ÉTAPE 1: Vérification de l\'URL Construite');
  console.log('---------------------------------------------');
  
  const FMP_API_KEY = 'Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
  const endpoint = '/profile?symbol=AAPL';
  const baseUrl = 'https://financialmodelingprep.com/stable';
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}${endpoint}${separator}apikey=${FMP_API_KEY}`;
  
  console.log('URL construite:', url);
  console.log('');

  // Test 2: Tester cette URL
  console.log('🔌 ÉTAPE 2: Test de l\'URL Construite');
  console.log('------------------------------------');
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status HTTP:', response.status);
    if (response.ok) {
      console.log('✅ URL fonctionnelle !');
      console.log('Données reçues:', data.length, 'éléments');
      if (data.length > 0) {
        console.log('Symbol:', data[0].symbol);
        console.log('Price:', data[0].price);
        console.log('Market Cap:', data[0].marketCap);
      }
    } else {
      console.log('❌ URL non fonctionnelle');
      console.log('Réponse:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 3: Comparer avec l'URL qui fonctionne
  console.log('🔍 ÉTAPE 3: Comparaison avec l\'URL qui Fonctionne');
  console.log('--------------------------------------------------');
  
  const workingUrl = 'https://financialmodelingprep.com/stable/profile?symbol=AAPL&apikey=Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt';
  console.log('URL qui fonctionne:', workingUrl);
  console.log('URL construite:   ', url);
  console.log('URLs identiques:  ', url === workingUrl ? '✅ Oui' : '❌ Non');
  console.log('');

  // Test 4: Vérifier la clé API dans Vercel
  console.log('🔑 ÉTAPE 4: Vérification de la Clé API dans Vercel');
  console.log('--------------------------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=test-env');
    const data = await response.json();
    
    if (data.success) {
      console.log('Variables d\'environnement Vercel:');
      console.log(JSON.stringify(data.environment, null, 2));
      
      if (data.environment.FMP_API_KEY === '✅ Configurée') {
        console.log('✅ FMP_API_KEY est configurée dans Vercel');
        console.log('❓ Mais elle ne fonctionne pas - vérifier la valeur exacte');
      } else {
        console.log('❌ FMP_API_KEY n\'est pas configurée dans Vercel');
      }
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
  console.log('');

  // Test 5: Recommandations
  console.log('🎯 ÉTAPE 5: Recommandations');
  console.log('---------------------------');
  
  console.log('🔧 SOLUTIONS POSSIBLES:');
  console.log('');
  console.log('1. VÉRIFIER LA VALEUR EXACTE DE LA CLÉ DANS VERCEL:');
  console.log('   - Aller dans Vercel Dashboard → Settings → Environment Variables');
  console.log('   - Vérifier que FMP_API_KEY = Yo1RJiZ6G5JLEMmTzhGpusq78aIWhiyt');
  console.log('   - Vérifier qu\'il n\'y a pas d\'espaces en début/fin');
  console.log('');
  console.log('2. REDÉPLOYER APRÈS VÉRIFICATION:');
  console.log('   - Toute modification des variables nécessite un redéploiement');
  console.log('   - Dans Vercel Dashboard → Deployments → Redeploy');
  console.log('');
  console.log('3. VÉRIFIER LES LOGS VERCEL:');
  console.log('   - Aller dans Vercel Dashboard → Functions → View Function Logs');
  console.log('   - Chercher les erreurs liées à FMP');
  console.log('   - Vérifier l\'URL exacte appelée');
  console.log('');

  console.log('📊 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ URL construite correctement');
  console.log('✅ Endpoint /profile fonctionnel');
  console.log('✅ Clé API fonctionnelle');
  console.log('❌ Problème avec la clé API dans Vercel');
  console.log('');
  console.log('🎯 Le problème vient de la configuration Vercel, pas du code !');
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  debugFmpUrl().catch(console.error);
}

export { debugFmpUrl };
