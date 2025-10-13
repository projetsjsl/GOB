/**
 * Marketaux API Integration - Version simplifiée
 * Fournit les actualités et l'analyse de sentiment
 */

const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, symbol, limit = 20 } = req.query;

    if (!endpoint) {
      return res.status(400).json({ error: 'Paramètre endpoint requis' });
    }

    const apiKey = process.env.MARKETAUX_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'MARKETAUX_API_KEY not configured'
      });
    }

    let result;

    switch (endpoint) {
      case 'ticker-sentiment':
        if (!symbol) return res.status(400).json({ error: 'Paramètre symbol requis' });
        result = await getTickerSentiment(symbol, parseInt(limit));
        break;
      default:
        return res.status(404).json({ error: `Endpoint "${endpoint}" not found` });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Marketaux API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Get news with sentiment analysis for specific ticker
export async function getTickerSentiment(symbol, limit = 20) {
  const apiKey = process.env.MARKETAUX_API_KEY;
  
  if (!apiKey) {
    throw new Error('MARKETAUX_API_KEY not configured');
  }

  const queryParams = new URLSearchParams({
    symbols: symbol,
    filter_entities: true,
    limit,
    language: 'en,fr',
    api_token: apiKey
  });

  const url = `${MARKETAUX_BASE_URL}/news/all?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Marketaux API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Analyser le sentiment
    const sentimentCounts = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    if (data.data && Array.isArray(data.data)) {
      data.data.forEach(article => {
        if (article.sentiment) {
          const sentiment = article.sentiment.toLowerCase();
          if (sentiment === 'positive') sentimentCounts.positive++;
          else if (sentiment === 'negative') sentimentCounts.negative++;
          else sentimentCounts.neutral++;
        }
      });
    }

    return {
      symbol,
      news: data.data || [],
      sentimentAnalysis: {
        ...sentimentCounts,
        total: data.data?.length || 0,
        positivePercent: data.data?.length > 0 ? (sentimentCounts.positive / data.data.length * 100).toFixed(2) : 0,
        negativePercent: data.data?.length > 0 ? (sentimentCounts.negative / data.data.length * 100).toFixed(2) : 0,
        neutralPercent: data.data?.length > 0 ? (sentimentCounts.neutral / data.data.length * 100).toFixed(2) : 0,
        overallSentiment: sentimentCounts.positive > sentimentCounts.negative ? 'positive' : 
                         sentimentCounts.negative > sentimentCounts.positive ? 'negative' : 'neutral'
      },
      meta: data.meta || null,
      timestamp: new Date().toISOString(),
      source: 'Marketaux'
    };

  } catch (error) {
    console.error('Error fetching ticker sentiment:', error);
    throw error;
  }
}
