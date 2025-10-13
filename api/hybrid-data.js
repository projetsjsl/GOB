/**
 * API Hybride - Base de Données Locale + APIs Externes
 * Utilise d'abord Supabase, puis les APIs externes si nécessaire
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { symbol, dataType, forceRefresh = false, syncIfNeeded = true } = req.query;

  if (!symbol || !dataType) {
    return res.status(400).json({ error: 'Paramètres symbol et dataType requis' });
  }

  try {
    console.log(`🔄 Récupération hybride ${dataType} pour ${symbol}`);

    const result = await getHybridData(symbol, dataType, forceRefresh === 'true', syncIfNeeded === 'true');

    res.status(200).json({
      success: true,
      symbol,
      dataType,
      source: result.source,
      data: result.data,
      metadata: result.metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur données hybrides:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des données',
      details: error.message
    });
  }
}

/**
 * Récupérer les données de manière hybride
 */
async function getHybridData(symbol, dataType, forceRefresh, syncIfNeeded) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  try {
    // 1. Essayer d'abord la base de données locale
    if (!forceRefresh) {
      const localData = await getLocalData(symbol, dataType, baseUrl);
      
      if (localData && isDataFresh(localData, dataType)) {
        console.log(`✅ Données locales trouvées pour ${symbol} (${dataType})`);
        return {
          source: 'local',
          data: localData,
          metadata: {
            freshness: 'fresh',
            lastUpdated: localData.lastUpdated || new Date().toISOString(),
            confidence: localData.confidence || 0.9
          }
        };
      }
    }

    // 2. Si pas de données locales ou données obsolètes, utiliser les APIs externes
    console.log(`🌐 Récupération depuis APIs externes pour ${symbol} (${dataType})`);
    const externalData = await getExternalData(symbol, dataType, baseUrl);

    // 3. Si syncIfNeeded est activé, synchroniser en arrière-plan
    if (syncIfNeeded && externalData) {
      syncInBackground(symbol, dataType, baseUrl).catch(error => {
        console.error('❌ Erreur sync arrière-plan:', error);
      });
    }

    return {
      source: 'external',
      data: externalData,
      metadata: {
        freshness: 'real-time',
        lastUpdated: new Date().toISOString(),
        confidence: externalData?.validation?.confidence || 0.8,
        willSync: syncIfNeeded
      }
    };

  } catch (error) {
    console.error(`❌ Erreur récupération hybride ${dataType}:`, error);
    
    // En cas d'erreur, essayer les données locales même si obsolètes
    try {
      const fallbackData = await getLocalData(symbol, dataType, baseUrl);
      if (fallbackData) {
        console.log(`⚠️ Utilisation données locales obsolètes pour ${symbol} (${dataType})`);
        return {
          source: 'local-fallback',
          data: fallbackData,
          metadata: {
            freshness: 'stale',
            lastUpdated: fallbackData.lastUpdated || new Date().toISOString(),
            confidence: 0.6,
            warning: 'Données obsolètes - erreur API externe'
          }
        };
      }
    } catch (fallbackError) {
      console.error('❌ Erreur fallback local:', fallbackError);
    }

    throw error;
  }
}

/**
 * Récupérer les données depuis la base locale
 */
