// ============================================================================
// GEMINI TOOLS API - Emma En Direct
// API intermédiaire pour exécuter les fonctions Perplexity et Yahoo Finance
// ============================================================================
//
// 🛡️  GUARDRAILS : Cette API est utilisée par le chatbot Emma
// ⚠️  Ne pas modifier sans test complet
// ============================================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { tool, params } = req.body;

    if (!tool) {
      return res.status(400).json({ error: 'Paramètre "tool" requis' });
    }

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://gobapps.com';

    switch (tool) {
      case 'searchPerplexity': {
        const { query, recency = 'day' } = params || {};
        if (!query) {
          return res.status(400).json({ error: 'Paramètre "query" requis' });
        }

        const response = await fetch(`${baseUrl}/api/ai-services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'perplexity',
            prompt: query,
            recency
          })
        });

        if (!response.ok) {
          throw new Error(`Perplexity error: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json({
          success: true,
          tool: 'searchPerplexity',
          data: {
            query,
            recency,
            content: data.content || '',
            model: data.model || 'sonar-pro'
          }
        });
      }

      case 'getYahooFinanceData': {
        const { type } = params || {};
        if (!type) {
          return res.status(400).json({ error: 'Paramètre "type" requis' });
        }

        const response = await fetch(`${baseUrl}/api/ai-services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'briefing-data',
            source: 'yahoo'
          })
        });

        if (!response.ok) {
          throw new Error(`Yahoo Finance error: ${response.status}`);
        }

        const data = await response.json();
        
        let marketData = {};
        if (type === 'asian-markets') marketData = data.asianMarkets || {};
        else if (type === 'futures') marketData = data.futures || {};
        else if (type === 'us-markets') marketData = data.usMarkets || {};
        else if (type === 'forex') marketData = data.forex || {};

        return res.status(200).json({
          success: true,
          tool: 'getYahooFinanceData',
          data: {
            type,
            marketData
          }
        });
      }

      case 'getYahooStockQuote': {
        const { symbol } = params || {};
        if (!symbol) {
          return res.status(400).json({ error: 'Paramètre "symbol" requis' });
        }

        const response = await fetch(`${baseUrl}/api/marketdata?endpoint=quote&symbol=${encodeURIComponent(symbol)}&source=yahoo`);

        if (!response.ok) {
          throw new Error(`Yahoo quote error: ${response.status}`);
        }

        const data = await response.json();

        return res.status(200).json({
          success: true,
          tool: 'getYahooStockQuote',
          data: {
            symbol,
            price: data.c ?? null,
            change: data.d ?? null,
            changePercent: data.dp ?? null,
            high: data.h ?? null,
            low: data.l ?? null,
            open: data.o ?? null,
            previousClose: data.pc ?? null,
            volume: data.v ?? null
          }
        });
      }

      default:
        return res.status(400).json({ 
          error: 'Tool non reconnu', 
          availableTools: ['searchPerplexity', 'getYahooFinanceData', 'getYahooStockQuote']
        });
    }

  } catch (error) {
    console.error('Erreur Gemini Tools:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
}

