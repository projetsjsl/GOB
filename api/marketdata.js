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
  intraday: 5 * 60 * 1000,      // 5 minutes
  analyst: 60 * 60 * 1000,      // 1 heure
  earnings: 60 * 60 * 1000      // 1 heure
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
// ENHANCED: Now supports batch fetching with comma-separated symbols
const fetchFundamentalsFromFMP = async (symbols) => {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY manquante');
  }

  // Support both single symbol (string) and multiple symbols (array or comma-separated string)
  const symbolArray = Array.isArray(symbols)
    ? symbols
    : (typeof symbols === 'string' && symbols.includes(','))
      ? symbols.split(',').map(s => s.trim())
      : [symbols];

  const symbolString = symbolArray.join(',');
  const isBatch = symbolArray.length > 1;

  // Fetch en parallèle pour optimiser - FMP supports comma-separated symbols
  const [profileRes, ratiosRes, quoteRes] = await Promise.allSettled([
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/profile/${symbolString}?apikey=${FMP_API_KEY}`),
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/ratios-ttm/${symbolString}?apikey=${FMP_API_KEY}`),
    fetchWithTimeout(`https://financialmodelingprep.com/api/v3/quote/${symbolString}?apikey=${FMP_API_KEY}`)
  ]);

  const profiles = profileRes.status === 'fulfilled' && profileRes.value.ok
    ? await profileRes.value.json() : [];
  const ratios = ratiosRes.status === 'fulfilled' && ratiosRes.value.ok
    ? await ratiosRes.value.json() : [];
  const quotes = quoteRes.status === 'fulfilled' && quoteRes.value.ok
    ? await quoteRes.value.json() : [];

  // Convert arrays to maps for easy lookup
  const profileMap = Array.isArray(profiles) ? Object.fromEntries(profiles.map(p => [p.symbol, p])) : {};
  const ratiosMap = Array.isArray(ratios) ? Object.fromEntries(ratios.map(r => [r.symbol, r])) : {};
  const quotesMap = Array.isArray(quotes) ? Object.fromEntries(quotes.map(q => [q.symbol, q])) : {};

  // If single symbol, return single object (backward compatible)
  if (!isBatch) {
    const sym = symbolArray[0].toUpperCase();
    return {
      symbol: sym,
      profile: profileMap[sym] || null,
      ratios: ratiosMap[sym] || null,
      quote: quotesMap[sym] || null,
      source: 'fmp',
      timestamp: new Date().toISOString()
    };
  }

  // If batch, return object keyed by symbol
  const results = {};
  symbolArray.forEach(symbol => {
    const sym = symbol.toUpperCase();
    results[sym] = {
      symbol: sym,
      profile: profileMap[sym] || null,
      ratios: ratiosMap[sym] || null,
      quote: quotesMap[sym] || null,
      source: 'fmp',
      timestamp: new Date().toISOString()
    };
  });

  return results;
};

// WRAPPER: Fundamentals with Fallback Chain
// FMP → Alpha Vantage → Twelve Data
const fetchFundamentalsWithFallback = async (symbol) => {
  // Try FMP first (primary source)
  try {
    const fmpData = await fetchFundamentalsFromFMP(symbol);
    if (fmpData && fmpData.profile) {
      console.log(`✅ Fundamentals: ${symbol} from FMP`);
      return fmpData;
    }
  } catch (error) {
    console.warn(`⚠️ FMP failed for ${symbol}:`, error.message);
  }

  // Fallback to Alpha Vantage
  try {
    const avData = await fetchFundamentalsFromAlphaVantage(symbol);
    if (avData && avData.profile) {
      console.log(`✅ Fundamentals: ${symbol} from Alpha Vantage (fallback)`);
      return avData;
    }
  } catch (error) {
    console.warn(`⚠️ Alpha Vantage fallback failed for ${symbol}:`, error.message);
  }

  // Final fallback to Twelve Data
  try {
    const twelveData = await fetchFundamentalsFromTwelve(symbol);
    if (twelveData && twelveData.profile) {
      console.log(`✅ Fundamentals: ${symbol} from Twelve Data (fallback)`);
      return twelveData;
    }
  } catch (error) {
    console.warn(`⚠️ Twelve Data fallback failed for ${symbol}:`, error.message);
  }

  // All sources failed
  throw new Error('Aucune source de données disponible pour les fundamentals');
};

