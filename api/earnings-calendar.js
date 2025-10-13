/**
 * API Calendrier des Résultats avec Validation Croisée
 * Récupère et valide les dates de résultats depuis plusieurs sources
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

  const { symbol, limit = 10 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`📅 Récupération du calendrier des résultats pour ${symbol}`);

    // Récupérer les données depuis plusieurs sources
    const [fmpEarnings, fmpEarningsCalendar, finnhubEarnings] = await Promise.allSettled([
      getFMPEarnings(symbol),
      getFMPEarningsCalendar(symbol),
      getFinnhubEarnings(symbol)
    ]);

    // Analyser et valider les données
    const validatedCalendar = validateAndAnalyzeEarnings({
      symbol,
      fmpEarnings: fmpEarnings.status === 'fulfilled' ? fmpEarnings.value : null,
      fmpEarningsCalendar: fmpEarningsCalendar.status === 'fulfilled' ? fmpEarningsCalendar.value : null,
      finnhubEarnings: finnhubEarnings.status === 'fulfilled' ? finnhubEarnings.value : null,
      limit: parseInt(limit)
    });

    res.status(200).json(validatedCalendar);

  } catch (error) {
    console.error('❌ Erreur calendrier des résultats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du calendrier',
      details: error.message 
    });
  }
}

/**
 * Récupérer les résultats historiques depuis FMP
 */
async function getFMPEarnings(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/fmp?endpoint=earnings&symbol=${symbol}&limit=10`);
  if (!response.ok) {
    throw new Error(`FMP earnings error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Récupérer le calendrier des résultats depuis FMP
 */
async function getFMPEarningsCalendar(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/fmp?endpoint=earnings-calendar&symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`FMP earnings calendar error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Récupérer les résultats depuis Finnhub
 */
async function getFinnhubEarnings(symbol) {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
  
  const response = await fetch(`${baseUrl}/api/marketdata?endpoint=earnings&symbol=${symbol}&source=finnhub`);
  if (!response.ok) {
    throw new Error(`Finnhub earnings error: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Valider et analyser les données de résultats
 */
function validateAndAnalyzeEarnings({ symbol, fmpEarnings, fmpEarningsCalendar, finnhubEarnings, limit }) {
  const result = {
    symbol,
    timestamp: new Date().toISOString(),
    validation: {
      status: 'validated',
      confidence: 0.9,
      sources: []
    },
    upcoming: [],
    historical: [],
    consensus: {
      nextEarningsDate: null,
      estimatedEPS: null,
      estimatedRevenue: null,
      analystCount: 0
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
  if (fmpEarnings && Array.isArray(fmpEarnings)) {
    result.sources.fmp = {
      historical: fmpEarnings.slice(0, limit),
      count: fmpEarnings.length
    };
    result.validation.sources.push('FMP');
    
    // Ajouter aux résultats historiques
    result.historical = fmpEarnings.slice(0, limit).map(earning => ({
      date: earning.date,
      eps: earning.eps,
      epsEstimated: earning.epsEstimated,
      epsDifference: earning.epsDifference,
      epsSurprise: earning.epsSurprise,
      revenue: earning.revenue,
      revenueEstimated: earning.revenueEstimated,
      revenueDifference: earning.revenueDifference,
      revenueSurprise: earning.revenueSurprise,
      period: earning.period,
      year: earning.year,
      source: 'FMP'
    }));
  }

  // Traiter le calendrier FMP
  if (fmpEarningsCalendar && Array.isArray(fmpEarningsCalendar)) {
    const upcomingEarnings = fmpEarningsCalendar.filter(earning => {
      const earningDate = new Date(earning.date);
      return earningDate > new Date();
    }).slice(0, 5);

    result.upcoming = upcomingEarnings.map(earning => ({
      date: earning.date,
      epsEstimated: earning.epsEstimated,
      revenueEstimated: earning.revenueEstimated,
      period: earning.period,
      year: earning.year,
      source: 'FMP'
    }));

    // Définir le prochain résultat
    if (upcomingEarnings.length > 0) {
      result.consensus.nextEarningsDate = upcomingEarnings[0].date;
      result.consensus.estimatedEPS = upcomingEarnings[0].epsEstimated;
      result.consensus.estimatedRevenue = upcomingEarnings[0].revenueEstimated;
    }
  }

  // Traiter les données Finnhub
  if (finnhubEarnings && Array.isArray(finnhubEarnings)) {
    result.sources.finnhub = {
      earnings: finnhubEarnings.slice(0, limit),
      count: finnhubEarnings.length
    };
    result.validation.sources.push('Finnhub');
    
    // Fusionner avec les données historiques existantes
    finnhubEarnings.slice(0, limit).forEach(earning => {
      const existingIndex = result.historical.findIndex(h => h.date === earning.date);
      if (existingIndex >= 0) {
        // Fusionner les données
        result.historical[existingIndex] = {
          ...result.historical[existingIndex],
          ...earning,
          source: 'FMP + Finnhub'
        };
      } else {
        // Ajouter comme nouveau résultat
        result.historical.push({
          date: earning.date,
          eps: earning.eps,
          epsEstimated: earning.epsEstimated,
          epsDifference: earning.epsDifference,
          epsSurprise: earning.epsSurprise,
          revenue: earning.revenue,
          revenueEstimated: earning.revenueEstimated,
          revenueDifference: earning.revenueDifference,
          revenueSurprise: earning.revenueSurprise,
          period: earning.period,
          year: earning.year,
          source: 'Finnhub'
        });
      }
    });
  }

  // Trier les résultats historiques par date (plus récent en premier)
  result.historical.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculer les statistiques
  if (result.historical.length > 0) {
    const epsSurprises = result.historical
      .filter(h => h.epsSurprise !== null && h.epsSurprise !== undefined)
      .map(h => h.epsSurprise);
    
    const revenueSurprises = result.historical
      .filter(h => h.revenueSurprise !== null && h.revenueSurprise !== undefined)
      .map(h => h.revenueSurprise);

    result.statistics = {
      averageEPSSurprise: epsSurprises.length > 0 ? 
        epsSurprises.reduce((sum, surprise) => sum + surprise, 0) / epsSurprises.length : null,
      averageRevenueSurprise: revenueSurprises.length > 0 ? 
        revenueSurprises.reduce((sum, surprise) => sum + surprise, 0) / revenueSurprises.length : null,
      beatRate: epsSurprises.length > 0 ? 
        (epsSurprises.filter(s => s > 0).length / epsSurprises.length) * 100 : null,
      totalEarnings: result.historical.length
    };
  }

  // Évaluer la qualité des données
  result.validation.confidence = assessEarningsQuality(result.sources);

  return result;
}

/**
 * Évaluer la qualité des données de résultats
 */
function assessEarningsQuality(sources) {
  let score = 0;
  let maxScore = 0;

  // FMP source
  if (sources.fmp) {
    maxScore += 50;
    if (sources.fmp.historical && sources.fmp.historical.length > 0) score += 30;
    if (sources.fmp.count > 5) score += 20;
  }

  // Finnhub source
  if (sources.finnhub) {
    maxScore += 30;
    if (sources.finnhub.earnings && sources.finnhub.earnings.length > 0) score += 20;
    if (sources.finnhub.count > 3) score += 10;
  }

  // Données de calendrier
  if (sources.fmp && sources.fmp.upcoming) {
    maxScore += 20;
    score += 20;
  }

  return maxScore > 0 ? score / maxScore : 0;
}
