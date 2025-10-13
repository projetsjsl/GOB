#!/usr/bin/env node

/**
 * Script pour créer la table watchlists et des données de test
 * Utilise vos vraies clés Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_dm4dL2YBfo9DWxkkhmLfhQ_Ijo3GCRc';

async function createWatchlistTable() {
  console.log('🔧 Création de la table watchlists et données de test\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔍 Test 1: Vérifier si la table existe');
    const { data: testData, error: testError } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erreur lors du test:', testError);
      console.log(`   Code: ${testError.code}`);
      console.log(`   Message: ${testError.message}`);
      
      if (testError.code === '42P01') {
        console.log('💡 Table "watchlists" n\'existe pas - créons-la...');
        await createTableSQL(supabase);
      }
    } else {
      console.log('✅ Table watchlists existe');
      console.log('📊 Données existantes:', testData);
    }
    
    console.log('\n🔍 Test 2: Créer une watchlist de test');
    const { data: insertData, error: insertError } = await supabase
      .from('watchlists')
      .upsert({
        user_id: 'default',
        tickers: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Erreur insertion:', insertError);
      console.log(`   Code: ${insertError.code}`);
      console.log(`   Message: ${insertError.message}`);
    } else {
      console.log('✅ Watchlist de test créée:', insertData);
    }
    
    console.log('\n🔍 Test 3: Vérifier la récupération');
    const { data: getData, error: getError } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (getError) {
      console.log('❌ Erreur récupération:', getError);
    } else {
      console.log('✅ Récupération réussie:', getData);
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

async function createTableSQL(supabase) {
  console.log('🔧 Création de la table via SQL...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS watchlists (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      tickers JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
    
    ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Allow all operations for service role" ON watchlists
      FOR ALL USING (true);
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.log('⚠️ Impossible d\'exécuter le SQL directement:', error);
      console.log('💡 Créez la table manuellement dans Supabase Dashboard');
      console.log('📋 SQL à exécuter:');
      console.log(createTableSQL);
    } else {
      console.log('✅ Table créée avec succès');
    }
  } catch (err) {
    console.log('⚠️ Fonction exec_sql non disponible');
    console.log('💡 Créez la table manuellement dans Supabase Dashboard');
  }
}

async function main() {
  console.log('🚀 Création de la table watchlists et données de test\n');
  console.log(`📊 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);
  
  await createWatchlistTable();
  
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('=====================');
  console.log('1. Si la table n\'existe pas, créez-la manuellement dans Supabase');
  console.log('2. Testez l\'API: curl https://gobapps.com/api/supabase-watchlist');
  console.log('3. Vérifiez le dashboard: https://gobapps.com/beta-combined-dashboard.html');
}

main().catch(console.error);
