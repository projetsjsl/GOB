/**
 * API de Validation Croisée des Données
 * Compare les données entre plusieurs sources pour garantir l'exactitude
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { symbol, dataType = 'quote' } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`🔍 Validation croisée pour ${symbol} (${dataType})`);

    // Récupérer les données depuis plusieurs sources en parallèle
    const [fmpData, yahooData, finnhubData] = await Promise.allSettled([
      fetchFMPData(symbol, dataType),
      fetchYahooData(symbol, dataType),
      fetchFinnhubData(symbol, dataType)
    ]);

    // Analyser et valider les données
    const validationResult = validateAndCompareData({
      symbol,
      dataType,
      sources: {
        fmp: fmpData.status === 'fulfilled' ? fmpData.value : null,
        yahoo: yahooData.status === 'fulfilled' ? yahooData.value : null,
        finnhub: finnhubData.status === 'fulfilled' ? finnhubData.value : null
      }
    });

    res.status(200).json(validationResult);

  } catch (error) {
    console.error('❌ Erreur validation croisée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la validation croisée',
      details: error.message 
    });
  }
}

/**
 * Récupérer les données depuis FMP
 */
async function fetchFMPData(symbol, dataType) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  switch (dataType) {
    case 'quote':
      const response = await fetch(`${baseUrl}/api/fmp?endpoint=quote&symbol=${symbol}`);
      if (!response.ok) throw new Error(`FMP error: ${response.status}`);
      return await response.json();
    
    case 'profile':
      const profileResponse = await fetch(`${baseUrl}/api/fmp?endpoint=profile&symbol=${symbol}`);
      if (!profileResponse.ok) throw new Error(`FMP profile error: ${profileResponse.status}`);
      return await profileResponse.json();
    
    case 'ratios':
      const ratiosResponse = await fetch(`${baseUrl}/api/fmp?endpoint=ratios&symbol=${symbol}`);
      if (!ratiosResponse.ok) throw new Error(`FMP ratios error: ${ratiosResponse.status}`);
      return await ratiosResponse.json();
    
    default:
      throw new Error(`Type de données non supporté: ${dataType}`);
  }
}

/**
 * Récupérer les données depuis Yahoo Finance
 */
async function fetchYahooData(symbol, dataType) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/marketdata?endpoint=${dataType}&symbol=${symbol}&source=yahoo`);
  if (!response.ok) throw new Error(`Yahoo error: ${response.status}`);
  return await response.json();
}

/**
 * Récupérer les données depuis Finnhub
 */
async function fetchFinnhubData(symbol, dataType) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/marketdata?endpoint=${dataType}&symbol=${symbol}&source=finnhub`);
  if (!response.ok) throw new Error(`Finnhub error: ${response.status}`);
  return await response.json();
}

/**
 * Valider et comparer les données entre sources
 */
function validateAndCompareData({ symbol, dataType, sources }) {
  const result = {
    symbol,
    dataType,
    timestamp: new Date().toISOString(),
    sources: {},
    validation: {
      status: 'unknown',
      confidence: 0,
      discrepancies: [],
      recommendations: []
    },
    finalData: null
  };

  // Analyser chaque source
  Object.entries(sources).forEach(([sourceName, data]) => {
    if (data) {
      result.sources[sourceName] = {
        available: true,
        data: data,
        quality: assessDataQuality(data, dataType)
      };
    } else {
      result.sources[sourceName] = {
        available: false,
        error: 'Source non disponible'
      };
    }
  });

  // Comparer les données disponibles
  const availableSources = Object.entries(result.sources)
    .filter(([_, source]) => source.available)
    .map(([name, source]) => ({ name, ...source }));

  if (availableSources.length === 0) {
    result.validation.status = 'error';
    result.validation.recommendations.push('Aucune source disponible');
    return result;
  }

  if (availableSources.length === 1) {
    result.validation.status = 'single_source';
    result.validation.confidence = 0.7;
    result.finalData = availableSources[0].data;
    result.validation.recommendations.push('Données d\'une seule source - validation limitée');
    return result;
  }

  // Comparer les données entre sources
  const comparison = compareDataBetweenSources(availableSources, dataType);
  
  result.validation.status = comparison.status;
  result.validation.confidence = comparison.confidence;
  result.validation.discrepancies = comparison.discrepancies;
  result.validation.recommendations = comparison.recommendations;
  result.finalData = comparison.bestData;

  return result;
}

/**
 * Évaluer la qualité des données
 */
function assessDataQuality(data, dataType) {
  let score = 0;
  const issues = [];

  switch (dataType) {
    case 'quote':
      if (data.c && data.c > 0) score += 30;
      else issues.push('Prix manquant ou invalide');
      
      if (data.d !== undefined) score += 20;
      else issues.push('Variation manquante');
      
      if (data.dp !== undefined) score += 20;
      else issues.push('Pourcentage de variation manquant');
      
      if (data.h && data.l && data.o) score += 20;
      else issues.push('Données OHLC incomplètes');
      
      if (data.volume && data.volume > 0) score += 10;
      else issues.push('Volume manquant');
      break;

    case 'profile':
      if (data.name) score += 25;
      else issues.push('Nom d\'entreprise manquant');
      
      if (data.sector) score += 20;
      else issues.push('Secteur manquant');
      
      if (data.industry) score += 20;
      else issues.push('Industrie manquante');
      
      if (data.marketCapitalization) score += 20;
      else issues.push('Capitalisation manquante');
      
      if (data.website) score += 15;
      else issues.push('Site web manquant');
      break;

    case 'ratios':
      if (data.peRatio !== undefined) score += 20;
      else issues.push('P/E manquant');
      
      if (data.pbRatio !== undefined) score += 20;
      else issues.push('P/B manquant');
      
      if (data.psRatio !== undefined) score += 20;
      else issues.push('P/S manquant');
      
      if (data.roe !== undefined) score += 20;
      else issues.push('ROE manquant');
      
      if (data.roa !== undefined) score += 20;
      else issues.push('ROA manquant');
      break;
  }

  return {
    score: Math.min(score, 100),
    issues,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  };
}

/**
 * Comparer les données entre sources
 */
function compareDataBetweenSources(sources, dataType) {
  const result = {
    status: 'validated',
    confidence: 0,
    discrepancies: [],
    recommendations: [],
    bestData: null
  };

  // Sélectionner la source avec la meilleure qualité
  const bestSource = sources.reduce((best, current) => 
    current.quality.score > best.quality.score ? current : best
  );

  result.bestData = bestSource.data;
  result.confidence = bestSource.quality.score / 100;

  // Comparer les valeurs clés entre sources
  if (dataType === 'quote') {
    const prices = sources.map(s => s.data.c).filter(p => p && p > 0);
    if (prices.length > 1) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const variance = ((maxPrice - minPrice) / minPrice) * 100;
      
      if (variance > 5) {
        result.discrepancies.push(`Écart de prix important: ${variance.toFixed(2)}%`);
        result.confidence *= 0.8;
      } else if (variance > 1) {
        result.discrepancies.push(`Écart de prix mineur: ${variance.toFixed(2)}%`);
        result.confidence *= 0.9;
      }
    }
  }

  // Recommandations
  if (result.confidence > 0.9) {
    result.recommendations.push('Données très fiables - validation croisée réussie');
  } else if (result.confidence > 0.8) {
    result.recommendations.push('Données fiables avec quelques écarts mineurs');
  } else if (result.confidence > 0.7) {
    result.recommendations.push('Données acceptables mais avec des écarts notables');
  } else {
    result.recommendations.push('Données peu fiables - vérification manuelle recommandée');
  }

  return result;
}
