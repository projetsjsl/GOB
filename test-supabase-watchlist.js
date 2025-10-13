#!/usr/bin/env node

/**
 * Test de la watchlist Supabase
 * Diagnostic pour identifier pourquoi la watchlist est vide
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testSupabaseWatchlist() {
  console.log('🔍 Test de la watchlist Supabase\n');
  
  try {
    console.log(`🔍 Test GET watchlist: ${BASE_URL}/api/supabase-watchlist`);
    
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      if (data.tickers && data.tickers.length > 0) {
        console.log(`✅ Watchlist trouvée: ${data.tickers.length} tickers`);
        console.log(`   Tickers: ${data.tickers.join(', ')}`);
      } else {
        console.log('⚠️ Watchlist vide ou tickers manquants');
        console.log(`   Structure: ${JSON.stringify(data, null, 2)}`);
      }
    } else {
      console.log(`❌ Erreur: ${data.error || 'Erreur inconnue'}`);
      if (data.message) {
        console.log(`   Message: ${data.message}`);
      }
      if (data.helpUrl) {
        console.log(`   Aide: ${data.helpUrl}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function testSupabaseConfig() {
  console.log('\n🔧 Test de la configuration Supabase\n');
  
  try {
    console.log(`🔍 Test variables env: ${BASE_URL}/api/unified-serverless?endpoint=test-env`);
    
    const response = await fetch(`${BASE_URL}/api/unified-serverless?endpoint=test-env`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('📊 Variables d\'environnement:');
      console.log(`   SUPABASE_URL: ${data.environment?.SUPABASE_URL || 'Non trouvé'}`);
      console.log(`   SUPABASE_ANON_KEY: ${data.environment?.SUPABASE_ANON_KEY || 'Non trouvé'}`);
      
      if (data.environment?.SUPABASE_URL?.includes('✅')) {
        console.log('✅ SUPABASE_URL configurée');
      } else {
        console.log('❌ SUPABASE_URL manquante');
      }
      
      if (data.environment?.SUPABASE_ANON_KEY?.includes('✅')) {
        console.log('✅ SUPABASE_ANON_KEY configurée');
      } else {
        console.log('❌ SUPABASE_ANON_KEY manquante');
      }
    } else {
      console.log(`❌ Erreur test env: ${data.error || 'Erreur inconnue'}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function testWatchlistSave() {
  console.log('\n💾 Test de sauvegarde watchlist\n');
  
  try {
    const testTickers = ['AAPL', 'GOOGL', 'MSFT'];
    
    console.log(`🔍 Test POST watchlist avec tickers: ${testTickers.join(', ')}`);
    
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save',
        tickers: testTickers,
        userId: 'test-user'
      })
    });
    
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Sauvegarde réussie');
      
      // Tester immédiatement la récupération
      console.log('\n🔄 Test de récupération immédiate...');
      const getResponse = await fetch(`${BASE_URL}/api/supabase-watchlist`);
      const getData = await getResponse.json();
      
      if (getResponse.ok && getData.tickers) {
        console.log(`✅ Récupération réussie: ${getData.tickers.length} tickers`);
        console.log(`   Tickers récupérés: ${getData.tickers.join(', ')}`);
      } else {
        console.log('❌ Récupération échouée');
      }
    } else {
      console.log(`❌ Erreur sauvegarde: ${data.error || 'Erreur inconnue'}`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function runAllTests() {
  await testSupabaseConfig();
  await testSupabaseWatchlist();
  await testWatchlistSave();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log('==========');
  console.log('1. Vérifiez que SUPABASE_URL et SUPABASE_ANON_KEY sont configurées');
  console.log('2. Vérifiez que la table watchlists existe dans Supabase');
  console.log('3. Vérifiez que la table a des données');
  console.log('4. Si tout est OK, le problème peut être dans le code du dashboard');
}

// Exécuter les tests
runAllTests().catch(console.error);
