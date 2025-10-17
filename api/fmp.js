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

    // Route based on endpoint type
    switch (endpoint) {
      case 'news':
        // Stock news - general market news
        const symbolsParam = symbols || ticker || symbol || 'AAPL,MSFT,GOOGL,AMZN,TSLA';
        const limitParam = limit || 50;
        // FMP general news endpoint (no tickers param needed for general market news)
        fmpUrl = `https://financialmodelingprep.com/api/v3/stock_news?limit=${limitParam}&apikey=${apiKey}`;
        break;

      case 'ticker-news':
        // Specific ticker news
        const tickerSymbols = symbols || ticker || symbol || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/api/v4/stock_news?tickers=${tickerSymbols}&limit=${limit || 50}&apikey=${apiKey}`;
        break;

      case 'quote':
        const quoteSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/api/v3/quote/${quoteSymbol}?apikey=${apiKey}`;
        break;

      case 'profile':
        const profileSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/api/v3/profile/${profileSymbol}?apikey=${apiKey}`;
        break;

      case 'fundamentals':
        const fundSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `https://financialmodelingprep.com/api/v3/profile/${fundSymbol}?apikey=${apiKey}`;
        break;

      default:
        return res.status(400).json({
          error: 'Invalid endpoint',
          supported: ['news', 'ticker-news', 'quote', 'profile', 'fundamentals']
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
      try {
        const errorBody = await fmpResponse.text();
        console.error(`❌ FMP Error Response: ${errorBody}`);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // Ignore parse error
      }
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
