/**
 * Marketaux API Integration
 * Documentation: https://www.marketaux.com/documentation
 * 
 * Marketaux provides:
 * - Real-time financial news
 * - Market sentiment analysis
 * - News by ticker, country, topic
 * - Entity extraction and categorization
 */

const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';

/**
 * Helper function to make Marketaux API requests
 */
async function marketauxRequest(endpoint, params = {}) {
  const apiKey = process.env.MARKETAUX_API_KEY;
  
  if (!apiKey) {
    throw new Error('MARKETAUX_API_KEY not configured');
  }

  const queryParams = new URLSearchParams({
    ...params,
    api_token: apiKey
  });

  const url = `${MARKETAUX_BASE_URL}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Marketaux API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Marketaux API request failed for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * NEWS ENDPOINTS
 */

// Get latest financial news
export async function getNews(options = {}) {
  const {
    symbols,
    entities,
    industries,
    countries,
    languages = 'en,fr',
    filterEntities = true,
    limit = 50,
    page = 1,
    publishedAfter,
    publishedBefore,
    sort = 'published_on',
    sortOrder = 'desc'
  } = options;

  const params = {
    filter_entities: filterEntities,
    limit,
    page,
    sort,
    sort_order: sortOrder,
    language: languages
  };

  if (symbols) {
    params.symbols = Array.isArray(symbols) ? symbols.join(',') : symbols;
  }

  if (entities) {
    params.entities = Array.isArray(entities) ? entities.join(',') : entities;
  }

  if (industries) {
    params.industries = Array.isArray(industries) ? industries.join(',') : industries;
  }

  if (countries) {
    params.countries = Array.isArray(countries) ? countries.join(',') : countries;
  }

  if (publishedAfter) {
    params.published_after = publishedAfter;
  }

  if (publishedBefore) {
    params.published_before = publishedBefore;
  }

  return await marketauxRequest('/news/all', params);
}

// Get news for specific ticker
export async function getTickerNews(symbol, options = {}) {
  return await getNews({
    ...options,
    symbols: symbol
  });
}

// Get news by entity (company, person, etc.)
export async function getEntityNews(entity, options = {}) {
  return await getNews({
    ...options,
    entities: entity
  });
}

// Get news by industry
export async function getIndustryNews(industry, options = {}) {
  return await getNews({
    ...options,
    industries: industry
  });
}

// Get news by country
export async function getCountryNews(country, options = {}) {
  return await getNews({
    ...options,
    countries: country
  });
}

/**
 * SENTIMENT & ANALYSIS
 */

// Get news with sentiment analysis
export async function getNewsWithSentiment(options = {}) {
  const news = await getNews(options);
  
  // Marketaux includes sentiment in the response
  // Enhance with aggregated sentiment metrics
  if (news.data && Array.isArray(news.data)) {
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    news.data.forEach(article => {
      if (article.sentiment) {
        const sentiment = article.sentiment.toLowerCase();
        if (sentiment === 'positive') sentimentCounts.positive++;
        else if (sentiment === 'negative') sentimentCounts.negative++;
        else sentimentCounts.neutral++;
      }
    });

    news.sentimentAnalysis = {
      ...sentimentCounts,
      total: news.data.length,
      positivePercent: (sentimentCounts.positive / news.data.length * 100).toFixed(2),
      negativePercent: (sentimentCounts.negative / news.data.length * 100).toFixed(2),
      neutralPercent: (sentimentCounts.neutral / news.data.length * 100).toFixed(2),
      overallSentiment: sentimentCounts.positive > sentimentCounts.negative ? 'positive' : 
                       sentimentCounts.negative > sentimentCounts.positive ? 'negative' : 'neutral'
    };
  }

  return news;
}

// Get sentiment for specific ticker
export async function getTickerSentiment(symbol, options = {}) {
  return await getNewsWithSentiment({
    ...options,
    symbols: symbol,
    limit: options.limit || 100
  });
}

/**
 * TRENDING & POPULAR
 */

// Get trending news
export async function getTrendingNews(options = {}) {
  return await getNews({
    ...options,
    sort: 'entity_match_score',
    sortOrder: 'desc',
    limit: options.limit || 20
  });
}

// Get most popular news
export async function getPopularNews(options = {}) {
  return await getNews({
    ...options,
    sort: 'entity_match_score',
    sortOrder: 'desc',
    limit: options.limit || 50
  });
}

/**
 * COMBINED ENDPOINTS FOR EMMA
 */

// Get complete news analysis for a ticker
export async function getCompleteTickerNews(symbol, options = {}) {
  try {
    const limit = options.limit || 50;
    const timeframe = options.timeframe || 7; // days

    const publishedAfter = new Date();
    publishedAfter.setDate(publishedAfter.getDate() - timeframe);

    const news = await getNewsWithSentiment({
      symbols: symbol,
      limit,
      publishedAfter: publishedAfter.toISOString(),
      languages: 'en,fr'
    });

    return {
      symbol,
      timeframe: `${timeframe} days`,
      news: news.data || [],
      sentimentAnalysis: news.sentimentAnalysis || null,
      meta: news.meta || null,
      timestamp: new Date().toISOString(),
      source: 'Marketaux'
    };
  } catch (error) {
    console.error('Error fetching complete ticker news:', error);
    throw error;
  }
}

// Get market overview news
export async function getMarketOverview(options = {}) {
  try {
    const limit = options.limit || 30;
    const industries = options.industries || ['Technology', 'Finance', 'Healthcare', 'Energy'];

    const news = await getNewsWithSentiment({
      industries: industries.join(','),
      limit,
      languages: 'en,fr'
    });

    return {
      industries,
      news: news.data || [],
      sentimentAnalysis: news.sentimentAnalysis || null,
      meta: news.meta || null,
      timestamp: new Date().toISOString(),
      source: 'Marketaux'
    };
  } catch (error) {
    console.error('Error fetching market overview:', error);
    throw error;
  }
}

// Search news by keyword
export async function searchNews(query, options = {}) {
  try {
    const limit = options.limit || 50;
    
    // Note: Marketaux uses entity matching, so we'll use the query as a search term
    const news = await getNews({
      ...options,
      limit,
      search: query,
      languages: 'en,fr'
    });

    return {
      query,
      news: news.data || [],
      meta: news.meta || null,
      timestamp: new Date().toISOString(),
      source: 'Marketaux'
    };
  } catch (error) {
    console.error('Error searching news:', error);
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
    const { endpoint, symbol, entity, industry, country, limit, timeframe, query, industries } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Parameter "endpoint" is required' });
    }

    let result;
    const parsedLimit = parseInt(limit) || 50;
    const parsedTimeframe = parseInt(timeframe) || 7;

    switch (endpoint) {
      case 'ticker-news':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getTickerNews(symbol, { limit: parsedLimit });
        break;
      case 'ticker-sentiment':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getTickerSentiment(symbol, { limit: parsedLimit });
        break;
      case 'complete':
        if (!symbol) return res.status(400).json({ error: 'Parameter "symbol" is required' });
        result = await getCompleteTickerNews(symbol, { limit: parsedLimit, timeframe: parsedTimeframe });
        break;
      case 'trending':
        result = await getTrendingNews({ limit: parsedLimit });
        break;
      case 'market-overview':
        const industryList = industries ? industries.split(',') : ['Technology', 'Finance', 'Healthcare', 'Energy'];
        result = await getMarketOverview({ industries: industryList, limit: parsedLimit });
        break;
      case 'search':
        if (!query) return res.status(400).json({ error: 'Parameter "query" is required' });
        result = await searchNews(query, { limit: parsedLimit });
        break;
      default:
        return res.status(404).json({ error: `Endpoint "${endpoint}" not found` });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Marketaux API error:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'MARKETAUX_API_KEY not configured'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
