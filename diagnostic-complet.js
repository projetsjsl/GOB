/**
 * Diagnostic Complet du Système GOB
 * Vérifie tous les aspects du système déployé
 */

const diagnosticComplet = async () => {
  console.log('🔍 DIAGNOSTIC COMPLET DU SYSTÈME GOB');
  console.log('=====================================');
  console.log('');

  const results = {
    site: { status: 'unknown', details: '' },
    apis: { status: 'unknown', details: [] },
    supabase: { status: 'unknown', details: '' },
    data: { status: 'unknown', details: [] }
  };

  // 1. Test du site principal
  console.log('🌐 ÉTAPE 1: Test du Site Principal');
  console.log('----------------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/beta-combined-dashboard.html');
    if (response.ok) {
      console.log('✅ Site accessible');
      results.site = { status: 'ok', details: 'Site accessible' };
    } else {
      console.log(`❌ Site inaccessible: ${response.status}`);
      results.site = { status: 'error', details: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Erreur site: ${error.message}`);
    results.site = { status: 'error', details: error.message };
  }
  console.log('');

  // 2. Test des APIs
  console.log('🔌 ÉTAPE 2: Test des APIs');
  console.log('-------------------------');
  
  const apiTests = [
    { name: 'FMP Quote', url: 'https://gobapps.com/api/unified-serverless?endpoint=fmp&symbol=AAPL&action=quote' },
    { name: 'Market Data Yahoo', url: 'https://gobapps.com/api/unified-serverless?endpoint=marketdata&symbol=AAPL&source=yahoo' },
    { name: 'Marketaux News', url: 'https://gobapps.com/api/unified-serverless?endpoint=marketaux&symbol=AAPL&limit=5' },
    { name: 'Hybrid Data', url: 'https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=AAPL&dataType=quote&syncIfNeeded=true' }
  ];

  for (const test of apiTests) {
    try {
      console.log(`  🔄 Test ${test.name}...`);
      const response = await fetch(test.url);
      const data = await response.json();
      
      if (response.ok && !data.error) {
        console.log(`    ✅ ${test.name}: OK`);
        results.apis.details.push(`${test.name}: OK`);
      } else {
        console.log(`    ❌ ${test.name}: ${data.error || 'Erreur inconnue'}`);
        results.apis.details.push(`${test.name}: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`);
      results.apis.details.push(`${test.name}: ${error.message}`);
    }
  }

  // Déterminer le statut global des APIs
  const successCount = results.apis.details.filter(d => d.includes(': OK')).length;
  if (successCount === apiTests.length) {
    results.apis.status = 'ok';
  } else if (successCount > 0) {
    results.apis.status = 'partial';
  } else {
    results.apis.status = 'error';
  }
  console.log('');

  // 3. Test Supabase
  console.log('🗄️ ÉTAPE 3: Test Supabase');
  console.log('-------------------------');
  
  try {
    const response = await fetch('https://gobapps.com/api/unified-serverless?endpoint=supabase-watchlist&userId=test&action=read');
    const data = await response.json();
    
    if (response.ok && !data.error) {
      console.log('✅ Supabase: Connecté');
      results.supabase = { status: 'ok', details: 'Supabase connecté' };
    } else {
      console.log(`❌ Supabase: ${data.error || 'Erreur inconnue'}`);
      results.supabase = { status: 'error', details: data.error || 'Erreur inconnue' };
    }
  } catch (error) {
    console.log(`❌ Supabase: ${error.message}`);
    results.supabase = { status: 'error', details: error.message };
  }
  console.log('');

  // 4. Test des données dans le dashboard
  console.log('📊 ÉTAPE 4: Test des Données Dashboard');
  console.log('-------------------------------------');
  
  const dataTests = [
    { name: 'AAPL Quote', symbol: 'AAPL', type: 'quote' },
    { name: 'MSFT Profile', symbol: 'MSFT', type: 'profile' },
    { name: 'GOOGL News', symbol: 'GOOGL', type: 'news' }
  ];

  for (const test of dataTests) {
    try {
      console.log(`  🔄 Test ${test.name}...`);
      const response = await fetch(`https://gobapps.com/api/unified-serverless?endpoint=hybrid-data&symbol=${test.symbol}&dataType=${test.type}&syncIfNeeded=true`);
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        console.log(`    ✅ ${test.name}: Données disponibles`);
        results.data.details.push(`${test.name}: Données disponibles`);
      } else {
        console.log(`    ❌ ${test.name}: ${data.error || 'Pas de données'}`);
        results.data.details.push(`${test.name}: ${data.error || 'Pas de données'}`);
      }
    } catch (error) {
      console.log(`    ❌ ${test.name}: ${error.message}`);
      results.data.details.push(`${test.name}: ${error.message}`);
    }
  }

  // Déterminer le statut global des données
  const dataSuccessCount = results.data.details.filter(d => d.includes(': Données disponibles')).length;
  if (dataSuccessCount === dataTests.length) {
    results.data.status = 'ok';
  } else if (dataSuccessCount > 0) {
    results.data.status = 'partial';
  } else {
    results.data.status = 'error';
  }
  console.log('');

  // 5. Résumé et recommandations
  console.log('📋 RÉSUMÉ DU DIAGNOSTIC');
  console.log('=======================');
  console.log(`🌐 Site: ${results.site.status === 'ok' ? '✅' : '❌'} ${results.site.details}`);
  console.log(`🔌 APIs: ${results.apis.status === 'ok' ? '✅' : results.apis.status === 'partial' ? '⚠️' : '❌'} ${results.apis.details.length} tests`);
  console.log(`🗄️ Supabase: ${results.supabase.status === 'ok' ? '✅' : '❌'} ${results.supabase.details}`);
  console.log(`📊 Données: ${results.data.status === 'ok' ? '✅' : results.data.status === 'partial' ? '⚠️' : '❌'} ${results.data.details.length} tests`);
  console.log('');

  // Recommandations
  console.log('🎯 RECOMMANDATIONS');
  console.log('==================');
  
  if (results.apis.status === 'error') {
    console.log('🚨 PRIORITÉ 1: Problème avec les APIs');
    console.log('   - Vérifier les clés API FMP dans Vercel Environment Variables');
    console.log('   - Vérifier les clés API Marketaux');
    console.log('   - Redéployer après modification des variables');
  }
  
  if (results.supabase.status === 'error') {
    console.log('🚨 PRIORITÉ 2: Supabase non configuré');
    console.log('   - Suivre le guide: CONFIGURATION-SUPABASE-IMMEDIATE.md');
    console.log('   - Créer le projet gob-watchlist');
    console.log('   - Configurer les variables SUPABASE_URL et SUPABASE_ANON_KEY');
  }
  
  if (results.data.status === 'error') {
    console.log('🚨 PRIORITÉ 3: Pas de données disponibles');
    console.log('   - Résoudre les problèmes d\'APIs en priorité');
    console.log('   - Configurer Supabase pour le cache local');
    console.log('   - Lancer populate-all-tickers-data.js après configuration');
  }

  console.log('');
  console.log('📖 GUIDES DISPONIBLES:');
  console.log('- CONFIGURATION-SUPABASE-IMMEDIATE.md');
  console.log('- CONFIGURATION_CLES_API.md');
  console.log('- docs/technical/SUPABASE-SETUP-GUIDE.md');
  
  return results;
};

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  diagnosticComplet().catch(console.error);
}

export { diagnosticComplet };
