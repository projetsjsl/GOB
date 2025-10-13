#!/usr/bin/env node

/**
 * Script pour configurer la table watchlists dans Supabase
 * Crée la table si elle n'existe pas et ajoute des données de test
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables Supabase manquantes');
  console.log('Configurez SUPABASE_URL et SUPABASE_ANON_KEY dans votre .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createWatchlistTable() {
  console.log('🔧 Création de la table watchlists...\n');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS watchlists (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      tickers JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    -- Index pour améliorer les performances
    CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
    
    -- Trigger pour mettre à jour updated_at automatiquement
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    DROP TRIGGER IF EXISTS update_watchlists_updated_at ON watchlists;
    CREATE TRIGGER update_watchlists_updated_at
        BEFORE UPDATE ON watchlists
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.log('⚠️ Erreur lors de la création de la table (peut-être déjà existante):');
      console.log(`   ${error.message}`);
    } else {
      console.log('✅ Table watchlists créée avec succès');
    }
  } catch (err) {
    console.log('⚠️ Impossible d\'exécuter le SQL directement (normal en mode anon)');
    console.log('   La table sera créée via l\'interface Supabase');
  }
}

async function checkTableExists() {
  console.log('🔍 Vérification de l\'existence de la table...\n');
  
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "watchlists" does not exist')) {
        console.log('❌ Table watchlists n\'existe pas');
        return false;
      } else {
        console.log('⚠️ Erreur lors de la vérification:');
        console.log(`   ${error.message}`);
        return false;
      }
    } else {
      console.log('✅ Table watchlists existe');
      return true;
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:');
    console.log(`   ${err.message}`);
    return false;
  }
}

async function addTestData() {
  console.log('📝 Ajout de données de test...\n');
  
  const testTickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
  
  try {
    // Essayer d'insérer ou de mettre à jour
    const { data, error } = await supabase
      .from('watchlists')
      .upsert({
        user_id: 'default',
        tickers: testTickers,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();
    
    if (error) {
      console.log('❌ Erreur lors de l\'ajout des données:');
      console.log(`   ${error.message}`);
    } else {
      console.log('✅ Données de test ajoutées:');
      console.log(`   Tickers: ${testTickers.join(', ')}`);
      console.log(`   User ID: default`);
    }
  } catch (err) {
    console.log('❌ Erreur lors de l\'ajout des données:');
    console.log(`   ${err.message}`);
  }
}

async function testRetrieval() {
  console.log('🔄 Test de récupération des données...\n');
  
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', 'default')
      .single();
    
    if (error) {
      console.log('❌ Erreur lors de la récupération:');
      console.log(`   ${error.message}`);
    } else {
      console.log('✅ Données récupérées avec succès:');
      console.log(`   ID: ${data.id}`);
      console.log(`   User ID: ${data.user_id}`);
      console.log(`   Tickers: ${JSON.stringify(data.tickers)}`);
      console.log(`   Créé: ${data.created_at}`);
      console.log(`   Modifié: ${data.updated_at}`);
    }
  } catch (err) {
    console.log('❌ Erreur lors de la récupération:');
    console.log(`   ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Configuration de la watchlist Supabase\n');
  console.log(`📊 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);
  
  const tableExists = await checkTableExists();
  
  if (!tableExists) {
    await createWatchlistTable();
  }
  
  await addTestData();
  await testRetrieval();
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('================');
  console.log('1. Si la table n\'existe pas, créez-la manuellement dans Supabase:');
  console.log('   - Allez dans l\'éditeur SQL de Supabase');
  console.log('   - Exécutez le SQL de création de table');
  console.log('2. Vérifiez que les politiques RLS sont configurées');
  console.log('3. Testez l\'API avec: node test-supabase-watchlist.js');
}

main().catch(console.error);
