#!/usr/bin/env node

/**
 * Script de test pour peupler les tables Supabase
 * Usage: node test-populate-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSupabaseConnection() {
  console.log('🔍 Test de connexion Supabase...');
  
  try {
    // Test de connexion basique
    const { data, error } = await supabase.from('market_news_cache').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erreur connexion Supabase:', error);
      return false;
    }
    
    console.log('✅ Connexion Supabase OK');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    return false;
  }
}

async function populateTestData() {
  console.log('📝 Ajout de données de test...');
  
  try {
    // Données de test pour market_news_cache
    const testNews = [
      {
        title: "Test News 1 - Marchés en hausse",
        description: "Les marchés financiers montrent des signes positifs aujourd'hui.",
        url: "https://example.com/news1",
        source: "Test Source",
        published_at: new Date().toISOString(),
        category: "general",
        sentiment: "positive"
      },
      {
        title: "Test News 2 - Analyse technique",
        description: "Les analystes prévoient une consolidation des prix.",
        url: "https://example.com/news2", 
        source: "Test Source",
        published_at: new Date().toISOString(),
        category: "analysis",
        sentiment: "neutral"
      }
    ];
    
    // Insérer dans market_news_cache
    const { data: marketData, error: marketError } = await supabase
      .from('market_news_cache')
      .insert(testNews)
      .select();
    
    if (marketError) {
      console.error('❌ Erreur insertion market_news_cache:', marketError);
    } else {
      console.log(`✅ ${marketData.length} nouvelles ajoutées à market_news_cache`);
    }
    
    // Données de test pour symbol_news_cache
    const testSymbolNews = [
      {
        symbol: "AAPL",
        title: "Apple annonce de nouveaux produits",
        description: "Apple Inc. dévoile sa nouvelle gamme d'iPhone.",
        url: "https://example.com/apple-news",
        source: "Test Source",
        published_at: new Date().toISOString(),
        sentiment: "positive"
      },
      {
        symbol: "TSLA", 
        title: "Tesla bat ses records de livraisons",
        description: "Tesla Inc. annonce des livraisons record ce trimestre.",
        url: "https://example.com/tesla-news",
        source: "Test Source", 
        published_at: new Date().toISOString(),
        sentiment: "positive"
      }
    ];
    
    // Insérer dans symbol_news_cache
    const { data: symbolData, error: symbolError } = await supabase
      .from('symbol_news_cache')
      .insert(testSymbolNews)
      .select();
    
    if (symbolError) {
      console.error('❌ Erreur insertion symbol_news_cache:', symbolError);
    } else {
      console.log(`✅ ${symbolData.length} nouvelles ajoutées à symbol_news_cache`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur population données:', error);
    return false;
  }
}

async function verifyData() {
  console.log('🔍 Vérification des données...');
  
  try {
    // Compter les nouvelles générales
    const { count: marketCount, error: marketError } = await supabase
      .from('market_news_cache')
      .select('*', { count: 'exact', head: true });
    
    if (marketError) {
      console.error('❌ Erreur comptage market_news_cache:', marketError);
    } else {
      console.log(`📊 market_news_cache: ${marketCount} entrées`);
    }
    
    // Compter les nouvelles par symbole
    const { count: symbolCount, error: symbolError } = await supabase
      .from('symbol_news_cache')
      .select('*', { count: 'exact', head: true });
    
    if (symbolError) {
      console.error('❌ Erreur comptage symbol_news_cache:', symbolError);
    } else {
      console.log(`📊 symbol_news_cache: ${symbolCount} entrées`);
    }
    
    // Lister les symboles uniques
    const { data: symbols, error: symbolsError } = await supabase
      .from('symbol_news_cache')
      .select('symbol')
      .order('symbol');
    
    if (symbolsError) {
      console.error('❌ Erreur récupération symboles:', symbolsError);
    } else {
      const uniqueSymbols = [...new Set(symbols.map(s => s.symbol))];
      console.log(`📈 Symboles dans le cache: ${uniqueSymbols.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

async function main() {
  console.log('🚀 Test de population Supabase\n');
  
  // 1. Tester la connexion
  const connected = await testSupabaseConnection();
  if (!connected) {
    console.log('❌ Impossible de continuer sans connexion Supabase');
    process.exit(1);
  }
  
  // 2. Peupler avec des données de test
  const populated = await populateTestData();
  if (!populated) {
    console.log('❌ Erreur lors de la population');
    process.exit(1);
  }
  
  // 3. Vérifier les données
  await verifyData();
  
  console.log('\n✅ Test terminé avec succès !');
  console.log('🌐 Vous pouvez maintenant tester:');
  console.log('   curl "https://gobapps.com/api/unified-serverless?endpoint=news/cached&type=general&limit=5"');
  console.log('   curl "https://gobapps.com/api/unified-serverless?endpoint=news/cached&type=symbol&symbol=AAPL&limit=5"');
}

main().catch(console.error);
