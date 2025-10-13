#!/usr/bin/env node

/**
 * Test avec Service Role Key pour contourner RLS
 * Ce script nécessite la SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// Vous devez remplacer ces valeurs par vos vraies clés
const SUPABASE_URL = 'VOTRE_SUPABASE_URL_ICI';
const SUPABASE_SERVICE_ROLE_KEY = 'VOTRE_SERVICE_ROLE_KEY_ICI';

async function testWithServiceRole() {
  console.log('🔑 Test avec Service Role Key (contourne RLS)\n');
  
  if (SUPABASE_URL === 'VOTRE_SUPABASE_URL_ICI' || SUPABASE_SERVICE_ROLE_KEY === 'VOTRE_SERVICE_ROLE_KEY_ICI') {
    console.log('❌ Veuillez remplacer les valeurs par vos vraies clés Supabase');
    console.log('\n📋 Instructions:');
    console.log('1. Allez dans Supabase > Settings > API');
    console.log('2. Copiez votre Project URL');
    console.log('3. Copiez votre service_role key (pas l\'anon key)');
    console.log('4. Remplacez les valeurs dans ce script');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test 1: Vérifier la structure de la table');
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
      }
    } else {
      console.log('✅ Watchlist default trouvée:', defaultWatchlist);
    }
    
    console.log('\n🔍 Test 4: Créer une watchlist de test');
    const testTickers = ['AAPL', 'GOOGL', 'MSFT'];
    const { data: insertData, error: insertError } = await supabase
      .from('watchlists')
      .upsert({
        user_id: 'test-service-role',
        tickers: testTickers,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError);
    } else {
      console.log('✅ Watchlist de test créée:', insertData);
    }
    
    console.log('\n🔍 Test 5: Vérifier les politiques RLS');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'watchlists' });
    
    if (policiesError) {
      console.log('⚠️ Impossible de récupérer les politiques (normal)');
    } else {
      console.log('📋 Politiques RLS:', policies);
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

async function testAnonKeyComparison() {
  console.log('\n🔍 Comparaison Anon Key vs Service Role Key\n');
  
  const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY_ICI';
  
  if (SUPABASE_ANON_KEY === 'VOTRE_ANON_KEY_ICI') {
    console.log('❌ Veuillez aussi ajouter votre anon key pour la comparaison');
    return;
  }
  
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('🔍 Test avec Anon Key:');
  const { data: anonData, error: anonError } = await anonClient
    .from('watchlists')
    .select('*')
    .eq('user_id', 'default')
    .single();
  
  console.log('   Anon Key - Data:', anonData);
  console.log('   Anon Key - Error:', anonError);
  
  console.log('\n🔍 Test avec Service Role Key:');
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('watchlists')
    .select('*')
    .eq('user_id', 'default')
    .single();
  
  console.log('   Service Role - Data:', serviceData);
  console.log('   Service Role - Error:', serviceError);
  
  if (anonError && !serviceError) {
    console.log('\n💡 DIAGNOSTIC: Le problème vient des politiques RLS !');
    console.log('   L\'anon key est bloquée par RLS, mais le service role fonctionne');
  } else if (anonError && serviceError) {
    console.log('\n💡 DIAGNOSTIC: Le problème est plus profond (structure, permissions DB)');
  } else {
    console.log('\n💡 DIAGNOSTIC: Les deux clés fonctionnent, problème ailleurs');
  }
}

async function main() {
  console.log('🔧 Diagnostic Supabase avec Service Role Key\n');
  console.log('⚠️  Ce script nécessite vos vraies clés Supabase\n');
  
  await testWithServiceRole();
  await testAnonKeyComparison();
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('==========');
  console.log('1. Remplacez les clés dans ce script par vos vraies clés');
  console.log('2. Exécutez: node test-supabase-service-role.js');
  console.log('3. Analysez les résultats pour identifier le problème');
  console.log('4. Si RLS est le problème, ajustez les politiques dans Supabase');
}

main().catch(console.error);
