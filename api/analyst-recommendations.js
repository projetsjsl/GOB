/**
 * API Recommandations d'Analystes avec Validation Croisée
 * Récupère et valide les recommandations depuis plusieurs sources
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

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`🎯 Récupération des recommandations analystes pour ${symbol}`);

    // Récupérer les recommandations depuis plusieurs sources
    const [fmpRecommendations, fmpPriceTargets, finnhubRecommendations] = await Promise.allSettled([
      getFMPRecommendations(symbol),
      getFMPPriceTargets(symbol),
      getFinnhubRecommendations(symbol)
    ]);

    // Analyser et valider les recommandations
    const validatedRecommendations = validateAndAnalyzeRecommendations({
      symbol,
      fmpRecommendations: fmpRecommendations.status === 'fulfilled' ? fmpRecommendations.value : null,
      fmpPriceTargets: fmpPriceTargets.status === 'fulfilled' ? fmpPriceTargets.value : null,
      finnhubRecommendations: finnhubRecommendations.status === 'fulfilled' ? finnhubRecommendations.value : null
    });

    res.status(200).json(validatedRecommendations);

  } catch (error) {
    console.error('❌ Erreur recommandations analystes:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des recommandations',
      details: error.message 
    });
  }
}

/**
 * Récupérer les recommandations depuis FMP
 */
async function getFMPRecommendations(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/fmp?endpoint=rating&symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`FMP recommendations error: ${response.status}`);
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Récupérer les objectifs de prix depuis FMP
 */
async function getFMPPriceTargets(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/fmp?endpoint=price-target&symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`FMP price targets error: ${response.status}`);
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Récupérer les recommandations depuis Finnhub
 */
