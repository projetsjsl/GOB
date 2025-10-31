/**
 * FMP API Proxy - Handles requests to Financial Modeling Prep API
 * Supports: news, quote, fundamentals, and other endpoints
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const apiKey = process.env.FMP_API_KEY;
    const { endpoint, symbols, limit, ticker, symbol } = req.query;

    // Health check if no endpoint specified
    if (!endpoint) {
      return res.status(200).json({
        status: 'healthy',
        message: 'FMP API opérationnel',
        apiKey: apiKey ? 'Configurée' : 'Manquante',
        timestamp: new Date().toISOString()
      });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'FMP API key not configured',
        fallback: true
      });
    }

    let fmpUrl;

    // Route based on endpoint type (Updated to /stable/ endpoints - Aug 2025)
    switch (endpoint) {
      case 'news':
        // General market news (latest)
        const limitParam = limit || 50;
        const pageParam = req.query.page || 0;
        fmpUrl = `https://financialmodelingprep.com/stable/news/general-latest?page=${pageParam}&limit=${limitParam}&apikey=${apiKey}`;
        break;

      case 'ticker-news':
        // Specific ticker news
        const tickerSymbols = symbols || ticker || symbol || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${tickerSymbols}&apikey=${apiKey}`;
        break;

      case 'quote':
        // Support both single and batch quotes (comma-separated symbols)
        const quoteSymbol = symbol || ticker || symbols || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/quote?symbol=${quoteSymbol}&apikey=${apiKey}`;
        break;

      case 'batch-quotes':
        // Optimized batch quotes endpoint
        const batchSymbols = symbols || 'AAPL,MSFT,GOOGL';
        // FMP allows up to 100 symbols per batch request
        fmpUrl = `https://financialmodelingprep.com/stable/quote?symbol=${batchSymbols}&apikey=${apiKey}`;
        break;

      case 'profile':
        const profileSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/profile?symbol=${profileSymbol}&apikey=${apiKey}`;
        break;

      case 'fundamentals':
        const fundSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/profile?symbol=${fundSymbol}&apikey=${apiKey}`;
        break;

      case 'ratios':
        // Financial ratios (P/E, P/B, ROE, ROA, debt ratios, etc.)
        const ratiosSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/ratios?symbol=${ratiosSymbol}&apikey=${apiKey}`;
        break;

      case 'key-metrics':
        // Key financial metrics (revenue, net income, P/E, market cap, etc.)
        const metricsSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/key-metrics?symbol=${metricsSymbol}&apikey=${apiKey}`;
        break;

      case 'ratings':
        // Company ratings snapshot
        const ratingsSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/stable/ratings-snapshot?symbol=${ratingsSymbol}&apikey=${apiKey}`;
        break;

      case 'earnings-calendar':
        // Upcoming and past earnings announcements
        // Optional: from/to date range, or specific symbol
        const earningsSymbol = symbol || ticker;
        const from = req.query.from;
        const to = req.query.to;

        if (earningsSymbol) {
          fmpUrl = `https://financialmodelingprep.com/stable/earnings-calendar?symbol=${earningsSymbol}&apikey=${apiKey}`;
        } else if (from && to) {
          fmpUrl = `https://financialmodelingprep.com/stable/earnings-calendar?from=${from}&to=${to}&apikey=${apiKey}`;
        } else {
          // Default: get upcoming earnings (no date filter)
          fmpUrl = `https://financialmodelingprep.com/stable/earnings-calendar?apikey=${apiKey}`;
        }
        break;

      case 'economic-calendar':
        // Economic data releases (GDP, CPI, unemployment, etc.)
        const econFrom = req.query.from;
        const econTo = req.query.to;

        if (econFrom && econTo) {
          fmpUrl = `https://financialmodelingprep.com/stable/economic-calendar?from=${econFrom}&to=${econTo}&apikey=${apiKey}`;
        } else {
          // Default: get upcoming economic events
          fmpUrl = `https://financialmodelingprep.com/stable/economic-calendar?apikey=${apiKey}`;
        }
        break;

      default:
        return res.status(400).json({
          error: 'Invalid endpoint',
          supported: ['news', 'ticker-news', 'quote', 'batch-quotes', 'profile', 'fundamentals', 'ratios', 'key-metrics', 'ratings', 'earnings-calendar', 'economic-calendar']
        });
    }

    console.log(`🔗 FMP API call: ${endpoint} - ${fmpUrl.split('?')[0]}`);

    // Fetch from FMP with proper headers (User-Agent required to avoid 403)
    const fmpResponse = await fetch(fmpUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GOB-Financial-Dashboard/1.0',
        'Accept-Encoding': 'gzip, deflate'
      }
    });

    if (!fmpResponse.ok) {
      // Try to get error details from FMP response
      let errorDetails = `${fmpResponse.status} ${fmpResponse.statusText}`;
      let errorBody = '';
      try {
        errorBody = await fmpResponse.text();
        console.error(`❌ FMP Error Response: ${errorBody}`);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // Ignore parse error
      }

      // Handle 402 Payment Required specifically
      if (fmpResponse.status === 402) {
        console.error(`❌ FMP API: Endpoint ${endpoint} requires a paid subscription`);
        return res.status(402).json({
          success: false,
          error: 'FMP API endpoint restricted',
          message: `This endpoint (${endpoint}) is not available under your current FMP subscription.`,
          details: errorBody || 'Upgrade required',
          endpoint,
          upgradeUrl: 'https://financialmodelingprep.com/developer/docs/pricing',
          fallback: true,
          timestamp: new Date().toISOString()
        });
      }

      // Handle other HTTP errors
      throw new Error(`FMP API error: ${errorDetails}`);
    }

    const data = await fmpResponse.json();

    console.log(`✅ FMP API success: ${endpoint} - ${Array.isArray(data) ? data.length : 'object'} items`);

    // Return data with metadata
    return res.status(200).json({
      success: true,
      endpoint,
      data: endpoint === 'news' || endpoint === 'ticker-news' ? data : data,
      news: endpoint === 'news' || endpoint === 'ticker-news' ? data : undefined, // Compatibility
      count: Array.isArray(data) ? data.length : undefined,
      source: 'fmp',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ FMP API Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erreur FMP API',
      message: error.message,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
