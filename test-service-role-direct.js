#!/usr/bin/env node

/**
 * Test direct avec la service role key
 * Pour vérifier si le problème vient de l'URL ou de la clé
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dm4dL2YBfo9DWxkkhmLfhQ_Ijo3GCRc';

async function testServiceRoleDirect() {
  console.log('🔑 Test direct avec Service Role Key\n');
  console.log(`📊 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test 1: Récupération de la watchlist "default"');
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (error) {
      console.log('❌ Erreur:', error);
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
    } else {
      console.log('✅ Succès:', data);
      console.log(`📊 Tickers: ${data.tickers.join(', ')}`);
    }
    
    console.log('\n🔍 Test 2: Test de connexion simple');
    const { data: testData, error: testError } = await supabase
      .from('watchlists')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur test:', testError);
    } else {
      console.log('✅ Test de connexion réussi');
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
    console.log(`   Type: ${error.constructor.name}`);
    console.log(`   Message: ${error.message}`);
  }
}

async function testWithCorrectURL() {
  console.log('\n🔍 Test avec URL corrigée\n');
  
  // Test avec différentes variantes d'URL
  const urls = [
    'https://boyuxgdplbpkknplxbxp.supabase.co',
    'https://boyuxgdplbpkknplxbxp.supabase.co/rest/v1/',
    'https://boyuxgdplbpkknplxbxp.supabase.co/rest/v1'
  ];
  
  for (const url of urls) {
    console.log(`🔍 Test URL: ${url}`);
    
    try {
      const supabase = createClient(url, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase
        .from('watchlists')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Succès avec cette URL !`);
        break;
      }
    } catch (err) {
      console.log(`   ❌ Erreur: ${err.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Test direct Service Role Key\n');
  
  await testServiceRoleDirect();
  await testWithCorrectURL();
  
  console.log('\n📋 DIAGNOSTIC:');
  console.log('==============');
  console.log('1. Si le test direct fonctionne: Le problème vient de Vercel');
  console.log('2. Si le test direct échoue: Le problème vient de l\'URL ou de la clé');
  console.log('3. Vérifiez que l\'URL dans Vercel est correcte');
}

main().catch(console.error);
