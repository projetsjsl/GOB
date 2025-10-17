// ============================================================================
// MARKET DATA API - Version optimisée avec cache intelligent
// Sources: Polygon.io → Twelve Data → FMP (selon DATA_SOURCES_MAP.md)
// ============================================================================

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;

// Cache simple en mémoire (5 min pour quotes, 1h pour fundamentals)
const cache = new Map();
const CACHE_TTL = {
  quote: 5 * 60 * 1000,        // 5 minutes
  fundamentals: 60 * 60 * 1000, // 1 heure
  intraday: 5 * 60 * 1000       // 5 minutes
};

// Helpers
const getCacheKey = (endpoint, symbol) => `${endpoint}:${symbol}`.toUpperCase();

const getFromCache = (key, ttl) => {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < ttl) {
    console.log(`📦 Cache hit: ${key}`);
    return cached.data;
  }
  cache.delete(key); // Invalider cache expiré
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Fetch helpers avec timeout
const fetchWithTimeout = async (url, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// ============================================================================
// SOURCES DE DONNÉES
// ============================================================================

// Source 1: Polygon.io (Real-time quotes)
const fetchQuoteFromPolygon = async (symbol) => {
  if (!POLYGON_API_KEY) return null;

  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    return {
      symbol: symbol.toUpperCase(),
      c: result.c,
      d: result.c - result.o,
      dp: ((result.c - result.o) / result.o) * 100,
      h: result.h,
      l: result.l,
      o: result.o,
      pc: result.o,
      v: result.v,
      source: 'polygon.io',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`⚠️ Polygon.io failed for ${symbol}:`, error.message);
    return null;
  }
};

// Source 2: Twelve Data (Quotes fallback + Intraday)
const fetchQuoteFromTwelve = async (symbol) => {
  if (!TWELVE_DATA_API_KEY) return null;

  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.close) return null;

    return {
      symbol: symbol.toUpperCase(),
      c: parseFloat(data.close),
      d: parseFloat(data.change),
      dp: parseFloat(data.percent_change),
      h: parseFloat(data.high),
      l: parseFloat(data.low),
      o: parseFloat(data.open),
      pc: parseFloat(data.previous_close),
      v: parseInt(data.volume) || 0,
      source: 'twelve_data',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`⚠️ Twelve Data failed for ${symbol}:`, error.message);
    return null;
  }
};

const fetchIntradayFromTwelve = async (symbol, interval = '5min', outputsize = '78') => {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('TWELVE_DATA_API_KEY manquante');
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`;

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Twelve Data API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status === 'error') {
    throw new Error(data.message || 'Twelve Data API error');
  }

  return {
    symbol: symbol.toUpperCase(),
    interval,
    values: data.values || [],
    source: 'twelve_data',
    timestamp: new Date().toISOString()
  };
};

// Source 3: FMP (Fundamentals, Ratios, Profile)
const fetchFundamentalsFromFMP = async (symbol) => {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY manquante');
  }

  // Fetch en parallèle pour optimiser
  const [profileRes, ratiosRes, quoteRes] = await Promise.allSettled([
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`),
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${FMP_API_KEY}`),
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`)
  ]);

  const profile = profileRes.status === 'fulfilled' && profileRes.value.ok
    ? await profileRes.value.json() : null;
  const ratios = ratiosRes.status === 'fulfilled' && ratiosRes.value.ok
    ? await ratiosRes.value.json() : null;
  const quote = quoteRes.status === 'fulfilled' && quoteRes.value.ok
    ? await quoteRes.value.json() : null;

  return {
    symbol: symbol.toUpperCase(),
    profile: profile?.[0] || null,
    ratios: ratios?.[0] || null,
    quote: quote?.[0] || null,
    source: 'fmp',
    timestamp: new Date().toISOString()
  };
};

// ============================================================================
// HANDLER PRINCIPAL
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
    const { endpoint, symbol, source = 'auto', nocache = 'false' } = req.query;

    // Health check
    if (!endpoint || !symbol) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Market Data API opérationnel - Sources optimisées',
        version: '2.0',
        availableEndpoints: ['quote', 'fundamentals', 'intraday'],
        sources: {
          quote: 'Polygon.io (preferred) → Twelve Data (fallback)',
          fundamentals: 'FMP (parallel fetch: profile + ratios + quote)',
          intraday: 'Twelve Data (5min intervals)'
        },
        cache: {
          quote: '5 min',
          fundamentals: '1 hour',
          intraday: '5 min'
        },
        timestamp: new Date().toISOString()
      });
    }

    const cacheKey = getCacheKey(endpoint, symbol);
    const useCache = nocache !== 'true';

    // ========================================================================
    // ENDPOINT: QUOTE
    // ========================================================================
    if (endpoint === 'quote') {
      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.quote);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      // Essayer Polygon.io en priorité
      let quoteData = await fetchQuoteFromPolygon(symbol);

      // Fallback vers Twelve Data
      if (!quoteData) {
        quoteData = await fetchQuoteFromTwelve(symbol);
      }

      if (!quoteData) {
        throw new Error('Aucune source de données disponible pour les quotes');
      }

      // Mettre en cache
      setCache(cacheKey, quoteData);

      console.log(`✅ Quote: ${symbol} from ${quoteData.source}`);
      return res.status(200).json(quoteData);
    }

    // ========================================================================
    // ENDPOINT: FUNDAMENTALS
    // ========================================================================
    if (endpoint === 'fundamentals') {
      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.fundamentals);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      const fundamentalsData = await fetchFundamentalsFromFMP(symbol);

      // Mettre en cache
      setCache(cacheKey, fundamentalsData);

      console.log(`✅ Fundamentals: ${symbol} from FMP`);
      return res.status(200).json(fundamentalsData);
    }

    // ========================================================================
    // ENDPOINT: INTRADAY
    // ========================================================================
    if (endpoint === 'intraday') {
      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.intraday);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      const interval = req.query.interval || '5min';
      const outputsize = req.query.outputsize || '78';

      const intradayData = await fetchIntradayFromTwelve(symbol, interval, outputsize);

      // Mettre en cache
      setCache(cacheKey, intradayData);

      console.log(`✅ Intraday: ${symbol} from Twelve Data`);
      return res.status(200).json(intradayData);
    }

    return res.status(400).json({
      error: 'Endpoint non supporté',
      availableEndpoints: ['quote', 'fundamentals', 'intraday']
    });

  } catch (error) {
    console.error('❌ Market Data API error:', error.message);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      endpoint: req.query.endpoint,
      symbol: req.query.symbol,
      timestamp: new Date().toISOString()
    });
  }
}
