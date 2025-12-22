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
    const { endpoint, symbols, limit, ticker, symbol, period } = req.query;
    const symbolParam = symbol || ticker;

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
    const v3Base = 'https://financialmodelingprep.com/api/v3';
    const v4Base = 'https://financialmodelingprep.com/api/v4';
    const stableBase = 'https://financialmodelingprep.com/stable';
    const fallbackPeriod = period || 'annual';
    const fallbackLimit = limit || 5;

    // Route based on endpoint type (Updated to /stable/ endpoints - Aug 2025)
    switch (endpoint) {
      case 'intraday':
        const interval = req.query.interval || '5min';
        fmpUrl = `${v3Base}/historical-chart/${interval}/${symbolParam || 'AAPL'}?apikey=${apiKey}`;
        break;
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
        const quoteSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${stableBase}/quote?symbol=${quoteSymbol}&apikey=${apiKey}`;
        break;

      case 'profile':
        const profileSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${stableBase}/profile?symbol=${profileSymbol}&apikey=${apiKey}`;
        break;

      case 'fundamentals':
        const fundSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${stableBase}/profile?symbol=${fundSymbol}&apikey=${apiKey}`;
        break;

      case 'ratios':
        // Financial ratios (P/E, P/B, ROE, ROA, debt ratios, etc.)
        const ratiosSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${v3Base}/ratios/${ratiosSymbol}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'income-statement':
        fmpUrl = `${v3Base}/income-statement/${symbolParam || 'AAPL'}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'balance-sheet-statement':
        fmpUrl = `${v3Base}/balance-sheet-statement/${symbolParam || 'AAPL'}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'cash-flow-statement':
        fmpUrl = `${v3Base}/cash-flow-statement/${symbolParam || 'AAPL'}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'key-metrics':
        // Key financial metrics (revenue, net income, P/E, market cap, etc.)
        const metricsSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${v3Base}/key-metrics/${metricsSymbol}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'ratings':
        // Company ratings snapshot
        const ratingsSymbol = symbol || ticker || 'AAPL';
        fmpUrl = `${stableBase}/ratings-snapshot?symbol=${ratingsSymbol}&apikey=${apiKey}`;
        break;

      case 'discounted-cash-flow':
      case 'dcf':
        fmpUrl = `${v3Base}/discounted-cash-flow/${symbolParam || 'AAPL'}?apikey=${apiKey}`;
        break;

      case 'stock_peers':
        fmpUrl = `${v4Base}/stock_peers?symbol=${symbolParam || 'AAPL'}&apikey=${apiKey}`;
        break;

      case 'financial-growth':
        fmpUrl = `${v3Base}/financial-growth/${symbolParam || 'AAPL'}?limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'financial-ratios':
        fmpUrl = `${v3Base}/financial-ratios/${symbolParam || 'AAPL'}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'enterprise-value':
        fmpUrl = `${v3Base}/enterprise-values/${symbolParam || 'AAPL'}?period=${fallbackPeriod}&limit=${fallbackLimit}&apikey=${apiKey}`;
        break;

      case 'analyst':
      case 'analyst-estimates':
        fmpUrl = `${v3Base}/analyst-estimates/${symbolParam || 'AAPL'}?limit=${fallbackLimit || 8}&apikey=${apiKey}`;
        break;

      case 'stock-screener':
        // Stock screener with filters
        const marketCapMoreThan = req.query.marketCapMoreThan || '0';
        const marketCapLowerThan = req.query.marketCapLowerThan || '';
        const sector = req.query.sector || '';
        const screenerLimit = req.query.limit || '100';
        
        let screenerParams = new URLSearchParams({
          marketCapMoreThan,
          limit: screenerLimit,
          apikey: apiKey
        });
        
        if (marketCapLowerThan) {
          screenerParams.append('marketCapLowerThan', marketCapLowerThan);
        }
        if (sector) {
          screenerParams.append('sector', sector);
        }
        if (req.query.exchange) {
          screenerParams.append('exchange', req.query.exchange);
        }
        
        fmpUrl = `${v3Base}/stock-screener?${screenerParams.toString()}`;
        break;

      case 'earnings':
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
      case 'calendar-earnings':
        // Alias used elsewhere in the app
        fmpUrl = `${v3Base}/earning-calendar?symbol=${symbolParam || ''}&limit=${fallbackLimit || 50}&apikey=${apiKey}`;
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
        // Generic fallback for other endpoints (keeps query params)
        const params = new URLSearchParams(req.query);
        params.delete('endpoint');
        if (symbolParam) {
          params.delete('symbol');
          params.delete('ticker');
        }
        params.set('apikey', apiKey);

        // If symbols is provided, keep it in query string rather than path
        const basePath = symbols
          ? `${v3Base}/${endpoint}`
          : `${v3Base}/${endpoint}${symbolParam ? `/${symbolParam}` : ''}`;

        const queryString = params.toString();
        fmpUrl = `${basePath}?${queryString}`;
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

      // Handle 401 Unauthorized (invalid API key)
      if (fmpResponse.status === 401 || fmpResponse.status === 403) {
        console.error(`❌ FMP API: Invalid API key`);
        return res.status(401).json({
          success: false,
          error: 'FMP API key invalid',
          message: 'La clé API FMP est invalide ou expirée',
          details: errorBody || 'Unauthorized',
          endpoint,
          fix: 'Vérifiez FMP_API_KEY dans les variables d\'environnement Vercel',
          timestamp: new Date().toISOString()
        });
      }

      // Handle 429 Rate Limit
      if (fmpResponse.status === 429) {
        console.error(`❌ FMP API: Rate limit exceeded`);
        return res.status(429).json({
          success: false,
          error: 'FMP rate limit exceeded',
          message: 'Limite de requêtes FMP atteinte',
          details: errorBody || 'Too many requests',
          endpoint,
          retryAfter: 60,
          suggestion: 'Attendez quelques secondes avant de réessayer',
          timestamp: new Date().toISOString()
        });
      }

      // Handle other HTTP errors - retourner le statut original au lieu de 500
      return res.status(fmpResponse.status).json({
        success: false,
        error: 'FMP API error',
        message: errorDetails,
        endpoint,
        status: fmpResponse.status,
        fallback: true,
        timestamp: new Date().toISOString()
      });
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
    
    // ✅ FIX: Distinguer les types d'erreurs pour codes HTTP appropriés
    let statusCode = 500;
    let errorType = 'Erreur FMP API';
    
    if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
      statusCode = 401;
      errorType = 'FMP API key invalid';
    } else if (error.message.includes('timeout') || error.message.includes('network')) {
      statusCode = 503;
      errorType = 'Service temporarily unavailable';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      statusCode = 429;
      errorType = 'Rate limit exceeded';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorType,
      message: error.message,
      endpoint: req.query.endpoint || 'unknown',
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
