// ============================================================================
// MARKET DATA API FIXED - Version corrigée
// Contourne FMP et utilise directement Yahoo Finance
// ============================================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, symbol, source = 'yahoo' } = req.query;

    // Test de santé simple pour le diagnostic
    if (!endpoint || !symbol) {
      return res.status(200).json({ 
        status: 'healthy',
        message: 'Market Data API opérationnel (version corrigée)',
        availableEndpoints: ['quote', 'fundamentals'],
        sources: ['yahoo'],
        timestamp: new Date().toISOString()
      });
    }

    if (endpoint === 'quote' || endpoint === 'fundamentals') {
      // Utiliser directement Yahoo Finance
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      
      const response = await fetch(yahooUrl);
      if (!response.ok) {
        throw new Error(`Yahoo Finance error: ${response.status}`);
      }
      
      const data = await response.json();
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      // Extraire les données
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        c: currentPrice,
        d: change,
        dp: changePercent,
        h: meta.regularMarketDayHigh,
        l: meta.regularMarketDayLow,
        o: meta.regularMarketOpen,
        pc: previousClose,
        v: meta.regularMarketVolume,
        source: 'yahoo',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      error: 'Endpoint non supporté',
      availableEndpoints: ['quote']
    });

  } catch (error) {
    console.error('Market Data API error:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
// Force redeploy Wed Oct 15 00:49:44 EDT 2025
