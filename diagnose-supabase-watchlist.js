#!/usr/bin/env node

/**
 * Diagnostic avancé de la watchlist Supabase
 * Teste différentes approches pour identifier le problème
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testDirectSupabaseConnection() {
  console.log('🔍 Test de connexion directe à Supabase\n');
  
  try {
    // Test avec une requête simple
    const response = await fetch(`${BASE_URL}/api/unified-serverless?endpoint=test-supabase-direct`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connexion Supabase directe réussie');
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    } else {
      const error = await response.json();
      console.log('❌ Erreur connexion directe:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(error, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Erreur réseau: ${error.message}`);
  }
}

async function testWatchlistWithDifferentUsers() {
  console.log('\n👥 Test avec différents user_id\n');
  
  const testUsers = ['default', 'test-user', 'anonymous', ''];
  
  for (const userId of testUsers) {
    try {
      console.log(`🔍 Test avec user_id: "${userId}"`);
      
      const response = await fetch(`${BASE_URL}/api/supabase-watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          tickers: ['AAPL', 'GOOGL'],
          userId: userId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Succès avec user_id: "${userId}"`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`❌ Échec avec user_id: "${userId}"`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Error: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.log(`❌ Erreur réseau avec user_id "${userId}": ${error.message}`);
    }
  }
}

async function testWatchlistStructure() {
  console.log('\n🏗️ Test de la structure de la table\n');
  
  try {
    // Test avec une requête GET simple
    const response = await fetch(`${BASE_URL}/api/supabase-watchlist`);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    
    if (data.details) {
      console.log(`📊 Détails de l'erreur: ${data.details}`);
      
      // Analyser le type d'erreur
      if (data.details.includes('PGRST116')) {
        console.log('💡 Suggestion: Aucune ligne trouvée - la table est vide');
      } else if (data.details.includes('relation "watchlists" does not exist')) {
        console.log('💡 Suggestion: La table n\'existe pas');
      } else if (data.details.includes('permission denied')) {
        console.log('💡 Suggestion: Problème de permissions RLS');
      } else if (data.details.includes('fetch failed')) {
        console.log('💡 Suggestion: Problème de connexion réseau ou import');
      }
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

async function testAlternativeEndpoints() {
  console.log('\n🔄 Test des endpoints alternatifs\n');
  
  const endpoints = [
    '/api/supabase-watchlist',
    '/api/unified-serverless?endpoint=watchlist',
    '/api/unified-serverless?endpoint=supabase-watchlist'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Test endpoint: ${endpoint}`);
      
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      if (response.ok) {
        console.log(`   ✅ Succès: ${JSON.stringify(data, null, 2)}`);
      } else {
        console.log(`   ❌ Erreur: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.log(`   ❌ Erreur réseau: ${error.message}`);
    }
  }
}

async function suggestSolutions() {
  console.log('\n💡 Solutions suggérées\n');
  
  console.log('1. 🔧 Vérifier les politiques RLS dans Supabase:');
  console.log('   - Allez dans Authentication > Policies');
  console.log('   - Vérifiez que la table watchlists a des politiques permissives');
  console.log('   - Ou désactivez temporairement RLS pour tester');
  
  console.log('\n2. 📊 Vérifier le contenu de la table:');
  console.log('   - Allez dans Table Editor > watchlists');
  console.log('   - Vérifiez qu\'il y a des données');
  console.log('   - Ajoutez une ligne avec user_id = "default" si nécessaire');
  
  console.log('\n3. 🔍 Vérifier les logs Supabase:');
  console.log('   - Allez dans Logs dans votre dashboard');
  console.log('   - Regardez les erreurs récentes');
  
  console.log('\n4. 🧪 Test manuel dans Supabase:');
  console.log('   - Exécutez: SELECT * FROM watchlists;');
  console.log('   - Vérifiez la structure: \\d watchlists');
  
  console.log('\n5. 🔄 Redéployer l\'API:');
  console.log('   - Le problème pourrait être dans le déploiement');
  console.log('   - Essayez de redéployer sur Vercel');
}

async function main() {
  console.log('🔍 Diagnostic avancé de la watchlist Supabase\n');
  
  await testDirectSupabaseConnection();
  await testWatchlistStructure();
  await testWatchlistWithDifferentUsers();
  await testAlternativeEndpoints();
  await suggestSolutions();
  
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Vérifiez les politiques RLS dans Supabase');
  console.log('2. Ajoutez des données de test dans la table');
  console.log('3. Testez manuellement dans l\'éditeur SQL de Supabase');
  console.log('4. Si nécessaire, redéployez l\'API');
}

main().catch(console.error);
