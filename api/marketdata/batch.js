/**
 * Batch Market Data Endpoint
 * Fetches multiple data types for multiple symbols in optimized batches
 * Reduces API calls by 60-90% compared to individual requests
 */

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Fetch with timeout
const fetchWithTimeout = (url, timeout = 8000) => {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ]);
};

/**
 * Fetch multiple symbols from FMP in a single batch request
 * @param {string} endpoint - FMP endpoint (profile, ratios-ttm, quote, etc.)
 * @param {Array<string>} symbols - Array of ticker symbols
 * @returns {Promise<Object>} Results keyed by symbol
 */
const fetchFMPBatch = async (endpoint, symbols) => {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  if (!symbols || symbols.length === 0) {
    return {};
  }

  // FMP batch endpoints support comma-separated symbols
  const symbolString = symbols.join(',');
  let url;

  // Map generic endpoint names to FMP-specific URLs
  switch (endpoint) {
    case 'quote':
      url = `${FMP_BASE_URL}/quote/${symbolString}?apikey=${FMP_API_KEY}`;
      break;
    case 'profile':
      url = `${FMP_BASE_URL}/profile/${symbolString}?apikey=${FMP_API_KEY}`;
      break;
    case 'ratios':
    case 'fundamentals':
      url = `${FMP_BASE_URL}/ratios-ttm/${symbolString}?apikey=${FMP_API_KEY}`;
      break;
    case 'analyst':
    case 'analyst-estimates':
      url = `${FMP_BASE_URL}/analyst-estimates/${symbolString}?apikey=${FMP_API_KEY}`;
      break;
    case 'rating':
      url = `${FMP_BASE_URL}/rating/${symbolString}?apikey=${FMP_API_KEY}`;
      break;
    case 'news':
      url = `${FMP_BASE_URL}/stock_news?tickers=${symbolString}&limit=50&apikey=${FMP_API_KEY}`;
      break;
    default:
      throw new Error(`Unsupported endpoint: ${endpoint}`);
  }

  try {
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();

    // FMP returns arrays, we need to convert to object keyed by symbol
    const results = {};

    if (Array.isArray(data)) {
      data.forEach(item => {
        const symbol = item.symbol || item.ticker;
        if (symbol) {
          results[symbol] = item;
        }
      });
    }

    return results;
  } catch (error) {
    console.error(`FMP batch fetch error for ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Process batch request with multiple endpoints and symbols
 * @param {Array<string>} symbols - Ticker symbols to fetch
 * @param {Array<string>} endpoints - Data types to fetch (quote, profile, fundamentals, etc.)
 * @returns {Promise<Object>} Consolidated results
 */
const processBatchRequest = async (symbols, endpoints) => {
  // Split into batches of 10 symbols to avoid URL length limits
  const BATCH_SIZE = 10;
  const symbolBatches = [];

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    symbolBatches.push(symbols.slice(i, i + BATCH_SIZE));
  }

  const results = {};

  // Process each endpoint across all symbol batches
  for (const endpoint of endpoints) {
    const endpointResults = {};

    // Fetch all batches in parallel for this endpoint
    const batchPromises = symbolBatches.map(batch =>
      fetchFMPBatch(endpoint, batch)
        .catch(error => {
          console.error(`Batch error for ${endpoint}:`, error);
          return {}; // Return empty object on error, don't fail entire request
        })
    );

    const batchResults = await Promise.all(batchPromises);

    // Consolidate batch results
    batchResults.forEach(batchData => {
      Object.assign(endpointResults, batchData);
    });

    // Store under endpoint key
    results[endpoint] = endpointResults;
  }

  return results;
};

/**
 * Main handler for batch market data requests
 */
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  try {
    const { symbols, endpoints } = req.query;

    // Validate input
    if (!symbols) {
      return res.status(400).json({
        error: 'Missing required parameter: symbols',
        usage: '/api/marketdata/batch?symbols=AAPL,MSFT,GOOGL&endpoints=quote,profile,fundamentals'
      });
    }

    // Parse comma-separated parameters
    const symbolArray = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const endpointArray = endpoints
      ? endpoints.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
      : ['quote']; // Default to quote if not specified

    if (symbolArray.length === 0) {
      return res.status(400).json({ error: 'No valid symbols provided' });
    }

    // Log request for monitoring
    console.log(`[Batch API] Fetching ${endpointArray.length} endpoints for ${symbolArray.length} symbols`);
    console.log(`[Batch API] Symbols: ${symbolArray.join(', ')}`);
    console.log(`[Batch API] Endpoints: ${endpointArray.join(', ')}`);

    // Process batch request
    const results = await processBatchRequest(symbolArray, endpointArray);

    // Calculate stats
    const totalDataPoints = Object.values(results).reduce((sum, endpointData) =>
      sum + Object.keys(endpointData).length, 0
    );

    // Add metadata
    const response = {
      success: true,
      metadata: {
        symbols_requested: symbolArray.length,
        endpoints_requested: endpointArray.length,
        total_data_points: totalDataPoints,
        timestamp: new Date().toISOString(),
        api_calls_saved: `~${(symbolArray.length * endpointArray.length) - endpointArray.length} calls (${Math.round((1 - endpointArray.length / (symbolArray.length * endpointArray.length)) * 100)}% reduction)`
      },
      data: results
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('[Batch API] Error:', error);

    return res.status(500).json({
      error: 'Batch request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Vercel configuration
export const config = {
  runtime: 'nodejs',
  maxDuration: 30, // 30 seconds for batch operations
};
