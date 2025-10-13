/**
 * API Synchronisation Données Historiques
 * Synchronise automatiquement les données entre APIs externes et Supabase
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { symbol, syncType = 'incremental', forceUpdate = false } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: 'Paramètre symbol requis' });
  }

  try {
    console.log(`🔄 Synchronisation ${syncType} pour ${symbol}`);

    const syncResult = await performSync(symbol, syncType, forceUpdate);

    res.status(200).json({
      success: true,
      symbol,
      syncType,
      result: syncResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    res.status(500).json({
      error: 'Erreur lors de la synchronisation',
      details: error.message
    });
  }
}

/**
 * Effectuer la synchronisation
 */
async function performSync(symbol, syncType, forceUpdate) {
  const startTime = Date.now();
  const results = {
    stock: null,
    prices: null,
    ratios: null,
    analyst: null,
    earnings: null,
    news: null,
    validation: null
  };

  try {
    // 1. Vérifier si la synchronisation est nécessaire
    if (!forceUpdate && !(await needsSync(symbol, syncType))) {
      return {
        status: 'skipped',
        reason: 'Données déjà à jour',
        duration: Date.now() - startTime
      };
    }

    // 2. Synchroniser les données de base du titre
    if (syncType === 'full' || syncType === 'incremental') {
      results.stock = await syncStockData(symbol);
    }

    // 3. Synchroniser les prix
    if (syncType === 'full' || syncType === 'incremental') {
      results.prices = await syncPriceData(symbol, syncType);
    }

    // 4. Synchroniser les ratios financiers
    if (syncType === 'full' || syncType === 'ratios') {
      results.ratios = await syncRatiosData(symbol);
    }

    // 5. Synchroniser les recommandations d'analystes
    if (syncType === 'full' || syncType === 'analyst') {
      results.analyst = await syncAnalystData(symbol);
    }

    // 6. Synchroniser le calendrier des résultats
    if (syncType === 'full' || syncType === 'earnings') {
      results.earnings = await syncEarningsData(symbol);
    }

    // 7. Synchroniser les actualités
    if (syncType === 'full' || syncType === 'news') {
      results.news = await syncNewsData(symbol);
    }

    // 8. Enregistrer les métriques de validation
    results.validation = await recordValidationMetrics(symbol, results);

    // 9. Enregistrer le log de synchronisation
    await recordSyncLog(symbol, syncType, 'success', results, Date.now() - startTime);

    return {
      status: 'success',
      results,
      duration: Date.now() - startTime
    };

  } catch (error) {
    // Enregistrer l'erreur dans le log
    await recordSyncLog(symbol, syncType, 'error', { error: error.message }, Date.now() - startTime);
    throw error;
  }
}

/**
 * Vérifier si la synchronisation est nécessaire
 */
