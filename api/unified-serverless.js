/**
 * API Unifiée Serverless - Respecte la limite de 12 fonctions Vercel
 * Regroupe toutes les fonctionnalités en une seule API
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { endpoint, action, symbol, dataType, timeframe, limit, source, ...otherParams } = req.query;

  if (!endpoint) {
    return res.status(400).json({ 
      error: 'Paramètre endpoint requis',
      availableEndpoints: [
        'fmp', 'marketdata', 'marketaux', 'news', 'hybrid-data',
        'auto-populate', 'sync-historical', 'supabase-watchlist',
        'claude', 'gemini-chat', 'github-update', 'unified-data'
      ]
    });
  }

  try {
    console.log(`🔄 API Unifiée - ${endpoint} ${action || ''} ${symbol || ''}`);

    switch (endpoint) {
      case 'fmp':
        return await handleFMP(req, res, symbol, action, timeframe, limit);
      
      case 'marketdata':
        return await handleMarketData(req, res, symbol, source);
      
      case 'marketaux':
        return await handleMarketaux(req, res, symbol, limit);
      
      case 'news':
        return await handleNews(req, res, symbol, limit);
      
      case 'hybrid-data':
        return await handleHybridData(req, res, symbol, dataType);
      
      case 'auto-populate':
        return await handleAutoPopulate(req, res, symbol);
      
      case 'sync-historical':
        return await handleSyncHistorical(req, res, symbol, timeframe, limit);
      
      case 'supabase-watchlist':
        return await handleSupabaseWatchlist(req, res, action, otherParams);
      
      case 'claude':
        return await handleClaude(req, res, otherParams);
      
      case 'gemini-chat':
        return await handleGeminiChat(req, res, otherParams);
      
      case 'github-update':
        return await handleGithubUpdate(req, res, otherParams);
      
      case 'unified-data':
        return await handleUnifiedData(req, res, symbol, action);
      
      default:
        return res.status(400).json({ 
          error: `Endpoint '${endpoint}' non supporté`,
          availableEndpoints: [
            'fmp', 'marketdata', 'marketaux', 'news', 'hybrid-data',
            'auto-populate', 'sync-historical', 'supabase-watchlist',
            'claude', 'gemini-chat', 'github-update', 'unified-data'
          ]
        });
    }

  } catch (error) {
    console.error(`❌ Erreur API unifiée (${endpoint}):`, error);
    return res.status(500).json({
      error: `Erreur ${endpoint}`,
      details: error.message
    });
  }
}

// ============================================
// HANDLERS POUR CHAQUE ENDPOINT
// ============================================

// FMP API Handler
async function handleFMP(req, res, symbol, action, timeframe, limit) {
  if (!action) {
    return res.status(400).json({ error: 'Paramètre action requis pour FMP' });
  }

  const { getQuote, getCompanyProfile, getFinancialRatiosTTM, getHistoricalChart } = await import('./fmp.js');
  
  let result;
  switch (action) {
    case 'quote':
      if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
      result = await getQuote(symbol);
      break;
    case 'profile':
      if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
      result = await getCompanyProfile(symbol);
      break;
    case 'ratios':
      if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
      result = await getFinancialRatiosTTM(symbol);
      break;
    case 'historical-chart':
      if (!symbol) return res.status(400).json({ error: 'Symbol requis' });
      result = await getHistoricalChart(symbol, timeframe || '1day', parseInt(limit) || 100);
      break;
    default:
      return res.status(400).json({ error: `Action FMP '${action}' non supportée` });
  }

  return res.status(200).json(result);
}

// Market Data Handler
async function handleMarketData(req, res, symbol, source) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  const { getQuote } = await import('./marketdata.js');
  const result = await getQuote(symbol, source || 'auto');
  
  return res.status(200).json(result);
}

// Marketaux Handler
async function handleMarketaux(req, res, symbol, limit) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  const { getTickerSentiment } = await import('./marketaux.js');
  const result = await getTickerSentiment(symbol, parseInt(limit) || 20);
  
  return res.status(200).json(result);
}

// News Handler
async function handleNews(req, res, symbol, limit) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  const { getNews } = await import('./news.js');
  const result = await getNews(symbol, parseInt(limit) || 10);
  
  return res.status(200).json(result);
}

// Hybrid Data Handler
async function handleHybridData(req, res, symbol, dataType) {
  if (!symbol || !dataType) {
    return res.status(400).json({ error: 'Paramètres symbol et dataType requis' });
  }

  // Implémentation directe de l'API hybride
  const { syncIfNeeded = false } = req.query;
  
  try {
    console.log(`🔄 API Hybride - ${dataType} pour ${symbol}`);

    // Vérifier si Supabase est configuré
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    
    let localData = null;
    let shouldSync = false;

    // Essayer de récupérer les données locales d'abord
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        localData = await getLocalData(supabase, symbol, dataType);
        
        // Vérifier si les données sont fraîches (moins de 1 heure)
        const isDataFresh = localData && isDataRecent(localData.last_updated, 1);
        
        if (!isDataFresh && syncIfNeeded === 'true') {
          shouldSync = true;
        }
      } catch (error) {
        console.warn('⚠️ Erreur accès base locale:', error.message);
        shouldSync = true;
      }
    } else {
      console.warn('⚠️ Supabase non configuré, utilisation directe des APIs externes');
      shouldSync = true;
    }

    // Si pas de données locales ou données obsolètes, récupérer depuis les APIs externes
    if (!localData || shouldSync) {
      console.log(`📡 Synchronisation avec APIs externes pour ${symbol} (${dataType})`);
      const externalData = await fetchExternalData(symbol, dataType);
      
      if (!externalData) {
        throw new Error(`Aucune donnée disponible pour ${symbol} (${dataType})`);
      }
      
      // Sauvegarder en local si possible
      if (SUPABASE_URL && SUPABASE_ANON_KEY && externalData) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          await saveLocalData(supabase, symbol, dataType, externalData);
          console.log(`💾 Données sauvegardées en local pour ${symbol} (${dataType})`);
        } catch (error) {
          console.warn('⚠️ Erreur sauvegarde locale:', error.message);
        }
      }
      
      return res.status(200).json({
        success: true,
        symbol,
        dataType,
        data: externalData,
        source: 'external',
        metadata: {
          confidence: 0.9,
          freshness: 'fresh',
          lastUpdated: new Date().toISOString(),
          syncPerformed: true
        }
      });
    }

    // Retourner les données locales
    return res.status(200).json({
      success: true,
      symbol,
      dataType,
      data: localData.data,
      source: 'local',
      metadata: {
        confidence: 0.95,
        freshness: 'cached',
        lastUpdated: localData.last_updated,
        syncPerformed: false
      }
    });

  } catch (error) {
    console.error(`❌ Erreur API hybride (${dataType}):`, error);
    return res.status(500).json({ 
      error: `Erreur lors de la récupération de ${dataType}`,
      details: error.message 
    });
  }
}

// Auto Populate Handler
async function handleAutoPopulate(req, res, symbol) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  const { default: autoPopulateHandler } = await import('./auto-populate-ticker.js');
  return await autoPopulateHandler(req, res);
}

// Sync Historical Handler
async function handleSyncHistorical(req, res, symbol, timeframe, limit) {
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  const { default: syncHandler } = await import('./sync-historical-data.js');
  return await syncHandler(req, res);
}

// Supabase Watchlist Handler
async function handleSupabaseWatchlist(req, res, action, params) {
  const { default: watchlistHandler } = await import('./supabase-watchlist.js');
  return await watchlistHandler(req, res);
}

// Claude Handler
async function handleClaude(req, res, params) {
  const { default: claudeHandler } = await import('./claude.js');
  return await claudeHandler(req, res);
}

// Gemini Chat Handler
async function handleGeminiChat(req, res, params) {
  const { default: geminiHandler } = await import('./gemini/chat.js');
  return await geminiHandler(req, res);
}

// Github Update Handler
async function handleGithubUpdate(req, res, params) {
  const { default: githubHandler } = await import('./github-update.js');
  return await githubHandler(req, res);
}

// Unified Data Handler
async function handleUnifiedData(req, res, symbol, action) {
  // Implémentation simplifiée de unified-data
  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    const { getCompleteAnalysis } = await import('./fmp.js');
    const result = await getCompleteAnalysis(symbol);
    
    return res.status(200).json({
      success: true,
      symbol,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erreur unified data',
      details: error.message
    });
  }
}

// ============================================
// FONCTIONS HELPER
// ============================================

/**
 * Récupérer les données depuis la base locale
 */
