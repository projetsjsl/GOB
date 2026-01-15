/**
 * Finnhub API Proxy - Handles requests to Finnhub API
 * Supports: quote, news, company-news, and other endpoints
 * Documentation: https://finnhub.io/docs/api
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode non autorisee' });
  }

  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    const { endpoint, symbol, from, to } = req.query;

    // Health check if no endpoint specified
    if (!endpoint) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Finnhub API operationnel',
        apiKey: apiKey ? 'Configuree' : 'Manquante',
        timestamp: new Date().toISOString(),
        availableEndpoints: ['quote', 'news', 'market-news', 'company-news', 'basic-financials', 'profile'],
        documentation: 'https://finnhub.io/docs/api'
      });
    }

    // Check for required parameters
    if (!symbol && (endpoint === 'quote' || endpoint === 'company-news' || endpoint === 'basic-financials')) {
      return res.status(400).json({
        error: 'Missing required parameter: symbol',
        message: `Le parametre "symbol" est requis pour l'endpoint ${endpoint}`,
        example: `/api/finnhub?endpoint=${endpoint}&symbol=AAPL`
      });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'Finnhub API key not configured',
        message: 'Configurez FINNHUB_API_KEY dans les variables d\'environnement Vercel',
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }

    let finnhubUrl;

    // Route based on endpoint type
    switch (endpoint) {
      case 'quote':
        // Real-time quote
        finnhubUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        break;

      case 'news':
      case 'market-news':
        // General market news (support both 'news' and 'market-news' for backward compatibility)
        const category = req.query.category || 'general';
        finnhubUrl = `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`;
        break;

      case 'company-news':
        // Company-specific news
        const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const toDate = to || new Date().toISOString().split('T')[0];
        finnhubUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
        break;

      case 'basic-financials':
        // Basic financials (P/E, P/B, etc.)
        const metric = req.query.metric || 'all';
        finnhubUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=${metric}&token=${apiKey}`;
        break;

      case 'profile':
        // Company profile
        finnhubUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
        break;

      default:
        return res.status(400).json({
          error: 'Invalid endpoint',
          supported: ['quote', 'news', 'market-news', 'company-news', 'basic-financials', 'profile'],
          message: `L'endpoint "${endpoint}" n'est pas supporte`,
          example: '/api/finnhub?endpoint=quote&symbol=AAPL'
        });
    }

    console.log(` Finnhub API call: ${endpoint} - ${symbol || 'N/A'}`);

    // Fetch from Finnhub with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const finnhubResponse = await fetch(finnhubUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GOB-Financial-Dashboard/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!finnhubResponse.ok) {
      // Try to get error details from Finnhub response
      let errorDetails = `${finnhubResponse.status} ${finnhubResponse.statusText}`;
      let errorBody = '';

      try {
        errorBody = await finnhubResponse.text();
        console.error(` Finnhub Error Response: ${errorBody}`);
        errorDetails += ` - ${errorBody}`;
      } catch (e) {
        // Ignore parse error
      }

      // Handle 401 Unauthorized (invalid API key)
      if (finnhubResponse.status === 401) {
        console.error(` Finnhub API: Invalid API key`);
        return res.status(401).json({
          success: false,
          error: 'Finnhub API key invalid',
          message: 'La cle API Finnhub est invalide ou expiree',
          details: errorBody || 'Unauthorized',
          fix: 'Verifiez votre cle API Finnhub dans les variables d\'environnement Vercel',
          timestamp: new Date().toISOString()
        });
      }

      // Handle 429 Rate Limit
      if (finnhubResponse.status === 429) {
        console.error(` Finnhub API: Rate limit exceeded`);
        return res.status(429).json({
          success: false,
          error: 'Finnhub rate limit exceeded',
          message: 'Limite de requetes Finnhub atteinte',
          details: errorBody || 'Too many requests',
          retry: 'Reessayez dans quelques secondes ou passez a un plan superieur',
          upgradeUrl: 'https://finnhub.io/pricing',
          timestamp: new Date().toISOString()
        });
      }

      // Other errors
      throw new Error(`Finnhub API error: ${errorDetails}`);
    }

    const data = await finnhubResponse.json();

    // Check for Finnhub-specific error in response body
    if (data.error) {
      console.error(` Finnhub API error in response: ${data.error}`);
      return res.status(400).json({
        success: false,
        error: 'Finnhub API error',
        message: data.error,
        endpoint,
        timestamp: new Date().toISOString()
      });
    }

    console.log(` Finnhub API success: ${endpoint} - ${symbol || 'general'}`);

    // Return data with metadata
    return res.status(200).json({
      success: true,
      endpoint,
      symbol: symbol || null,
      data,
      source: 'finnhub',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Finnhub API Error:', error.message);

    // Handle timeout errors
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Finnhub API timeout',
        message: 'La requete a Finnhub a expire',
        details: 'Le serveur Finnhub n\'a pas repondu dans le delai imparti',
        timestamp: new Date().toISOString()
      });
    }

    // Other errors
    return res.status(500).json({
      success: false,
      error: 'Erreur Finnhub API',
      message: error.message,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
}