async function needsSync(symbol, syncType) {
  try {
    // Vérifier la dernière synchronisation
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=validation&limit=1`);
    
    if (!response.ok) {
      return true; // Si pas de données, synchroniser
    }

    const data = await response.json();
    const lastSync = data.data?.[0];

    if (!lastSync) {
      return true; // Première synchronisation
    }

    const lastSyncDate = new Date(lastSync.date);
    const now = new Date();
    const hoursSinceSync = (now - lastSyncDate) / (1000 * 60 * 60);

    // Synchroniser si plus de 24h pour incremental, 1h pour full
    const threshold = syncType === 'full' ? 1 : 24;
    return hoursSinceSync > threshold;

  } catch (error) {
    console.error('❌ Erreur vérification sync:', error);
    return true; // En cas d'erreur, synchroniser
  }
}

/**
 * Synchroniser les données de base du titre
 */
async function syncStockData(symbol) {
  try {
    // Récupérer depuis l'API de validation
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/data-validation?symbol=${symbol}&dataType=profile`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération profil: ${response.status}`);
    }

    const validationData = await response.json();
    const profile = validationData.finalData;

    if (!profile) {
      throw new Error('Aucune donnée de profil disponible');
    }

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profile.companyName || profile.name,
        sector: profile.sector,
        industry: profile.industry,
        country: profile.country,
        exchange: profile.exchange,
        market_cap: profile.marketCapitalization,
        shares_outstanding: profile.sharesOutstanding,
        website: profile.website,
        description: profile.description
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde profil: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      confidence: validationData.validation?.confidence || 0
    };

  } catch (error) {
    console.error('❌ Erreur sync stock:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Synchroniser les données de prix
 */
async function syncPriceData(symbol, syncType) {
  try {
    // Récupérer les données de prix récentes
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/fmp?endpoint=historical-chart&symbol=${symbol}&timeframe=1day&limit=30`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération prix: ${response.status}`);
    }

    const priceData = await response.json();
    
    if (!Array.isArray(priceData) || priceData.length === 0) {
      throw new Error('Aucune donnée de prix disponible');
    }

    // Formater les données
    const formattedData = priceData.map(price => ({
      date: price.date,
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
      adjusted_close: price.close // Approximation
    }));

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde prix: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      dateRange: {
        from: formattedData[formattedData.length - 1]?.date,
        to: formattedData[0]?.date
      }
    };

  } catch (error) {
    console.error('❌ Erreur sync prices:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Synchroniser les ratios financiers
 */
async function syncRatiosData(symbol) {
  try {
    // Récupérer depuis l'API des ratios
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/financial-ratios?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération ratios: ${response.status}`);
    }

    const ratiosData = await response.json();
    const ratios = ratiosData.ratios;

    if (!ratios) {
      throw new Error('Aucune donnée de ratios disponible');
    }

    // Formater les données
    const formattedData = [{
      date: new Date().toISOString().split('T')[0],
      pe_ratio: ratios.valuation?.peRatio,
      pb_ratio: ratios.valuation?.pbRatio,
      ps_ratio: ratios.valuation?.psRatio,
      peg_ratio: ratios.valuation?.pegRatio,
      price_to_cash_flow: ratios.valuation?.priceToCashFlowRatio,
      price_to_free_cash_flow: ratios.valuation?.priceToFreeCashFlowRatio,
      enterprise_value_multiple: ratios.valuation?.enterpriseValueMultiple,
      return_on_equity: ratios.profitability?.returnOnEquity,
      return_on_assets: ratios.profitability?.returnOnAssets,
      return_on_capital_employed: ratios.profitability?.returnOnCapitalEmployed,
      gross_profit_margin: ratios.profitability?.grossProfitMargin,
      operating_profit_margin: ratios.profitability?.operatingIncomeMargin,
      net_profit_margin: ratios.profitability?.netProfitMargin,
      current_ratio: ratios.liquidity?.currentRatio,
      quick_ratio: ratios.liquidity?.quickRatio,
      cash_ratio: ratios.liquidity?.cashRatio,
      debt_equity_ratio: ratios.debt?.debtEquityRatio,
      debt_ratio: ratios.debt?.debtRatio,
      interest_coverage: ratios.debt?.interestCoverage,
      dividend_yield: ratios.debt?.dividendYield,
      payout_ratio: ratios.debt?.payoutRatio
    }];

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=ratios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde ratios: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      confidence: ratiosData.validation?.confidence || 0,
      quality: ratiosData.metadata?.dataQuality || 'Unknown'
    };

  } catch (error) {
    console.error('❌ Erreur sync ratios:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Synchroniser les recommandations d'analystes
 */
async function syncAnalystData(symbol) {
  try {
    // Récupérer depuis l'API des recommandations
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/analyst-recommendations?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération analystes: ${response.status}`);
    }

    const analystData = await response.json();
    const consensus = analystData.consensus;

    if (!consensus) {
      throw new Error('Aucune donnée d\'analystes disponible');
    }

    // Formater les données
    const formattedData = [{
      date: new Date().toISOString().split('T')[0],
      consensus_rating: consensus.rating,
      target_price: consensus.targetPrice,
      upside_percentage: consensus.upside,
      analyst_count: consensus.analystCount,
      strong_buy: analystData.breakdown?.strongBuy || 0,
      buy: analystData.breakdown?.buy || 0,
      hold: analystData.breakdown?.hold || 0,
      sell: analystData.breakdown?.sell || 0,
      strong_sell: analystData.breakdown?.strongSell || 0,
      price_target_high: analystData.priceTargets?.high,
      price_target_low: analystData.priceTargets?.low,
      price_target_median: analystData.priceTargets?.median,
      price_target_average: analystData.priceTargets?.average
    }];

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=analyst`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde analystes: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      confidence: analystData.validation?.confidence || 0,
      consensus: consensus.rating
    };

  } catch (error) {
    console.error('❌ Erreur sync analyst:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Synchroniser le calendrier des résultats
 */
async function syncEarningsData(symbol) {
  try {
    // Récupérer depuis l'API du calendrier
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/earnings-calendar?symbol=${symbol}&limit=10`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération résultats: ${response.status}`);
    }

    const earningsData = await response.json();
    const historical = earningsData.historical || [];
    const upcoming = earningsData.upcoming || [];

    if (historical.length === 0 && upcoming.length === 0) {
      throw new Error('Aucune donnée de résultats disponible');
    }

    // Formater les données
    const formattedData = [
      ...historical.map(earning => ({
        date: earning.date,
        period: earning.period,
        year: earning.year,
        eps_actual: earning.eps,
        eps_estimated: earning.epsEstimated,
        eps_surprise: earning.epsSurprise,
        revenue_actual: earning.revenue,
        revenue_estimated: earning.revenueEstimated,
        revenue_surprise: earning.revenueSurprise,
        is_upcoming: false
      })),
      ...upcoming.map(earning => ({
        date: earning.date,
        period: earning.period,
        year: earning.year,
        eps_actual: null,
        eps_estimated: earning.epsEstimated,
        eps_surprise: null,
        revenue_actual: null,
        revenue_estimated: earning.revenueEstimated,
        revenue_surprise: null,
        is_upcoming: true
      }))
    ];

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=earnings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde résultats: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      historical: historical.length,
      upcoming: upcoming.length,
      confidence: earningsData.validation?.confidence || 0
    };

  } catch (error) {
    console.error('❌ Erreur sync earnings:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Synchroniser les actualités
 */
async function syncNewsData(symbol) {
  try {
    // Récupérer depuis l'API des actualités
    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/marketaux?endpoint=ticker-sentiment&symbol=${symbol}&limit=20`);
    
    if (!response.ok) {
      throw new Error(`Erreur récupération actualités: ${response.status}`);
    }

    const newsData = await response.json();
    const articles = newsData.news || [];

    if (articles.length === 0) {
      throw new Error('Aucune actualité disponible');
    }

    // Formater les données
    const formattedData = articles.map(article => ({
      title: article.title,
      content: article.content,
      url: article.url,
      source: article.source?.name || 'Marketaux',
      published_at: article.publishedAt,
      sentiment: article.sentiment || 'neutral',
      sentiment_score: article.sentimentScore || 0
    }));

    // Sauvegarder dans Supabase
    const saveResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData)
    });

    if (!saveResponse.ok) {
      throw new Error(`Erreur sauvegarde actualités: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    return {
      status: 'success',
      records: result.records?.length || 0,
      articles: articles.length,
      sentiment: newsData.sentimentAnalysis?.overallSentiment || 'neutral'
    };

  } catch (error) {
    console.error('❌ Erreur sync news:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Enregistrer les métriques de validation
 */
async function recordValidationMetrics(symbol, results) {
  try {
    const validationData = {
      date: new Date().toISOString().split('T')[0],
      data_type: 'sync_complete',
      confidence_score: calculateOverallConfidence(results),
      validation_status: 'validated',
      sources: ['FMP', 'Yahoo', 'Finnhub', 'Marketaux'],
      discrepancies: [],
      data_quality: calculateOverallQuality(results)
    };

    const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/historical-data?symbol=${symbol}&dataType=validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([validationData])
    });

    if (!response.ok) {
      throw new Error(`Erreur sauvegarde validation: ${response.status}`);
    }

    return { status: 'success', confidence: validationData.confidence_score };

  } catch (error) {
    console.error('❌ Erreur validation metrics:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Enregistrer le log de synchronisation
 */
async function recordSyncLog(symbol, syncType, status, results, duration) {
  try {
    const logData = {
      symbol,
      data_type: 'sync',
      sync_type: syncType,
      status,
      records_processed: Object.values(results).filter(r => r?.records).reduce((sum, r) => sum + (r.records || 0), 0),
      records_updated: 0, // Calculé par Supabase
      records_inserted: 0, // Calculé par Supabase
      error_message: status === 'error' ? results.error : null,
      started_at: new Date(Date.now() - duration).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: duration
    };

    // Note: Cette fonction nécessiterait une table sync_log dans Supabase
    // Pour l'instant, on log juste dans la console
    console.log('📊 Sync Log:', logData);

    return { status: 'logged' };

  } catch (error) {
    console.error('❌ Erreur sync log:', error);
    return { status: 'error', error: error.message };
  }
}

/**
 * Calculer la confiance globale
 */
function calculateOverallConfidence(results) {
  const confidences = Object.values(results)
    .filter(r => r?.confidence !== undefined)
    .map(r => r.confidence);
  
  if (confidences.length === 0) return 0.5;
  
  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}

/**
 * Calculer la qualité globale
 */
function calculateOverallQuality(results) {
  const qualities = Object.values(results)
    .filter(r => r?.quality !== undefined)
    .map(r => r.quality);
  
  if (qualities.length === 0) return 'C';
  
  // Logique simple pour déterminer la qualité globale
  if (qualities.every(q => q === 'A')) return 'A';
  if (qualities.some(q => q === 'A') && qualities.every(q => ['A', 'B'].includes(q))) return 'B';
  if (qualities.some(q => q === 'B') && qualities.every(q => ['A', 'B', 'C'].includes(q))) return 'C';
  return 'D';
}