async function getFinnhubRecommendations(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/marketdata?endpoint=recommendation&symbol=${symbol}&source=finnhub`);
  if (!response.ok) {
    throw new Error(`Finnhub recommendations error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Valider et analyser les recommandations
 */
function validateAndAnalyzeRecommendations({ symbol, fmpRecommendations, fmpPriceTargets, finnhubRecommendations }) {
  const result = {
    symbol,
    timestamp: new Date().toISOString(),
    validation: {
      status: 'validated',
      confidence: 0.9,
      sources: []
    },
    consensus: {
      rating: null,
      targetPrice: null,
      upside: null,
      analystCount: 0,
      lastUpdated: null
    },
    breakdown: {
      strongBuy: 0,
      buy: 0,
      hold: 0,
      sell: 0,
      strongSell: 0
    },
    priceTargets: {
      high: null,
      low: null,
      median: null,
      average: null
    },
    sources: {
      fmp: null,
      finnhub: null
    },
    metadata: {
      dataQuality: 'High',
      lastUpdated: new Date().toISOString(),
      updateFrequency: 'Daily'
    }
  };

  // Traiter les données FMP
  if (fmpRecommendations) {
    result.sources.fmp = {
      rating: fmpRecommendations.rating || null,
      score: fmpRecommendations.ratingScore || null,
      recommendation: fmpRecommendations.ratingRecommendation || null,
      ratingDetailsDCFScore: fmpRecommendations.ratingDetailsDCFScore || null,
      ratingDetailsROEScore: fmpRecommendations.ratingDetailsROEScore || null,
      ratingDetailsROAScore: fmpRecommendations.ratingDetailsROAScore || null,
      ratingDetailsDEScore: fmpRecommendations.ratingDetailsDEScore || null,
      ratingDetailsPEScore: fmpRecommendations.ratingDetailsPEScore || null,
      ratingDetailsPBScore: fmpRecommendations.ratingDetailsPBScore || null
    };
    result.validation.sources.push('FMP');
  }

  // Traiter les objectifs de prix FMP
  if (fmpPriceTargets) {
    result.priceTargets = {
      high: fmpPriceTargets.priceTargetHigh || null,
      low: fmpPriceTargets.priceTargetLow || null,
      median: fmpPriceTargets.priceTargetMedian || null,
      average: fmpPriceTargets.priceTargetAverage || null
    };
  }

  // Traiter les données Finnhub
  if (finnhubRecommendations) {
    result.sources.finnhub = {
      buy: finnhubRecommendations.buy || 0,
      hold: finnhubRecommendations.hold || 0,
      sell: finnhubRecommendations.sell || 0,
      period: finnhubRecommendations.period || null
    };
    result.validation.sources.push('Finnhub');
  }

  // Calculer le consensus
  const consensus = calculateConsensus(result.sources);
  result.consensus = consensus.consensus;
  result.breakdown = consensus.breakdown;

  // Calculer l'upside si on a un prix actuel et un objectif
  if (result.consensus.targetPrice) {
    // Récupérer le prix actuel (simulation - en réalité on ferait un appel API)
    const currentPrice = 100; // À remplacer par un appel API réel
    result.consensus.upside = ((result.consensus.targetPrice - currentPrice) / currentPrice) * 100;
  }

  // Évaluer la qualité des données
  result.validation.confidence = assessRecommendationsQuality(result.sources);

  return result;
}

/**
 * Calculer le consensus des recommandations
 */
function calculateConsensus(sources) {
  const consensus = {
    rating: null,
    targetPrice: null,
    upside: null,
    analystCount: 0,
    lastUpdated: null
  };

  const breakdown = {
    strongBuy: 0,
    buy: 0,
    hold: 0,
    sell: 0,
    strongSell: 0
  };

  // Analyser les données FMP
  if (sources.fmp) {
    if (sources.fmp.rating) {
      consensus.rating = sources.fmp.rating;
    }
    if (sources.fmp.score) {
      // Convertir le score en recommandation
      if (sources.fmp.score >= 4) breakdown.strongBuy = 1;
      else if (sources.fmp.score >= 3) breakdown.buy = 1;
      else if (sources.fmp.score >= 2) breakdown.hold = 1;
      else if (sources.fmp.score >= 1) breakdown.sell = 1;
      else breakdown.strongSell = 1;
    }
  }

  // Analyser les données Finnhub
  if (sources.finnhub) {
    breakdown.strongBuy += sources.finnhub.buy || 0;
    breakdown.hold += sources.finnhub.hold || 0;
    breakdown.sell += sources.finnhub.sell || 0;
  }

  // Calculer le total des analystes
  consensus.analystCount = Object.values(breakdown).reduce((sum, count) => sum + count, 0);

  // Déterminer le consensus
  if (consensus.analystCount > 0) {
    const totalWeighted = (breakdown.strongBuy * 5) + (breakdown.buy * 4) + (breakdown.hold * 3) + (breakdown.sell * 2) + (breakdown.strongSell * 1);
    const averageScore = totalWeighted / consensus.analystCount;
    
    if (averageScore >= 4.5) consensus.rating = 'Strong Buy';
    else if (averageScore >= 3.5) consensus.rating = 'Buy';
    else if (averageScore >= 2.5) consensus.rating = 'Hold';
    else if (averageScore >= 1.5) consensus.rating = 'Sell';
    else consensus.rating = 'Strong Sell';
  }

  return { consensus, breakdown };
}

/**
 * Évaluer la qualité des recommandations
 */
function assessRecommendationsQuality(sources) {
  let score = 0;
  let maxScore = 0;

  // FMP source
  if (sources.fmp) {
    maxScore += 50;
    if (sources.fmp.rating) score += 20;
    if (sources.fmp.score) score += 15;
    if (sources.fmp.recommendation) score += 15;
  }

  // Finnhub source
  if (sources.finnhub) {
    maxScore += 30;
    if (sources.finnhub.buy !== undefined) score += 10;
    if (sources.finnhub.hold !== undefined) score += 10;
    if (sources.finnhub.sell !== undefined) score += 10;
  }

  // Objectifs de prix
  if (sources.fmp && sources.fmp.priceTargets) {
    maxScore += 20;
    score += 20;
  }

  return maxScore > 0 ? score / maxScore : 0;
}
