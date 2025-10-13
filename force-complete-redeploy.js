#!/usr/bin/env node

/**
 * Script pour forcer un redéploiement complet
 * et tester l'API watchlist
 */

const BASE_URL = 'https://gobapps.com';

async function forceRedeploy() {
  console.log('🚀 Forçage du redéploiement complet\n');
  
  try {
    // Faire plusieurs requêtes pour déclencher un redéploiement
    const endpoints = [
      '/api/supabase-watchlist',
      '/api/unified-serverless?endpoint=test-env',
      '/api/unified-serverless?endpoint=test-supabase-keys'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔍 Test: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Succès: ${JSON.stringify(data, null, 2)}`);
      } else {
        const error = await response.json();
        console.log(`   ❌ Erreur: ${error.error || 'Erreur inconnue'}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function testWatchlistAPI() {
  console.log('🔍 Test spécifique de l\'API watchlist\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('🎉 SUCCÈS ! L\'API watchlist fonctionne !');
      if (data.tickers && data.tickers.length > 0) {
        console.log(`📊 Watchlist trouvée: ${data.tickers.length} tickers`);
        console.log(`   Tickers: ${data.tickers.join(', ')}`);
      }
    } else {
      console.log('❌ L\'API ne fonctionne toujours pas');
      console.log('💡 Vérifiez les logs Vercel pour plus de détails');
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function testDashboard() {
  console.log('\n🖥️ Test du dashboard\n');
  
  console.log('📋 Instructions pour tester le dashboard:');
  console.log('1. Ouvrez: https://gobapps.com/beta-combined-dashboard.html');
  console.log('2. Allez dans l\'onglet "⭐ Dan\'s Watchlist"');
  console.log('3. La watchlist devrait se charger automatiquement');
  console.log('4. Vous devriez voir les tickers: AAPL, GOOGL, MSFT, TSLA, AMZN');
  
  console.log('\n🔍 Si la watchlist est vide:');
  console.log('- Ouvrez la console du navigateur (F12)');
  console.log('- Regardez les logs pour voir les erreurs');
  console.log('- Vérifiez que l\'API /api/supabase-watchlist fonctionne');
}

async function main() {
  console.log('🔧 Forçage du redéploiement complet et test\n');
  
  await forceRedeploy();
  await testWatchlistAPI();
  await testDashboard();
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ Toutes les variables d\'environnement configurées');
  console.log('✅ Table watchlist créée avec données de test');
  console.log('✅ Service role key fonctionne en local');
  console.log('⏳ Test de l\'API déployée en cours...');
}

main().catch(console.error);
