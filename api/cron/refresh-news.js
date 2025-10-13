import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Vérifier que c'est bien un cron Vercel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  
  try {
    console.log('🔄 Début du refresh des nouvelles...');
    
    // 1. Récupérer nouvelles générales depuis API externe
    const generalNews = await fetchGeneralNews();
    console.log(`📰 Nouvelles générales récupérées: ${generalNews?.length || 0}`);
    
    // 2. Sauvegarder dans market_news_cache
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
    
    // 3. Récupérer les symboles watchlist actifs
    const { data: watchlists, error: watchlistError } = await supabase
      .from('watchlists')
      .select('tickers');
    
    if (watchlistError) {
      console.warn('⚠️ Erreur récupération watchlists:', watchlistError);
    }
    
    const symbols = [...new Set(watchlists?.flatMap(w => w.tickers) || [])];
    console.log(`📊 Symboles watchlist trouvés: ${symbols.length}`);
    
    // 4. Pour chaque symbole, récupérer et cacher les nouvelles
    let symbolsUpdated = 0;
    for (const symbol of symbols.slice(0, 10)) { // Limiter à 10 symboles
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
    
    return res.status(200).json({
      success: true,
      generalNews: generalNews?.length || 0,
      symbolsUpdated: symbolsUpdated,
      totalSymbols: symbols.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur cron refresh:', error);
    return res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Fonctions pour récupérer les nouvelles depuis PLUSIEURS sources
async function fetchGeneralNews() {
  const sources = [];
  
  // Source 1: Marketaux (nouvelles générales diversifiées)
  try {
    const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY;
    if (MARKETAUX_API_KEY) {
      const response = await fetch(
        `https://api.marketaux.com/v1/news/all?api_token=${MARKETAUX_API_KEY}&limit=30&language=en`
      );
      const data = await response.json();
      sources.push(...(data.data || []).map(n => ({
        title: n.title,
        description: n.description,
        url: n.url,
        source: 'Marketaux',
        publishedAt: n.published_at,
        category: n.entities?.[0]?.industry || 'general',
        sentiment: n.entities?.[0]?.sentiment_score
      })));
      console.log(`📡 Marketaux: ${sources.length} nouvelles récupérées`);
    }
  } catch (error) {
    console.error('❌ Erreur Marketaux:', error);
  }
  
  // Source 2: FMP General News (nouvelles financières)
  try {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v4/general_news?page=0&apikey=${FMP_API_KEY}`
      );
      const data = await response.json();
      sources.push(...(data || []).slice(0, 20).map(n => ({
        title: n.title,
        description: n.text,
        url: n.url,
        source: 'FMP',
        publishedAt: n.publishedDate,
        category: 'financial',
        sentiment: null
      })));
      console.log(`📡 FMP: ${data?.length || 0} nouvelles récupérées`);
    }
  } catch (error) {
    console.error('❌ Erreur FMP:', error);
  }
  
  // Source 3: Alpha Vantage News (si disponible)
  try {
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_KEY}`
      );
      const data = await response.json();
      if (data.feed) {
        sources.push(...data.feed.slice(0, 20).map(n => ({
          title: n.title,
          description: n.summary,
          url: n.url,
          source: 'Alpha Vantage',
          publishedAt: n.time_published,
          category: n.topics?.[0]?.topic || 'general',
          sentiment: n.overall_sentiment_score
        })));
        console.log(`📡 Alpha Vantage: ${data.feed.length} nouvelles récupérées`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur Alpha Vantage:', error);
  }
  
  // Dédupliquer par titre et trier par date
  const uniqueNews = Array.from(
    new Map(sources.map(item => [item.title, item])).values()
  ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  console.log(`🔄 Total après déduplication: ${uniqueNews.length} nouvelles`);
  return uniqueNews.slice(0, 50); // Limiter à 50 nouvelles les plus récentes
}

async function fetchSymbolNews(symbol) {
  const sources = [];
  
  // Source 1: FMP Stock News
  try {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (FMP_API_KEY) {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=15&apikey=${FMP_API_KEY}`
      );
      const data = await response.json();
      sources.push(...(data || []).map(n => ({
        title: n.title,
        description: n.text,
        url: n.url,
        source: 'FMP',
        publishedAt: n.publishedDate,
        sentiment: n.sentiment
      })));
    }
  } catch (error) {
    console.error(`❌ Erreur FMP pour ${symbol}:`, error);
  }
  
  // Source 2: Marketaux (nouvelles spécifiques au symbole)
  try {
    const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY;
    if (MARKETAUX_API_KEY) {
      const response = await fetch(
        `https://api.marketaux.com/v1/news/all?symbols=${symbol}&api_token=${MARKETAUX_API_KEY}&limit=15`
      );
      const data = await response.json();
      sources.push(...(data.data || []).map(n => ({
        title: n.title,
        description: n.description,
        url: n.url,
        source: 'Marketaux',
        publishedAt: n.published_at,
        sentiment: n.entities?.[0]?.sentiment_score
      })));
    }
  } catch (error) {
    console.error(`❌ Erreur Marketaux pour ${symbol}:`, error);
  }
  
  // Source 3: Alpha Vantage (nouvelles du ticker)
  try {
    const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    if (ALPHA_VANTAGE_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`
      );
      const data = await response.json();
      if (data.feed) {
        sources.push(...data.feed.slice(0, 10).map(n => ({
          title: n.title,
          description: n.summary,
          url: n.url,
          source: 'Alpha Vantage',
          publishedAt: n.time_published,
          sentiment: n.overall_sentiment_score
        })));
      }
    }
  } catch (error) {
    console.error(`❌ Erreur Alpha Vantage pour ${symbol}:`, error);
  }
  
  // Dédupliquer et trier
  const uniqueNews = Array.from(
    new Map(sources.map(item => [item.title, item])).values()
  ).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  return uniqueNews.slice(0, 20); // Top 20 nouvelles les plus récentes
}
