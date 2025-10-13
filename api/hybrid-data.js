/**
 * API Hybride - Base de données locale + APIs externes
 * Combine les données stockées localement avec les APIs externes pour optimiser les performances
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol, dataType, syncIfNeeded = false } = req.query;

  if (!symbol || !dataType) {
    return res.status(400).json({ error: 'Paramètres symbol et dataType requis' });
  }

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
      shouldSync = true;
    }

    // Si pas de données locales ou données obsolètes, récupérer depuis les APIs externes
    if (!localData || shouldSync) {
      console.log(`📡 Synchronisation avec APIs externes pour ${symbol} (${dataType})`);
      const externalData = await fetchExternalData(symbol, dataType);
      
      // Sauvegarder en local si possible
      if (SUPABASE_URL && SUPABASE_ANON_KEY && externalData) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          await saveLocalData(supabase, symbol, dataType, externalData);
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
    res.status(500).json({ 
      error: `Erreur lors de la récupération de ${dataType}`,
      details: error.message 
    });
  }
}

/**
 * Récupérer les données locales depuis Supabase
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

  const table = tableMap[dataType];
  if (!table) {
    throw new Error(`Type de données non supporté: ${dataType}`);
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('symbol', symbol)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
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

  const table = tableMap[dataType];
  if (!table) {
    throw new Error(`Type de données non supporté: ${dataType}`);
  }

  const recordData = {
    symbol,
    data: data,
    last_updated: new Date().toISOString()
  };

  const { error } = await supabase
    .from(table)
    .upsert(recordData, { onConflict: 'symbol' });

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
      const quoteResponse = await fetch(`${baseUrl}/api/marketdata?endpoint=quote&symbol=${symbol}&source=auto`);
      return quoteResponse.ok ? await quoteResponse.json() : null;

    case 'profile':
      const profileResponse = await fetch(`${baseUrl}/api/fmp?endpoint=profile&symbol=${symbol}`);
      return profileResponse.ok ? await profileResponse.json() : null;

    case 'ratios':
      const ratiosResponse = await fetch(`${baseUrl}/api/fmp?endpoint=ratios&symbol=${symbol}`);
      return ratiosResponse.ok ? await ratiosResponse.json() : null;

    case 'news':
      const newsResponse = await fetch(`${baseUrl}/api/marketaux?endpoint=ticker-sentiment&symbol=${symbol}&limit=20`);
      return newsResponse.ok ? await newsResponse.json() : null;

    case 'prices':
      const pricesResponse = await fetch(`${baseUrl}/api/fmp?endpoint=historical-chart&symbol=${symbol}&timeframe=1day&limit=30`);
      return pricesResponse.ok ? await pricesResponse.json() : null;

    case 'analyst':
      const analystResponse = await fetch(`${baseUrl}/api/unified-data?endpoint=analyst-recommendations&symbol=${symbol}`);
      return analystResponse.ok ? await analystResponse.json() : null;

    case 'earnings':
      const earningsResponse = await fetch(`${baseUrl}/api/unified-data?endpoint=earnings-calendar&symbol=${symbol}&limit=5`);
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
  
  const dataTime = new Date(lastUpdated);
  const now = new Date();
  const diffHours = (now - dataTime) / (1000 * 60 * 60);
  
  return diffHours < maxHours;
}