async function getLocalData(symbol, dataType, baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/historical-data?symbol=${symbol}&dataType=${dataType}&limit=1`);
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data?.[0] || null;

  } catch (error) {
    console.error('❌ Erreur données locales:', error);
    return null;
  }
}

/**
 * Récupérer les données depuis les APIs externes
 */
async function getExternalData(symbol, dataType, baseUrl) {
  try {
    let response;

    switch (dataType) {
      case 'quote':
        response = await fetch(`${baseUrl}/api/data-validation?symbol=${symbol}&dataType=quote`);
        break;
      case 'profile':
        response = await fetch(`${baseUrl}/api/data-validation?symbol=${symbol}&dataType=profile`);
        break;
      case 'ratios':
        response = await fetch(`${baseUrl}/api/financial-ratios?symbol=${symbol}`);
        break;
      case 'analyst':
        response = await fetch(`${baseUrl}/api/analyst-recommendations?symbol=${symbol}`);
        break;
      case 'earnings':
        response = await fetch(`${baseUrl}/api/earnings-calendar?symbol=${symbol}&limit=5`);
        break;
      case 'news':
        response = await fetch(`${baseUrl}/api/marketaux?endpoint=ticker-sentiment&symbol=${symbol}&limit=10`);
        break;
      case 'prices':
        response = await fetch(`${baseUrl}/api/fmp?endpoint=historical-chart&symbol=${symbol}&timeframe=1day&limit=30`);
        break;
      default:
        throw new Error(`Type de données non supporté: ${dataType}`);
    }

    if (!response.ok) {
      throw new Error(`Erreur API externe: ${response.status}`);
    }

    const data = await response.json();
    
    // Adapter le format selon le type de données
    return adaptExternalData(data, dataType);

  } catch (error) {
    console.error(`❌ Erreur API externe ${dataType}:`, error);
    throw error;
  }
}

/**
 * Adapter les données externes au format local
 */
function adaptExternalData(data, dataType) {
  switch (dataType) {
    case 'quote':
      return {
        ...data.finalData,
        validation: data.validation,
        lastUpdated: new Date().toISOString()
      };
    
    case 'profile':
      return {
        ...data.finalData,
        validation: data.validation,
        lastUpdated: new Date().toISOString()
      };
    
    case 'ratios':
      return {
        ratios: data.ratios,
        validation: data.validation,
        metadata: data.metadata,
        lastUpdated: new Date().toISOString()
      };
    
    case 'analyst':
      return {
        consensus: data.consensus,
        breakdown: data.breakdown,
        priceTargets: data.priceTargets,
        validation: data.validation,
        lastUpdated: new Date().toISOString()
      };
    
    case 'earnings':
      return {
        upcoming: data.upcoming,
        historical: data.historical,
        consensus: data.consensus,
        statistics: data.statistics,
        validation: data.validation,
        lastUpdated: new Date().toISOString()
      };
    
    case 'news':
      return {
        news: data.news,
        sentimentAnalysis: data.sentimentAnalysis,
        lastUpdated: new Date().toISOString()
      };
    
    case 'prices':
      return {
        prices: Array.isArray(data) ? data : data.historical || [],
        lastUpdated: new Date().toISOString()
      };
    
    default:
      return data;
  }
}

/**
 * Vérifier si les données sont fraîches
 */
function isDataFresh(data, dataType) {
  if (!data.lastUpdated) {
    return false;
  }

  const lastUpdated = new Date(data.lastUpdated);
  const now = new Date();
  const ageInHours = (now - lastUpdated) / (1000 * 60 * 60);

  // Définir les seuils de fraîcheur selon le type de données
  const freshnessThresholds = {
    quote: 0.25,      // 15 minutes
    prices: 1,        // 1 heure
    profile: 24,      // 24 heures
    ratios: 24,       // 24 heures
    analyst: 24,      // 24 heures
    earnings: 24,     // 24 heures
    news: 1           // 1 heure
  };

  const threshold = freshnessThresholds[dataType] || 24;
  return ageInHours < threshold;
}

/**
 * Synchroniser en arrière-plan
 */
async function syncInBackground(symbol, dataType, baseUrl) {
  try {
    console.log(`🔄 Synchronisation arrière-plan pour ${symbol} (${dataType})`);
    
    // Déterminer le type de sync selon le type de données
    let syncType = 'incremental';
    if (dataType === 'ratios' || dataType === 'analyst' || dataType === 'earnings') {
      syncType = dataType;
    }

    const response = await fetch(`${baseUrl}/api/sync-historical-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        syncType,
        forceUpdate: false
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Sync arrière-plan réussie pour ${symbol}:`, result.result);
    } else {
      console.error(`❌ Erreur sync arrière-plan pour ${symbol}:`, response.status);
    }

  } catch (error) {
    console.error(`❌ Erreur sync arrière-plan pour ${symbol}:`, error);
  }
}

/**
 * API pour forcer la synchronisation
 */
export async function forceSync(symbol, dataType) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/sync-historical-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        syncType: dataType === 'all' ? 'full' : dataType,
        forceUpdate: true
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur sync forcée: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Erreur sync forcée:', error);
    throw error;
  }
}

/**
 * API pour obtenir les statistiques de la base de données
 */
export async function getDatabaseStats() {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  try {
    const stats = {};
    const dataTypes = ['stock', 'prices', 'ratios', 'analyst', 'earnings', 'news'];

    for (const dataType of dataTypes) {
      try {
        const response = await fetch(`${baseUrl}/api/historical-data?symbol=AAPL&dataType=${dataType}&limit=1`);
        if (response.ok) {
          const data = await response.json();
          stats[dataType] = {
            available: true,
            records: data.data?.length || 0
          };
        } else {
          stats[dataType] = {
            available: false,
            error: response.status
          };
        }
      } catch (error) {
        stats[dataType] = {
          available: false,
          error: error.message
        };
      }
    }

    return {
      success: true,
      stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur stats base de données:', error);
    throw error;
  }
}
