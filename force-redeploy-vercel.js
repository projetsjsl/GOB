#!/usr/bin/env node

/**
 * Script pour forcer un redéploiement Vercel
 * et vérifier les logs de l'API watchlist
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function forceRedeploy() {
  console.log('🚀 Forçage du redéploiement Vercel\n');
  
  try {
    // Faire une requête pour déclencher un redéploiement
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API fonctionne:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log('❌ Erreur API:', JSON.stringify(error, null, 2));
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Vérification des variables d\'environnement\n');
  
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
      } else {
        console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY n\'est PAS configurée');
        console.log('💡 Vérifiez dans Vercel Dashboard > Settings > Environment Variables');
      }
    } else {
      console.log('❌ Erreur test env:', data.error);
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function testWatchlistWithDebug() {
  console.log('\n🔍 Test de l\'API watchlist avec debugging\n');
  
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
    
    if (data.errorType) {
      console.log(`🔍 Type d'erreur: ${data.errorType}`);
    }
    
    if (data.errorCode) {
      console.log(`🔍 Code d'erreur: ${data.errorCode}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function createTestWatchlist() {
  console.log('\n💾 Création d\'une watchlist de test\n');
  
  try {
    const testTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        action: 'save',
        tickers: testTickers,
        userId: 'default'
      })
    });
    
    console.log(`📊 Status: ${response.status}`);
    const data = await response.json();
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Watchlist de test créée avec succès !');
    } else {
      console.log('❌ Erreur lors de la création de la watchlist');
    }
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function main() {
  console.log('🔧 Diagnostic complet de la watchlist Supabase\n');
  
  await checkEnvironmentVariables();
  await forceRedeploy();
  await testWatchlistWithDebug();
  await createTestWatchlist();
  
  console.log('\n📋 ACTIONS REQUISES:');
  console.log('=====================');
  console.log('1. Vérifiez que SUPABASE_SERVICE_ROLE_KEY est configurée dans Vercel');
  console.log('2. Si pas configurée, ajoutez-la dans Vercel Dashboard');
  console.log('3. Attendez 2-3 minutes pour la propagation');
  console.log('4. Relancez ce script');
  console.log('5. Si ça ne marche toujours pas, vérifiez les logs Vercel');
}

main().catch(console.error);
