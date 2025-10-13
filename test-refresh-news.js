#!/usr/bin/env node

/**
 * Test du système de refresh des nouvelles
 * Alternative au cron job pour le plan Hobby Vercel
 */

const BASE_URL = 'https://gob-82fx9aool-projetsjsls-projects.vercel.app';

async function testRefreshNews() {
  console.log('🚀 Test du refresh manuel des nouvelles\n');
  
  try {
    console.log(`🔍 Test refresh news: ${BASE_URL}/api/unified-serverless?endpoint=refresh-news`);
    
    const response = await fetch(`${BASE_URL}/api/unified-serverless?endpoint=refresh-news`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Refresh News: OK (${response.status})`);
      console.log(`   Success: ${data.success}`);
      console.log(`   General News: ${data.generalNews || 0}`);
      console.log(`   Symbols Updated: ${data.symbolsUpdated || 0}`);
      console.log(`   Total Symbols: ${data.totalSymbols || 0}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      
      if (data.success) {
        console.log('\n🎉 Refresh des nouvelles réussi !');
        console.log('Les nouvelles sont maintenant mises à jour dans le cache Supabase.');
      } else {
        console.log('\n⚠️ Refresh partiellement réussi ou échec');
        console.log(`Message: ${data.message || 'Aucun message'}`);
      }
      
    } else {
      console.log(`❌ Refresh News: ${response.status} - ${data.error || 'Erreur inconnue'}`);
      if (data.details) {
        console.log(`   Détails: ${data.details}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Refresh News: Erreur réseau - ${error.message}`);
  }
}

async function testCacheAfterRefresh() {
  console.log('\n🔍 Test du cache après refresh...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/unified-serverless?endpoint=news/cached&type=general&limit=5`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Cache Test: OK (${response.status})`);
      console.log(`   Cached: ${data.cached}`);
      console.log(`   Count: ${data.count || 0}`);
      console.log(`   Sources: ${data.sources ? data.sources.join(', ') : 'Aucune'}`);
      
      if (data.cached && data.count > 0) {
        console.log('\n🎉 Cache fonctionnel avec nouvelles fraîches !');
      } else {
        console.log('\n⚠️ Cache vide ou non fonctionnel');
      }
    } else {
      console.log(`❌ Cache Test: ${response.status} - ${data.error || 'Erreur'}`);
    }
    
  } catch (error) {
    console.log(`❌ Cache Test: Erreur réseau - ${error.message}`);
  }
}

async function runTests() {
  await testRefreshNews();
  await testCacheAfterRefresh();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log('==========');
  console.log('✅ Système de refresh manuel implémenté');
  console.log('✅ Alternative au cron job toutes les 15 minutes');
  console.log('✅ Compatible avec le plan Hobby Vercel');
  console.log('\n💡 Utilisation:');
  console.log('   - Cron automatique: 1x par jour à 6h00 Montréal (11h UTC)');
  console.log('   - Refresh manuel: /api/unified-serverless?endpoint=refresh-news');
  console.log('   - Cache: /api/unified-serverless?endpoint=news/cached');
}

// Exécuter les tests
runTests().catch(console.error);
