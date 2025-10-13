#!/usr/bin/env node

/**
 * Test direct de Supabase avec les clés publiques
 * Pour identifier si le problème vient de RLS ou de la connexion
 */

import { createClient } from '@supabase/supabase-js';

// Clés publiques (non sensibles)
const SUPABASE_URL = 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXV4Z2RwbGJwa2tucGx4YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNDc0MDAsImV4cCI6MjA1NDkyMzQwMH0.example'; // Remplacez par votre anon key

async function testDirectConnection() {
  console.log('🔍 Test de connexion directe à Supabase\n');
  
  if (SUPABASE_URL === 'https://gob-watchlist.supabase.co' || SUPABASE_ANON_KEY.includes('example')) {
    console.log('❌ Veuillez remplacer les valeurs par vos vraies clés Supabase');
    console.log('\n📋 Instructions:');
    console.log('1. Allez dans Supabase > Settings > API');
    console.log('2. Copiez votre Project URL');
    console.log('3. Copiez votre anon key');
    console.log('4. Remplacez les valeurs dans ce script');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 Test 1: Vérifier la structure de la table watchlists');
    const { data: structure, error: structureError } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Erreur structure:', structureError);
      console.log(`   Code: ${structureError.code}`);
      console.log(`   Message: ${structureError.message}`);
      console.log(`   Details: ${structureError.details}`);
      console.log(`   Hint: ${structureError.hint}`);
    } else {
      console.log('✅ Structure OK, exemple de données:', structure);
    }
    
    console.log('\n🔍 Test 2: Lister toutes les watchlists');
    const { data: allWatchlists, error: allError } = await supabase
      .from('watchlists')
      .select('*');
    
    if (allError) {
      console.log('❌ Erreur liste:', allError);
      console.log(`   Code: ${allError.code}`);
      console.log(`   Message: ${allError.message}`);
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
      console.log(`   Code: ${defaultError.code}`);
      console.log(`   Message: ${defaultError.message}`);
      
      if (defaultError.code === 'PGRST116') {
        console.log('💡 Aucune watchlist avec user_id="default" trouvée');
        console.log('💡 Créons une watchlist de test...');
        
        // Essayer de créer une watchlist de test
        const testTickers = ['AAPL', 'GOOGL', 'MSFT'];
        const { data: insertData, error: insertError } = await supabase
          .from('watchlists')
          .insert({
            user_id: 'default',
            tickers: testTickers
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erreur création:', insertError);
          console.log(`   Code: ${insertError.code}`);
          console.log(`   Message: ${insertError.message}`);
          console.log(`   Details: ${insertError.details}`);
          
          if (insertError.code === '42501') {
            console.log('💡 DIAGNOSTIC: Erreur de permissions - RLS bloque l\'insertion');
            console.log('💡 SOLUTION: Utilisez la service role key ou ajustez les politiques RLS');
          }
        } else {
          console.log('✅ Watchlist de test créée:', insertData);
        }
      }
    } else {
      console.log('✅ Watchlist default trouvée:', defaultWatchlist);
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
    console.log(`   Type: ${error.constructor.name}`);
    console.log(`   Message: ${error.message}`);
  }
}

async function testWithServiceRole() {
  console.log('\n🔑 Test avec Service Role Key (si disponible)\n');
  
  const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dm4dL2YBfo9DWxkkhmLfhQ_Ijo3GCRc';
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Service Role Key non fournie');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test avec Service Role Key:');
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (error) {
      console.log('❌ Erreur avec Service Role Key:', error);
    } else {
      console.log('✅ Succès avec Service Role Key:', data);
    }
    
  } catch (err) {
    console.log('❌ Erreur générale avec Service Role Key:', err);
  }
}

async function main() {
  console.log('🔧 Test direct de Supabase\n');
  
  await testDirectConnection();
  await testWithServiceRole();
  
  console.log('\n📋 DIAGNOSTIC:');
  console.log('==============');
  console.log('1. Si l\'anon key échoue avec PGRST116: Table vide');
  console.log('2. Si l\'anon key échoue avec 42501: Problème RLS');
  console.log('3. Si la service role key fonctionne: Confirme le problème RLS');
  console.log('4. Si les deux échouent: Problème de structure ou connexion');
}

main().catch(console.error);
