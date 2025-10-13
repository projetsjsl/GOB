#!/usr/bin/env node

/**
 * Script de refresh manuel des nouvelles
 * Usage: node manual-refresh-news.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fetchNewsFromAPI(source, url, params = {}) {
  try {
    console.log(`📡 Récupération depuis ${source}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(params.headers || {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ ${source}: ${data.articles?.length || data.length || 0} articles`);
    return data;
    
  } catch (error) {
    console.error(`❌ Erreur ${source}:`, error.message);
    return null;
  }
}

async function fetchGeneralNews() {
  console.log('📰 Récupération des nouvelles générales...');
  
  const sources = [];
  
  // Source 1: Marketaux (si configuré)
  if (process.env.MARKETAUX_API_KEY) {
    const marketauxData = await fetchNewsFromAPI(
      'Marketaux',
      `https://api.marketaux.com/v1/news/all?api_token=${process.env.MARKETAUX_API_KEY}&countries=us&limit=20`
    );
    
    if (marketauxData?.data) {
      sources.push(...marketauxData.data.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: 'Marketaux',
        publishedAt: article.published_at,
        category: 'general',
        sentiment: article.sentiment
      })));
    }
  }
  
  // Source 2: FMP (si configuré)
  if (process.env.FMP_API_KEY) {
    const fmpData = await fetchNewsFromAPI(
      'FMP',
      `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${process.env.FMP_API_KEY}`
    );
    
    if (fmpData) {
      sources.push(...fmpData.map(article => ({
        title: article.title,
        description: article.text,
        url: article.url,
        source: 'FMP',
        publishedAt: article.publishedDate,
        category: 'financial',
        sentiment: null
      })));
    }
  }
  
  // Source 3: Alpha Vantage (si configuré)
  if (process.env.ALPHA_VANTAGE_API_KEY) {
    const avData = await fetchNewsFromAPI(
      'Alpha Vantage',
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${process.env.ALPHA_VANTAGE_API_KEY}&limit=20`
    );
    
    if (avData?.feed) {
      sources.push(...avData.feed.map(article => ({
        title: article.title,
        description: article.summary,
        url: article.url,
        source: 'Alpha Vantage',
        publishedAt: article.time_published,
        category: 'general',
        sentiment: article.overall_sentiment_label
      })));
    }
  }
  
  // Si aucune source configurée, créer des données de démonstration
  if (sources.length === 0) {
    console.log('⚠️ Aucune clé API configurée, création de données de démonstration...');
    sources.push(
      {
        title: "Marchés financiers - Données de démonstration",
        description: "Les marchés montrent une tendance positive avec des volumes élevés.",
        url: "https://example.com/demo1",
        source: "Démo",
        publishedAt: new Date().toISOString(),
        category: "general",
        sentiment: "positive"
      },
      {
        title: "Analyse technique - Support et résistance",
        description: "Les niveaux de support et résistance sont testés sur les principaux indices.",
        url: "https://example.com/demo2",
        source: "Démo",
        publishedAt: new Date().toISOString(),
        category: "analysis",
        sentiment: "neutral"
      },
      {
        title: "Actualités économiques - Inflation et taux",
        description: "Les banques centrales surveillent l'évolution de l'inflation.",
        url: "https://example.com/demo3",
        source: "Démo",
        publishedAt: new Date().toISOString(),
        category: "economic",
        sentiment: "negative"
      }
    );
  }
  
  // Dédupliquer par titre
  const uniqueNews = sources.filter((article, index, self) => 
    index === self.findIndex(a => a.title === article.title)
  );
  
  console.log(`📊 Total nouvelles uniques: ${uniqueNews.length}`);
  return uniqueNews;
}

async function fetchSymbolNews(symbol) {
  console.log(`📈 Récupération nouvelles pour ${symbol}...`);
  
  const sources = [];
  
  // Source 1: FMP Stock News
  if (process.env.FMP_API_KEY) {
    const fmpData = await fetchNewsFromAPI(
      'FMP Stock News',
      `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=10&apikey=${process.env.FMP_API_KEY}`
    );
    
    if (fmpData) {
      sources.push(...fmpData.map(article => ({
        title: article.title,
        description: article.text,
        url: article.url,
        source: 'FMP',
        publishedAt: article.publishedDate,
        sentiment: null
      })));
    }
  }
  
  // Source 2: Marketaux par symbole
  if (process.env.MARKETAUX_API_KEY) {
    const marketauxData = await fetchNewsFromAPI(
      'Marketaux Symbol',
      `https://api.marketaux.com/v1/news/all?api_token=${process.env.MARKETAUX_API_KEY}&symbols=${symbol}&limit=10`
    );
    
    if (marketauxData?.data) {
      sources.push(...marketauxData.data.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: 'Marketaux',
        publishedAt: article.published_at,
        sentiment: article.sentiment
      })));
    }
  }
  
  // Si aucune source, créer des données de démonstration
  if (sources.length === 0) {
    console.log(`⚠️ Aucune clé API configurée pour ${symbol}, création de données de démonstration...`);
    sources.push(
      {
        title: `${symbol} - Actualités de démonstration`,
        description: `Les analystes sont optimistes concernant ${symbol} pour ce trimestre.`,
        url: `https://example.com/${symbol.toLowerCase()}-demo`,
        source: 'Démo',
        publishedAt: new Date().toISOString(),
        sentiment: 'positive'
      }
    );
  }
  
  // Dédupliquer
  const uniqueNews = sources.filter((article, index, self) => 
    index === self.findIndex(a => a.title === article.title)
  );
  
  console.log(`📊 ${symbol}: ${uniqueNews.length} nouvelles uniques`);
  return uniqueNews;
}

async function refreshNewsCache() {
  console.log('🔄 Début du refresh des nouvelles...');
  
  try {
    // 1. Récupérer nouvelles générales
    const generalNews = await fetchGeneralNews();
    
    if (generalNews && generalNews.length > 0) {
      // Vider le cache existant
      await supabase.from('market_news_cache').delete().gte('id', 0);
      
      // Insérer les nouvelles données
      const { error: insertError } = await supabase.from('market_news_cache').insert(
        generalNews.map(n => ({
          title: n.title,
          description: n.description,
          url: n.url,
          source: n.source,
          published_at: n.publishedAt,
          category: n.category || 'general',
          sentiment: n.sentiment
        }))
      );
      
      if (insertError) throw insertError;
      console.log(`💾 ${generalNews.length} nouvelles générales sauvegardées`);
    }
    
    // 2. Récupérer nouvelles pour symboles populaires
    const popularSymbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'NVDA'];
    let symbolsUpdated = 0;
    
    for (const symbol of popularSymbols) {
      try {
        const symbolNews = await fetchSymbolNews(symbol);
        
        if (symbolNews && symbolNews.length > 0) {
          // Vider le cache existant pour ce symbole
          await supabase.from('symbol_news_cache')
            .delete()
            .eq('symbol', symbol);
            
          // Insérer les nouvelles données
          const { error: insertError } = await supabase.from('symbol_news_cache').insert(
            symbolNews.map(n => ({
              symbol: symbol,
              title: n.title,
              description: n.description,
              url: n.url,
              source: n.source,
              published_at: n.publishedAt,
              sentiment: n.sentiment
            }))
          );
          
          if (insertError) {
            console.error(`❌ Erreur insertion nouvelles ${symbol}:`, insertError);
          } else {
            console.log(`💾 ${symbolNews.length} nouvelles sauvegardées pour ${symbol}`);
            symbolsUpdated++;
          }
        }
      } catch (error) {
        console.error(`❌ Erreur traitement ${symbol}:`, error);
      }
    }
    
    console.log(`✅ Refresh terminé: ${generalNews?.length || 0} nouvelles générales, ${symbolsUpdated} symboles mis à jour`);
    
    return {
      success: true,
      generalNews: generalNews?.length || 0,
      symbolsUpdated: symbolsUpdated,
      totalSymbols: popularSymbols.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur refresh:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function main() {
  console.log('🚀 Refresh manuel des nouvelles Supabase\n');
  
  const result = await refreshNewsCache();
  
  if (result.success) {
    console.log('\n✅ Refresh réussi !');
    console.log('🌐 Testez maintenant:');
    console.log('   curl "https://gobapps.com/api/unified-serverless?endpoint=news/cached&type=general&limit=5"');
    console.log('   curl "https://gobapps.com/api/unified-serverless?endpoint=news/cached&type=symbol&symbol=AAPL&limit=5"');
  } else {
    console.log('\n❌ Refresh échoué:', result.error);
  }
}

main().catch(console.error);
