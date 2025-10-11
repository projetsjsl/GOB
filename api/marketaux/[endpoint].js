/**
 * Marketaux API Dynamic Endpoint Handler
 * Handles all Marketaux API requests through a single endpoint
 */

import marketaux from '../marketaux.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint } = req.query;
    const params = { ...req.query };
    delete params.endpoint;

    // Parse array parameters
    if (params.symbols && typeof params.symbols === 'string') {
      params.symbols = params.symbols.split(',');
    }
    if (params.entities && typeof params.entities === 'string') {
      params.entities = params.entities.split(',');
    }
    if (params.industries && typeof params.industries === 'string') {
      params.industries = params.industries.split(',');
    }
    if (params.countries && typeof params.countries === 'string') {
      params.countries = params.countries.split(',');
    }

    // Parse numeric parameters
    if (params.limit) params.limit = parseInt(params.limit);
    if (params.page) params.page = parseInt(params.page);
    if (params.timeframe) params.timeframe = parseInt(params.timeframe);

    // Parse boolean parameters
    if (params.filterEntities) {
      params.filterEntities = params.filterEntities === 'true';
    }

    let result;

    switch (endpoint) {
      // News endpoints
      case 'news':
        result = await marketaux.getNews(params);
        break;
      
      case 'ticker-news':
        if (!params.symbol) {
          return res.status(400).json({ error: 'Parameter "symbol" is required' });
        }
        result = await marketaux.getTickerNews(params.symbol, params);
        break;
      
      case 'entity-news':
        if (!params.entity) {
          return res.status(400).json({ error: 'Parameter "entity" is required' });
        }
        result = await marketaux.getEntityNews(params.entity, params);
        break;
      
      case 'industry-news':
        if (!params.industry) {
          return res.status(400).json({ error: 'Parameter "industry" is required' });
        }
        result = await marketaux.getIndustryNews(params.industry, params);
        break;
      
      case 'country-news':
        if (!params.country) {
          return res.status(400).json({ error: 'Parameter "country" is required' });
        }
        result = await marketaux.getCountryNews(params.country, params);
        break;

      // Sentiment endpoints
      case 'sentiment':
        result = await marketaux.getNewsWithSentiment(params);
        break;
      
      case 'ticker-sentiment':
        if (!params.symbol) {
          return res.status(400).json({ error: 'Parameter "symbol" is required' });
        }
        result = await marketaux.getTickerSentiment(params.symbol, params);
        break;

      // Trending endpoints
      case 'trending':
        result = await marketaux.getTrendingNews(params);
        break;
      
      case 'popular':
        result = await marketaux.getPopularNews(params);
        break;

      // Combined endpoints
      case 'complete':
        if (!params.symbol) {
          return res.status(400).json({ error: 'Parameter "symbol" is required' });
        }
        result = await marketaux.getCompleteTickerNews(params.symbol, params);
        break;
      
      case 'market-overview':
        result = await marketaux.getMarketOverview(params);
        break;
      
      case 'search':
        if (!params.query) {
          return res.status(400).json({ error: 'Parameter "query" is required' });
        }
        result = await marketaux.searchNews(params.query, params);
        break;

      default:
        return res.status(404).json({ 
          error: 'Endpoint not found',
          availableEndpoints: [
            'news',
            'ticker-news',
            'entity-news',
            'industry-news',
            'country-news',
            'sentiment',
            'ticker-sentiment',
            'trending',
            'popular',
            'complete',
            'market-overview',
            'search'
          ]
        });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Marketaux API error:', error);
    
    if (error.message.includes('not configured')) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'MARKETAUX_API_KEY not configured',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      endpoint: req.query.endpoint
    });
  }
}
