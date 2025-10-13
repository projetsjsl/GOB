#!/usr/bin/env node

/**
 * Test local avec Service Role Key
 * Remplacez les valeurs par vos vraies clés
 */

import { createClient } from '@supabase/supabase-js';

// 🔑 REMPLACEZ CES VALEURS PAR VOS VRAIES CLÉS
const SUPABASE_URL = 'VOTRE_SUPABASE_URL_ICI';
const SUPABASE_SERVICE_ROLE_KEY = 'VOTRE_SERVICE_ROLE_KEY_ICI';

async function testServiceRoleKey() {
  console.log('🔑 Test avec Service Role Key (contourne RLS)\n');
  
  if (SUPABASE_URL === 'VOTRE_SUPABASE_URL_ICI' || SUPABASE_SERVICE_ROLE_KEY === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
    console.log('❌ Veuillez remplacer les valeurs par vos vraies clés Supabase');
    console.log('\n📋 Instructions:');
    console.log('1. Allez dans Supabase > Settings > API');
    console.log('2. Copiez votre Project URL');
    console.log('3. Copiez votre service_role key (pas l\'anon key)');
    console.log('4. Remplacez les valeurs dans ce script');
    console.log('5. Exécutez: node test-service-role-local.js');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test 1: Vérifier la structure de la table watchlists');
    const { data: structure, error: structureError } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Erreur structure:', structureError);
    } else {
      console.log('✅ Structure OK, exemple de données:', structure);
    }
    
    console.log('\n🔍 Test 2: Lister toutes les watchlists');
    const { data: allWatchlists, error: allError } = await supabase
      .from('watchlists')
      .select('*');
    
    if (allError) {
      console.log('❌ Erreur liste:', allError);
    } else {
      console.log('✅ Toutes les watchlists:', allWatchlists);
      console.log(`📊 Nombre total: ${allWatchlists.length}`);
    }
    
    console.log('\n🔍 Test 3: Chercher watchlist "default"');
    const { data: defaultWatchlist, error: defaultError } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (defaultError) {
      console.log('❌ Erreur default:', defaultError);
      if (defaultError.code === 'PGRST116') {
        console.log('💡 Aucune watchlist avec user_id="default" trouvée');
        console.log('💡 Créons une watchlist de test...');
        
        // Créer une watchlist de test
        const testTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
        const { data: insertData, error: insertError } = await supabase
          .from('watchlists')
          .insert({
            user_id: 'default',
            tickers: testTickers
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erreur création:', insertError);
        } else {
          console.log('✅ Watchlist de test créée:', insertData);
        }
      }
    } else {
      console.log('✅ Watchlist default trouvée:', defaultWatchlist);
    }
    
    console.log('\n🔍 Test 4: Vérifier les politiques RLS');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'watchlists' });
      
      if (policiesError) {
        console.log('⚠️ Impossible de récupérer les politiques (normal)');
        console.log('💡 Vérifiez manuellement dans Supabase > Authentication > Policies');
      } else {
        console.log('📋 Politiques RLS:', policies);
      }
    } catch (e) {
      console.log('⚠️ Fonction get_table_policies non disponible');
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

async function main() {
  console.log('🔧 Test local avec Service Role Key\n');
  console.log('⚠️  Ce script nécessite vos vraies clés Supabase\n');
  
  await testServiceRoleKey();
  
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Si le test local fonctionne, ajoutez SUPABASE_SERVICE_ROLE_KEY dans Vercel');
  console.log('2. Redéployez l\'API');
  console.log('3. Testez l\'API déployée');
  console.log('4. Si ça marche, le problème était RLS !');
}

main().catch(console.error);
