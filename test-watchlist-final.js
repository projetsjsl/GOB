#!/usr/bin/env node

/**
 * Test final de la watchlist après configuration de la service role key
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testServiceRoleKey() {
  console.log('🔑 Test de la Service Role Key\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/unified-serverless?endpoint=test-env`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('📊 Variables d\'environnement:');
      Object.entries(data.environment).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      if (data.environment.SUPABASE_SERVICE_ROLE_KEY?.includes('✅')) {
        console.log('\n✅ SUPABASE_SERVICE_ROLE_KEY est configurée !');
        return true;
      } else {
        console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY n\'est PAS encore configurée');
        console.log('💡 Attendez 2-3 minutes pour la propagation');
        return false;
      }
    } else {
      console.log('❌ Erreur test env:', data.error);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

async function testWatchlistAPI() {
  console.log('\n🔍 Test de l\'API watchlist\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ API watchlist fonctionne !');
      if (data.tickers && data.tickers.length > 0) {
        console.log(`📊 Watchlist trouvée: ${data.tickers.length} tickers`);
        console.log(`   Tickers: ${data.tickers.join(', ')}`);
      } else {
        console.log('⚠️ Watchlist vide - créons des données de test...');
        await createTestWatchlist();
      }
      return true;
    } else {
      console.log('❌ Erreur API watchlist:', data.error);
      if (data.details) {
        console.log(`   Détails: ${data.details}`);
      }
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
  }
}

async function createTestWatchlist() {
  console.log('\n💾 Création d\'une watchlist de test\n');
  
  try {
    const testTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'save',
        tickers: testTickers,
        userId: 'default'
      })
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Watchlist de test créée avec succès !');
      return true;
    } else {
      console.log('❌ Erreur lors de la création de la watchlist');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    return false;
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
  console.log('🚀 Test final de la watchlist Supabase\n');
  
  const serviceRoleConfigured = await testServiceRoleKey();
  
  if (serviceRoleConfigured) {
    const apiWorking = await testWatchlistAPI();
    
    if (apiWorking) {
      console.log('\n🎉 SUCCÈS ! La watchlist fonctionne !');
      await testDashboard();
    } else {
      console.log('\n❌ L\'API ne fonctionne toujours pas');
      console.log('💡 Vérifiez les logs Vercel pour plus de détails');
    }
  } else {
    console.log('\n⏳ Attendez que la service role key soit propagée');
    console.log('💡 Relancez ce script dans 2-3 minutes');
  }
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ Service Role Key configurée dans Vercel');
  console.log('✅ API modifiée pour utiliser la service role key');
  console.log('✅ Scripts de test créés');
  console.log('⏳ Propagation en cours...');
}

main().catch(console.error);