async function getLocalData(supabase, symbol, dataType) {
  const tableMap = {
    'quote': 'stock_quotes',
    'profile': 'stock_profiles', 
    'ratios': 'financial_ratios',
    'news': 'news_articles',
    'prices': 'daily_prices',
    'analyst': 'analyst_recommendations',
    'earnings': 'earnings_calendar'
  };

  const tableName = tableMap[dataType];
  if (!tableName) {
    throw new Error(`Type de données non supporté: ${dataType}`);
  }

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('symbol', symbol)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw error;
  }

  return data;
}

/**
 * Sauvegarder les données en local
 */
async function saveLocalData(supabase, symbol, dataType, data) {
  const tableMap = {
    'quote': 'stock_quotes',
    'profile': 'stock_profiles',
    'ratios': 'financial_ratios', 
    'news': 'news_articles',
    'prices': 'daily_prices',
    'analyst': 'analyst_recommendations',
    'earnings': 'earnings_calendar'
  };

  const tableName = tableMap[dataType];
  if (!tableName) {
    throw new Error(`Type de données non supporté: ${dataType}`);
  }

  const { error } = await supabase
    .from(tableName)
    .upsert({
      symbol,
      data,
      last_updated: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

/**
 * Récupérer les données depuis les APIs externes
 */
async function fetchExternalData(symbol, dataType) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  switch (dataType) {
    case 'quote':
      const quoteResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=marketdata&symbol=${symbol}&source=auto`);
      return quoteResponse.ok ? await quoteResponse.json() : null;

    case 'profile':
      const profileResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=fmp&action=profile&symbol=${symbol}`);
      return profileResponse.ok ? await profileResponse.json() : null;

    case 'ratios':
      const ratiosResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=fmp&action=ratios&symbol=${symbol}`);
      return ratiosResponse.ok ? await ratiosResponse.json() : null;

    case 'news':
      const newsResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=marketaux&symbol=${symbol}&limit=20`);
      return newsResponse.ok ? await newsResponse.json() : null;

    case 'prices':
      const pricesResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=fmp&action=historical-chart&symbol=${symbol}&timeframe=1day&limit=30`);
      return pricesResponse.ok ? await pricesResponse.json() : null;

    case 'analyst':
      const analystResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=fmp&action=rating&symbol=${symbol}`);
      return analystResponse.ok ? await analystResponse.json() : null;

    case 'earnings':
      const earningsResponse = await fetch(`${baseUrl}/api/unified-serverless?endpoint=fmp&action=earnings&symbol=${symbol}&limit=5`);
      return earningsResponse.ok ? await earningsResponse.json() : null;

    default:
      throw new Error(`Type de données non supporté: ${dataType}`);
  }
}

/**
 * Vérifier si les données sont récentes
 */
function isDataRecent(lastUpdated, maxHours = 1) {
  if (!lastUpdated) return false;
  
  const now = new Date();
  const dataTime = new Date(lastUpdated);
  const diffHours = (now - dataTime) / (1000 * 60 * 60);
  
  return diffHours < maxHours;
}