// Source 3B: Alpha Vantage (Fundamentals Fallback)
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

const fetchFundamentalsFromAlphaVantage = async (symbol) => {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.warn('⚠️ ALPHA_VANTAGE_API_KEY manquante');
    return null;
  }

  try {
    const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    const response = await fetchWithTimeout(url, 8000);

    if (!response.ok) {
      console.warn(`⚠️ Alpha Vantage API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Check for API errors or empty response
    if (!data || data.Note || data.Information || !data.Symbol) {
      console.warn('⚠️ Alpha Vantage rate limit or invalid response');
      return null;
    }

    // Convert Alpha Vantage format to FMP-like format
    const profile = {
      symbol: data.Symbol,
      companyName: data.Name || 'N/A',
      industry: data.Industry || 'N/A',
      sector: data.Sector || 'N/A',
      description: data.Description || 'N/A',
      ceo: 'N/A',
      website: 'N/A',
      country: data.Country || 'N/A',
      exchange: data.Exchange || 'N/A',
      marketCap: parseFloat(data.MarketCapitalization) || 0,
      price: parseFloat(data['50DayMovingAverage']) || 0
    };

    const ratios = {
      symbol: data.Symbol,
      peRatioTTM: parseFloat(data.PERatio) || null,
      priceToBookRatioTTM: parseFloat(data.PriceToBookRatio) || null,
      dividendYieldTTM: parseFloat(data.DividendYield) * 100 || null,
      returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM) * 100 || null,
      debtToEquityTTM: null, // Not directly available
      currentRatioTTM: null, // Not directly available
      profitMarginTTM: parseFloat(data.ProfitMargin) * 100 || null
    };

    const quote = {
      symbol: data.Symbol,
      price: parseFloat(data['50DayMovingAverage']) || 0,
      change: 0,
      changesPercentage: 0,
      dayLow: parseFloat(data['52WeekLow']) || 0,
      dayHigh: parseFloat(data['52WeekHigh']) || 0
    };

    return {
      symbol: data.Symbol.toUpperCase(),
      profile,
      ratios,
      quote,
      source: 'alpha_vantage',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.warn(`⚠️ Alpha Vantage failed for ${symbol}:`, error.message);
    return null;
  }
};

// Source 3C: Twelve Data (Fundamentals Fallback)
const fetchFundamentalsFromTwelve = async (symbol) => {
  if (!TWELVE_DATA_API_KEY) {
    console.warn('⚠️ TWELVE_DATA_API_KEY manquante');
    return null;
  }

  try {
    const url = `https://api.twelvedata.com/profile?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetchWithTimeout(url, 8000);

    if (!response.ok) {
      console.warn(`⚠️ Twelve Data API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status === 'error' || !data.symbol) {
      console.warn('⚠️ Twelve Data invalid response');
      return null;
    }

    // Convert Twelve Data format to FMP-like format
    const profile = {
      symbol: data.symbol,
      companyName: data.name || 'N/A',
      industry: data.industry || 'N/A',
      sector: data.sector || 'N/A',
      description: data.description || 'N/A',
      ceo: 'N/A',
      website: data.website || 'N/A',
      country: data.country || 'N/A',
      exchange: data.exchange || 'N/A',
      marketCap: 0,
      price: 0
    };

    return {
      symbol: data.symbol.toUpperCase(),
      profile,
      ratios: null,
      quote: null,
      source: 'twelve_data',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.warn(`⚠️ Twelve Data failed for ${symbol}:`, error.message);
    return null;
  }
};

// Source 4: FMP (Analyst Recommendations)
const fetchAnalystFromFMP = async (symbol) => {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY manquante');
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${FMP_API_KEY}`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`FMP Analyst API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize and calculate consensus
    if (data && Array.isArray(data) && data.length > 0) {
      const latest = data[0];

      // Normalize estimates array
      const normalizedEstimates = data
        .filter(item => item.date || item.calendarYear || item.fiscalDateEnding) // Only include items with dates
        .map(item => ({
          date: item.date || item.calendarYear || item.fiscalDateEnding,
          calendarYear: item.calendarYear || null,
          fiscalDateEnding: item.fiscalDateEnding || null,
          estimatedEpsAvg: item.estimatedEpsAvg || item.estimatedEPS || null,
          estimatedEpsHigh: item.estimatedEpsHigh || null,
          estimatedEpsLow: item.estimatedEpsLow || null,
          estimatedRevenueAvg: item.estimatedRevenueAvg || item.estimatedRevenue || null,
          numberAnalystEstimatedRevenue: item.numberAnalystEstimatedRevenue || item.numberAnalysts || 0
        }))
        .sort((a, b) => {
          // Sort by date descending (most recent first)
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        })
        .slice(0, 8); // Last 8 quarters

      return {
        symbol: symbol.toUpperCase(),
        consensus: {
          estimatedRevenue: latest.estimatedRevenueAvg || latest.estimatedRevenue || null,
          estimatedEPS: latest.estimatedEpsAvg || latest.estimatedEPS || null,
          estimatedEPSHigh: latest.estimatedEpsHigh || null,
          estimatedEPSLow: latest.estimatedEpsLow || null,
          numberAnalysts: latest.numberAnalystEstimatedRevenue || latest.numberAnalysts || 0
        },
        estimates: normalizedEstimates,
        source: 'fmp',
        timestamp: new Date().toISOString()
      };
    }

    return {
      symbol: symbol.toUpperCase(),
      consensus: {
        estimatedRevenue: null,
        estimatedEPS: null,
        estimatedEPSHigh: null,
        estimatedEPSLow: null,
        numberAnalysts: 0
      },
      estimates: [],
      source: 'fmp',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.warn(`⚠️ FMP Analyst failed for ${symbol}:`, error.message);
    throw error;
  }
};

// Source 5: FMP (Earnings Calendar)
const fetchEarningsFromFMP = async (symbol) => {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY manquante');
  }

  try {
    // Fetch en parallèle: calendar + historical earnings
    const [calendarRes, historicalRes] = await Promise.allSettled([
      fetchWithTimeout(`https://financialmodelingprep.com/api/v3/earning_calendar?symbol=${symbol}&apikey=${FMP_API_KEY}`),
      fetchWithTimeout(`https://financialmodelingprep.com/api/v3/historical/earning_calendar/${symbol}?apikey=${FMP_API_KEY}`)
    ]);

    const calendar = calendarRes.status === 'fulfilled' && calendarRes.value.ok
      ? await calendarRes.value.json() : [];
    const historical = historicalRes.status === 'fulfilled' && historicalRes.value.ok
      ? await historicalRes.value.json() : [];

    // Normalize calendar data
    const calendarArray = Array.isArray(calendar) ? calendar : [];
    
    // Trouver la prochaine date d'earnings
    const now = new Date();
    const upcoming = calendarArray.filter(e => {
      const date = e.date || e.earningDate;
      return date && new Date(date) >= now;
    }).sort((a, b) => {
      const dateA = new Date(a.date || a.earningDate);
      const dateB = new Date(b.date || b.earningDate);
      return dateA - dateB;
    });
    
    const nextEarnings = upcoming.length > 0 ? upcoming[0] : null;

    // Normalize historical data
    const historicalArray = Array.isArray(historical) ? historical : [];
    const normalizedHistorical = historicalArray
      .map(item => ({
        date: item.date || item.earningDate || item.reportDate,
        fiscalDateEnding: item.fiscalDateEnding || item.fiscalQuarter || null,
        eps: item.eps || item.actualEPS || (typeof item.eps === 'number' ? item.eps : null),
        epsEstimated: item.epsEstimated || item.estimatedEPS || (typeof item.epsEstimated === 'number' ? item.epsEstimated : null),
        revenue: item.revenue || item.actualRevenue || (typeof item.revenue === 'number' ? item.revenue : null),
        revenueEstimated: item.revenueEstimated || item.estimatedRevenue || (typeof item.revenueEstimated === 'number' ? item.revenueEstimated : null),
        surprise: item.surprise || null,
        surprisePercent: item.surprisePercent || null
      }))
      .filter(item => item.date) // Only include items with valid dates
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
      .slice(0, 8); // Last 8 quarters

    // Normalize upcoming data
    const normalizedUpcoming = upcoming.slice(0, 3).map(item => ({
      date: item.date || item.earningDate,
      fiscalDateEnding: item.fiscalDateEnding || item.fiscalQuarter || null,
      eps: item.eps || item.epsEstimated || null,
      epsEstimated: item.epsEstimated || item.eps || null,
      revenue: item.revenue || item.revenueEstimated || null,
      revenueEstimated: item.revenueEstimated || item.revenue || null,
      time: item.time || 'N/A'
    }));

    return {
      symbol: symbol.toUpperCase(),
      consensus: {
        nextEarningsDate: nextEarnings?.date || nextEarnings?.earningDate || null,
        estimatedEPS: nextEarnings?.eps || nextEarnings?.epsEstimated || null,
        estimatedRevenue: nextEarnings?.revenue || nextEarnings?.revenueEstimated || null
      },
      upcoming: normalizedUpcoming,
      historical: normalizedHistorical,
      source: 'fmp',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.warn(`⚠️ FMP Earnings failed for ${symbol}:`, error.message);
    throw error;
  }
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
    const { endpoint, symbol, symbols, source = 'auto', nocache = 'false' } = req.query;

    // Support both 'symbol' (single) and 'symbols' (batch, comma-separated)
    const symbolInput = symbols || symbol;

    // Health check
    if (!endpoint || !symbolInput) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Market Data API opérationnel - Sources optimisées',
        version: '3.1',
        availableEndpoints: ['quote', 'fundamentals', 'intraday', 'analyst', 'earnings'],
        batchSupport: {
          fundamentals: 'Use ?symbols=AAPL,MSFT,GOOGL (comma-separated)',
          quote: 'Single symbol only (use /api/marketdata/batch for multiple)',
          analyst: 'Single symbol only',
          earnings: 'Single symbol only'
        },
        sources: {
          quote: 'Polygon.io (preferred) → Twelve Data (fallback)',
          fundamentals: 'FMP (parallel fetch: profile + ratios + quote) - BATCH ENABLED',
          intraday: 'Twelve Data (5min intervals)',
          analyst: 'FMP (analyst estimates)',
          earnings: 'FMP (earnings calendar + historical)'
        },
        cache: {
          quote: '5 min',
          fundamentals: '1 hour',
          intraday: '5 min',
          analyst: '1 hour',
          earnings: '1 hour'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Determine if batch request (comma-separated symbols)
    const isBatchRequest = symbolInput.includes(',');
    const cacheKey = getCacheKey(endpoint, symbolInput);
    const useCache = nocache !== 'true';

    // ========================================================================
    // ENDPOINT: QUOTE
    // ========================================================================
    if (endpoint === 'quote') {
      // Batch not supported for quotes - redirect to batch endpoint
      if (isBatchRequest) {
        return res.status(400).json({
          error: 'Batch quotes not supported on this endpoint',
          message: 'Use /api/marketdata/batch?symbols=AAPL,MSFT,GOOGL&endpoints=quote for batch requests'
        });
      }

      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.quote);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      // Essayer Polygon.io en priorité
      let quoteData = await fetchQuoteFromPolygon(symbolInput);

      // Fallback vers Twelve Data
      if (!quoteData) {
        quoteData = await fetchQuoteFromTwelve(symbolInput);
      }

      if (!quoteData) {
        throw new Error('Aucune source de données disponible pour les quotes');
      }

      // Mettre en cache
      setCache(cacheKey, quoteData);

      console.log(`✅ Quote: ${symbolInput} from ${quoteData.source}`);
      return res.status(200).json(quoteData);
    }

    // ========================================================================
    // ENDPOINT: FUNDAMENTALS (NOW SUPPORTS BATCH + FALLBACK)
    // ========================================================================
    if (endpoint === 'fundamentals') {
      // For batch requests, skip cache (too complex to cache multiple symbols)
      if (!isBatchRequest && useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.fundamentals);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      let fundamentalsData;

      if (isBatchRequest) {
        // For batch requests, use FMP directly (no fallback on batch)
        fundamentalsData = await fetchFundamentalsFromFMP(symbolInput);
        const symbolCount = symbolInput.split(',').length;
        console.log(`✅ Fundamentals: ${symbolCount} symbol(s) from FMP (BATCH)`);
      } else {
        // For single symbol, use fallback chain: FMP → Alpha Vantage → Twelve Data
        fundamentalsData = await fetchFundamentalsWithFallback(symbolInput);
      }

      // Cache only for single symbol requests
      if (!isBatchRequest) {
        setCache(cacheKey, fundamentalsData);
      }

      return res.status(200).json(fundamentalsData);
    }

    // ========================================================================
    // ENDPOINT: INTRADAY
    // ========================================================================
    if (endpoint === 'intraday') {
      if (isBatchRequest) {
        return res.status(400).json({
          error: 'Batch intraday not supported',
          message: 'Intraday data only available for single symbols'
        });
      }

      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.intraday);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      const interval = req.query.interval || '5min';
      const outputsize = req.query.outputsize || '78';

      try {
        const intradayData = await fetchIntradayFromTwelve(symbolInput, interval, outputsize);

        // Mettre en cache
        setCache(cacheKey, intradayData);

        console.log(`✅ Intraday: ${symbolInput} from Twelve Data`);
        return res.status(200).json(intradayData);
      } catch (error) {
        // ✅ FIX: Gérer les erreurs gracieusement au lieu de 500
        console.error(`❌ Intraday error for ${symbolInput}:`, error.message);
        
        // Vérifier si c'est une erreur de clé API manquante
        if (error.message.includes('TWELVE_DATA_API_KEY')) {
          return res.status(503).json({
            error: 'Service unavailable',
            message: 'Intraday data requires TWELVE_DATA_API_KEY configuration',
            endpoint: 'intraday',
            symbol: symbolInput,
            suggestion: 'Configure TWELVE_DATA_API_KEY in Vercel environment variables',
            fallback: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Vérifier si c'est une erreur de quota ou rate limit
        if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('quota')) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Twelve Data API rate limit reached',
            endpoint: 'intraday',
            symbol: symbolInput,
            retryAfter: 60,
            suggestion: 'Wait before retrying or upgrade your Twelve Data plan',
            fallback: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Autres erreurs - retourner 503 (Service Unavailable) au lieu de 500
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: `Intraday data not available for ${symbolInput}`,
          endpoint: 'intraday',
          symbol: symbolInput,
          details: error.message,
          fallback: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // ========================================================================
    // ENDPOINT: ANALYST
    // ========================================================================
    if (endpoint === 'analyst') {
      if (isBatchRequest) {
        return res.status(400).json({
          error: 'Batch analyst not supported on this endpoint',
          message: 'Use /api/marketdata/batch?symbols=AAPL,MSFT&endpoints=analyst for batch requests'
        });
      }

      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.analyst);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      const analystData = await fetchAnalystFromFMP(symbolInput);

      // Mettre en cache
      setCache(cacheKey, analystData);

      console.log(`✅ Analyst: ${symbolInput} from FMP`);
      return res.status(200).json(analystData);
    }

    // ========================================================================
    // ENDPOINT: EARNINGS
    // ========================================================================
    if (endpoint === 'earnings') {
      if (isBatchRequest) {
        return res.status(400).json({
          error: 'Batch earnings not supported on this endpoint',
          message: 'Use /api/marketdata/batch?symbols=AAPL,MSFT&endpoints=earnings for batch requests'
        });
      }

      // Vérifier cache
      if (useCache) {
        const cached = getFromCache(cacheKey, CACHE_TTL.earnings);
        if (cached) return res.status(200).json({ ...cached, cached: true });
      }

      const earningsData = await fetchEarningsFromFMP(symbolInput);

      // Mettre en cache
      setCache(cacheKey, earningsData);

      console.log(`✅ Earnings: ${symbolInput} from FMP`);
      return res.status(200).json(earningsData);
    }

    return res.status(400).json({
      error: 'Endpoint non supporté',
      availableEndpoints: ['quote', 'fundamentals', 'intraday', 'analyst', 'earnings']
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
