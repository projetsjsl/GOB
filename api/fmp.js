/**
 * Financial Modeling Prep (FMP) API Integration
 * Documentation: https://site.financialmodelingprep.com/developer/docs
 */

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_V4_BASE_URL = 'https://financialmodelingprep.com/api/v4';

/**
 * Helper function to make FMP API requests
 */
async function fmpRequest(endpoint, version = 'v3') {
  const apiKey = process.env.FMP_API_KEY;
  
  if (!apiKey) {
    throw new Error('FMP_API_KEY not configured');
  }

  const baseUrl = version === 'v4' ? FMP_V4_BASE_URL : FMP_BASE_URL;
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}${endpoint}${separator}apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`FMP API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * COMPANY PROFILE & FUNDAMENTALS
 */

// Get company profile (complete information)
export async function getCompanyProfile(symbol) {
  return await fmpRequest(`/profile/${symbol}`);
}

// Get income statement (quarterly or annual)
export async function getIncomeStatement(symbol, period = 'quarter', limit = 12) {
  return await fmpRequest(`/income-statement/${symbol}?period=${period}&limit=${limit}`);
}

// Get balance sheet statement
export async function getBalanceSheet(symbol, period = 'quarter', limit = 12) {
  return await fmpRequest(`/balance-sheet-statement/${symbol}?period=${period}&limit=${limit}`);
}

// Get cash flow statement
export async function getCashFlowStatement(symbol, period = 'quarter', limit = 12) {
  return await fmpRequest(`/cash-flow-statement/${symbol}?period=${period}&limit=${limit}`);
}

// Get all financial statements (combined)
export async function getFinancialStatements(symbol, period = 'quarter', limit = 4) {
  const [income, balance, cashFlow] = await Promise.all([
    getIncomeStatement(symbol, period, limit),
    getBalanceSheet(symbol, period, limit),
    getCashFlowStatement(symbol, period, limit)
  ]);

  return { income, balance, cashFlow };
}

// Get financial ratios (TTM - Trailing Twelve Months)
export async function getFinancialRatiosTTM(symbol) {
  return await fmpRequest(`/ratios-ttm/${symbol}`);
}

// Get key metrics (TTM)
export async function getKeyMetricsTTM(symbol) {
  return await fmpRequest(`/key-metrics-ttm/${symbol}`);
}

// Get financial growth (year-over-year)
export async function getFinancialGrowth(symbol, period = 'quarter', limit = 12) {
  return await fmpRequest(`/financial-growth/${symbol}?period=${period}&limit=${limit}`);
}

/**
 * VALUATIONS & RATINGS
 */

// Get DCF valuation (Discounted Cash Flow)
export async function getDCFValuation(symbol) {
  return await fmpRequest(`/discounted-cash-flow/${symbol}`);
}

// Get company rating
export async function getCompanyRating(symbol) {
  return await fmpRequest(`/rating/${symbol}`);
}

// Get analyst price target consensus
export async function getPriceTargetConsensus(symbol) {
  return await fmpRequest(`/price-target-consensus?symbol=${symbol}`, 'v4');
}

// Get upgrades and downgrades
export async function getUpgradesDowngrades(symbol, limit = 50) {
  return await fmpRequest(`/upgrades-downgrades?symbol=${symbol}`, 'v4');
}

// Get analyst estimates
export async function getAnalystEstimates(symbol, period = 'quarter', limit = 12) {
  return await fmpRequest(`/analyst-estimates/${symbol}?period=${period}&limit=${limit}`);
}

/**
 * MARKET DATA
 */

// Get real-time quote
export async function getQuote(symbol) {
  return await fmpRequest(`/quote/${symbol}`);
}

// Get multiple quotes
export async function getQuotes(symbols) {
  const symbolList = Array.isArray(symbols) ? symbols.join(',') : symbols;
  return await fmpRequest(`/quote/${symbolList}`);
}

// Get historical prices
export async function getHistoricalPrices(symbol, from, to) {
  let endpoint = `/historical-price-full/${symbol}`;
  if (from && to) {
    endpoint += `?from=${from}&to=${to}`;
  }
  return await fmpRequest(endpoint);
}

// Get historical chart data (intraday, daily, weekly, monthly)
export async function getHistoricalChart(symbol, timeframe = '1day', limit = 100) {
  const endpoint = `/historical-chart/${timeframe}/${symbol}?limit=${limit}`;
  return await fmpRequest(endpoint);
}

// Get intraday data (1min, 5min, 15min, 30min, 1hour)
export async function getIntradayData(symbol, timeframe = '1min', limit = 100) {
  const endpoint = `/historical-chart/${timeframe}/${symbol}?limit=${limit}`;
  return await fmpRequest(endpoint);
}

// Get pre/post market quote
export async function getPrePostMarketQuote(symbol) {
  return await fmpRequest(`/pre-post-market/${symbol}`, 'v4');
}

/**
 * NEWS & PRESS RELEASES
 */

// Get company news
export async function getCompanyNews(symbol, limit = 50) {
  return await fmpRequest(`/stock_news?tickers=${symbol}&limit=${limit}`);
}

// Get general market news
export async function getGeneralNews(page = 0, limit = 100) {
  return await fmpRequest(`/general_news?page=${page}`, 'v4');
}

// Get press releases
export async function getPressReleases(symbol, limit = 20) {
  return await fmpRequest(`/press-releases/${symbol}?limit=${limit}`);
}

/**
 * EARNINGS
 */

// Get earnings calendar
export async function getEarningsCalendar(from, to) {
  return await fmpRequest(`/earnings-calendar?from=${from}&to=${to}`);
}

// Get earnings surprises
export async function getEarningsSurprises(symbol) {
  return await fmpRequest(`/earnings-surprises/${symbol}`);
}

// Get historical earnings
export async function getHistoricalEarnings(symbol, limit = 80) {
  return await fmpRequest(`/historical/earning_calendar/${symbol}?limit=${limit}`);
}

// Get earnings call transcript
export async function getEarningsTranscript(symbol, quarter, year) {
  return await fmpRequest(`/earning_call_transcript/${symbol}?quarter=${quarter}&year=${year}`);
}

// Get available earnings transcripts
export async function getAvailableTranscripts(symbol) {
  return await fmpRequest(`/earning_call_transcript?symbol=${symbol}`);
}

/**
 * INSIDER & INSTITUTIONAL
 */

// Get insider trading
export async function getInsiderTrading(symbol, limit = 100) {
  return await fmpRequest(`/insider-trading?symbol=${symbol}&limit=${limit}`, 'v4');
}

// Get institutional holders
export async function getInstitutionalHolders(symbol) {
  return await fmpRequest(`/institutional-holder/${symbol}`);
}

// Get senate/congressional trading
export async function getCongressionalTrading(symbol) {
  return await fmpRequest(`/senate-trading?symbol=${symbol}`, 'v4');
}

// Get Form 13F filings
export async function get13FFilings(cik, date) {
  return await fmpRequest(`/form-thirteen/${cik}?date=${date}`);
}

/**
 * SEC FILINGS
 */

// Get SEC filings
export async function getSECFilings(symbol, type = '', limit = 100) {
  let endpoint = `/sec_filings/${symbol}?limit=${limit}`;
  if (type) {
    endpoint += `&type=${type}`;
  }
  return await fmpRequest(endpoint);
}

// Get 10-K filings
export async function get10KFilings(symbol, limit = 10) {
  return await getSECFilings(symbol, '10-K', limit);
}

// Get 10-Q filings
export async function get10QFilings(symbol, limit = 10) {
  return await getSECFilings(symbol, '10-Q', limit);
}

/**
 * MARKET PERFORMANCE & PEERS
 */

// Get stock peers
export async function getStockPeers(symbol) {
  return await fmpRequest(`/stock_peers?symbol=${symbol}`, 'v4');
}

// Get sector performance
export async function getSectorPerformance() {
  return await fmpRequest(`/sector-performance`);
}

// Get gainers/losers
export async function getMarketMovers(type = 'gainers') {
  // type: 'gainers', 'losers', 'actives'
  return await fmpRequest(`/${type}`);
}

/**
 * ESG DATA
 */

// Get ESG score
export async function getESGScore(symbol) {
  return await fmpRequest(`/esg-environmental-social-governance-data?symbol=${symbol}`, 'v4');
}

// Get ESG ratings
export async function getESGRatings(symbol) {
  return await fmpRequest(`/esg-environmental-social-governance-data-ratings?symbol=${symbol}`, 'v4');
}

/**
 * SEARCH & DISCOVERY
 */

// Search companies
export async function searchCompanies(query) {
  return await fmpRequest(`/search?query=${encodeURIComponent(query)}`);
}

// Search by name
export async function searchByName(query) {
  return await fmpRequest(`/search-name?query=${encodeURIComponent(query)}`);
}

// Get stock screener results
export async function screenStocks(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await fmpRequest(`/stock-screener?${params}`);
}

/**
 * COMBINED ENDPOINTS FOR EMMA
 */

// Get complete company analysis (all data Emma needs)
export async function getCompleteAnalysis(symbol) {
  try {
    const [
      profile,
      quote,
      ratios,
      keyMetrics,
      dcf,
      rating,
      priceTarget,
      news,
      earnings,
      insiderTrading
    ] = await Promise.allSettled([
      getCompanyProfile(symbol),
      getQuote(symbol),
      getFinancialRatiosTTM(symbol),
      getKeyMetricsTTM(symbol),
      getDCFValuation(symbol),
      getCompanyRating(symbol),
      getPriceTargetConsensus(symbol),
      getCompanyNews(symbol, 10),
      getEarningsSurprises(symbol),
      getInsiderTrading(symbol, 20)
    ]);

    return {
      profile: profile.status === 'fulfilled' ? profile.value?.[0] : null,
      quote: quote.status === 'fulfilled' ? quote.value?.[0] : null,
      ratios: ratios.status === 'fulfilled' ? ratios.value?.[0] : null,
      keyMetrics: keyMetrics.status === 'fulfilled' ? keyMetrics.value?.[0] : null,
      dcf: dcf.status === 'fulfilled' ? dcf.value?.[0] : null,
      rating: rating.status === 'fulfilled' ? rating.value?.[0] : null,
      priceTarget: priceTarget.status === 'fulfilled' ? priceTarget.value?.[0] : null,
      news: news.status === 'fulfilled' ? news.value : [],
      earnings: earnings.status === 'fulfilled' ? earnings.value : [],
      insiderTrading: insiderTrading.status === 'fulfilled' ? insiderTrading.value : [],
      timestamp: new Date().toISOString(),
      source: 'Financial Modeling Prep'
    };
  } catch (error) {
    console.error('Error fetching complete analysis:', error);
    throw error;
  }
}

// Get fundamental data for Emma's analysis
export async function getFundamentalsForEmma(symbol) {
  try {
    const [
      financials,
      ratios,
      keyMetrics,
      growth
    ] = await Promise.allSettled([
      getFinancialStatements(symbol, 'quarter', 4),
      getFinancialRatiosTTM(symbol),
      getKeyMetricsTTM(symbol),
      getFinancialGrowth(symbol, 'annual', 5)
    ]);

    return {
      financials: financials.status === 'fulfilled' ? financials.value : null,
      ratios: ratios.status === 'fulfilled' ? ratios.value?.[0] : null,
      keyMetrics: keyMetrics.status === 'fulfilled' ? keyMetrics.value?.[0] : null,
      growth: growth.status === 'fulfilled' ? growth.value : [],
      timestamp: new Date().toISOString(),
      source: 'Financial Modeling Prep'
    };
  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    throw error;
  }
}

// Serverless function handler pour Vercel
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, symbol, period, limit, from, to, quarter, year, cik, date, type } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Parameter "endpoint" is required' });
    }

    let result;

    switch (endpoint) {
      case 'profile':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getCompanyProfile(symbol);
        break;
      case 'ratios':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getFinancialRatiosTTM(symbol);
        break;
      case 'ratios-ttm':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getFinancialRatiosTTM(symbol);
        break;
      case 'financials':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getFinancialStatements(symbol, period || 'quarter', parseInt(limit) || 4);
        break;
      case 'historical-chart':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        const timeframe = req.query.timeframe || '1day';
        const chartLimit = parseInt(req.query.limit) || 100;
        result = await getHistoricalChart(symbol, timeframe, chartLimit);
        break;
      case 'technical-indicators':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        // Retourner des données mockées pour l'instant
        result = [];
        break;
      case 'dcf':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getDCFValuation(symbol);
        break;
      case 'analyst':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getPriceTargetConsensus(symbol);
        break;
      case 'earnings':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getEarningsSurprises(symbol);
        break;
      case 'insider':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getInsiderTrading(symbol, parseInt(limit) || 100);
        break;
      case 'complete':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getCompleteAnalysis(symbol);
        break;
      default:
        return res.status(404).json({ error: `Endpoint "${endpoint}" not found` });
    }

    res.status(200).json({ data: Array.isArray(result) ? result : [result] });

  } catch (error) {
    console.error('FMP API error:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Clé API FMP non configurée',
        message: '⚠️ Les données financières nécessitent une clé API FMP. Configurez FMP_API_KEY dans les variables d\'environnement Vercel.',
        helpUrl: 'https://vercel.com/projetsjsl/gob/settings/environment-variables',
        steps: [
          '1. Obtenez une clé gratuite (250 req/jour) sur https://site.financialmodelingprep.com/',
          '2. Ajoutez FMP_API_KEY dans Vercel',
          '3. Redéployez l\'application'
        ],
        data: [],
        timestamp: new Date().toISOString()
      });
    }

    // Retourner un tableau vide au lieu d'une erreur 500 pour ne pas casser l'UI
    res.status(200).json({
      error: error.message,
      data: [],
      warning: 'API call failed but returning empty data to prevent UI crash'
    });
  }
}

