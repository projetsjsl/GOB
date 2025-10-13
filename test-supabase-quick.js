#!/usr/bin/env node

/**
 * Test rapide avec la vraie URL Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boyuxgdplbpkknplxbxp.supabase.co';

async function testWithAnonKey() {
  console.log('🔍 Test avec Anon Key\n');
  
  // Vous devez remplacer par votre vraie anon key
  const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY_ICI';
  
  if (SUPABASE_ANON_KEY === 'VOTRE_ANON_KEY_ICI') {
    console.log('❌ Veuillez remplacer SUPABASE_ANON_KEY par votre vraie clé');
    console.log('📋 Pour récupérer votre anon key:');
    console.log('1. Allez dans https://supabase.com/dashboard/project/boyuxgdplbpkknplxbxp');
    console.log('2. Settings > API');
    console.log('3. Copiez la "anon public" key');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    console.log('🔍 Test de connexion à la table watchlists...');
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur:', error);
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      
      if (error.code === 'PGRST116') {
        console.log('💡 Table vide - créons des données de test...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('watchlists')
          .insert({
            user_id: 'default',
            tickers: ['AAPL', 'GOOGL', 'MSFT']
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erreur insertion:', insertError);
          if (insertError.code === '42501') {
            console.log('💡 DIAGNOSTIC: Problème RLS - utilisez la service role key');
          }
        } else {
          console.log('✅ Données de test créées:', insertData);
        }
      }
    } else {
      console.log('✅ Connexion réussie:', data);
    }
    
  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

async function testWithServiceRoleKey() {
  console.log('\n🔑 Test avec Service Role Key\n');
  
  const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dm4dL2YBfo9DWxkkhmLfhQ_Ijo3GCRc';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test de connexion avec service role key...');
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (error) {
      console.log('❌ Erreur:', error);
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      
      if (error.code === 'PGRST116') {
        console.log('💡 Aucune watchlist "default" - créons-en une...');
        
        const { data: insertData, error: insertError } = await supabase
          .from('watchlists')
          .insert({
            user_id: 'default',
            tickers: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
          })
          .select();
        
        if (insertError) {
          console.log('❌ Erreur insertion:', insertError);
        } else {
          console.log('✅ Watchlist "default" créée:', insertData);
        }
      }
    } else {
      console.log('✅ Watchlist "default" trouvée:', data);
    }
    
  } catch (err) {
    console.log('❌ Erreur générale:', err);
  }
}

async function main() {
  console.log('🚀 Test rapide Supabase\n');
  console.log(`📊 URL: ${SUPABASE_URL}\n`);
  
  await testWithAnonKey();
  await testWithServiceRoleKey();
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('==========');
  console.log('1. Si l\'anon key échoue: Problème RLS');
  console.log('2. Si la service role key fonctionne: Confirme le problème RLS');
  console.log('3. Si les deux échouent: Problème de structure ou connexion');
}

main().catch(console.error);
