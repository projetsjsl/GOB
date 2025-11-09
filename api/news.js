/**
 * Unified News API
 * Agrège les actualités depuis multiples sources avec déduplication et scoring
 * Sources: FMP, Finnhub, Finviz, RSS feeds
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Charger la config de scoring
let scoringConfig;
try {
  const configPath = join(process.cwd(), 'config', 'news-sources-scoring.json');
  scoringConfig = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('⚠️ Could not load scoring config, using defaults');
  scoringConfig = {
    criteria_weights: {
      reliability: 0.30,
      financial_relevance: 0.25,
      frequency: 0.15,
      accessibility: 0.15,
      coverage: 0.10,
      cost: 0.05
    },
    contexts: {
      general: { preferred_sources: [] }
    },
    sources: {}
  };
}

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
    const { q, ticker, symbol, limit = 20, context = 'general', strict = false } = req.query;
    const searchQuery = q || ticker || symbol;
    const maxLimit = parseInt(limit, 10) || 20;

    if (!searchQuery && strict) {
      return res.status(400).json({
        error: 'Paramètre q, ticker ou symbol requis',
        success: false
      });
    }

    console.log(`📰 Fetching unified news: query="${searchQuery}", limit=${maxLimit}, context=${context}`);

    // Collecter news depuis toutes les sources en parallèle
    const newsPromises = [];

    // Source 1: FMP News
    if (process.env.FMP_API_KEY) {
      newsPromises.push(fetchFMPNews(searchQuery, maxLimit));
    }

    // Source 2: Finnhub News
    if (process.env.FINNHUB_API_KEY) {
      newsPromises.push(fetchFinnhubNews(searchQuery, maxLimit));
    }

    // Source 3: Finviz News (si ticker fourni)
    if (searchQuery && searchQuery.length <= 5) {
      newsPromises.push(fetchFinvizNews(searchQuery, maxLimit));
    }

    // Attendre toutes les réponses
    const results = await Promise.allSettled(newsPromises);
    const allNews = [];

    // Traiter les résultats
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allNews.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error('❌ News source error:', result.reason?.message || result.reason);
      }
    }

    if (allNews.length === 0) {
      return res.status(200).json({
        success: true,
        articles: [],
        count: 0,
        sources: [],
        message: 'Aucune actualité trouvée',
        timestamp: new Date().toISOString()
      });
    }

    // Déduplication par URL et titre similaire
    const deduplicatedNews = deduplicateNews(allNews);

    // Appliquer scoring de pertinence
    const scoredNews = applyScoring(deduplicatedNews, context);

    // Trier par score puis par date
    scoredNews.sort((a, b) => {
      if (b.relevance_score !== a.relevance_score) {
        return b.relevance_score - a.relevance_score;
      }
      return new Date(b.published_at || b.datetime || b.date) - new Date(a.published_at || a.datetime || a.date);
    });

    // Limiter les résultats
    const limitedNews = scoredNews.slice(0, maxLimit);

    // Extraire les sources utilisées
    const sourcesUsed = [...new Set(limitedNews.map(n => n.source_provider).filter(Boolean))];

    console.log(`✅ Unified news: ${limitedNews.length} articles from ${sourcesUsed.length} sources`);

    return res.status(200).json({
      success: true,
      articles: limitedNews,
      count: limitedNews.length,
      sources: sourcesUsed,
      source: sourcesUsed.join(', '),
      message: `Actualités récupérées depuis ${sourcesUsed.join(', ')}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unified news API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des actualités',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Récupère news depuis FMP
 */
async function fetchFMPNews(query, limit) {
  try {
    const apiKey = process.env.FMP_API_KEY;
    let url;

    if (query && query.length <= 5) {
      // News par ticker
      url = `https://financialmodelingprep.com/stable/news/stock?symbols=${query.toUpperCase()}&apikey=${apiKey}`;
    } else {
      // News générales
      url = `https://financialmodelingprep.com/stable/news/general-latest?page=0&limit=${limit}&apikey=${apiKey}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GOB-Financial-Dashboard/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, limit).map(article => ({
      title: article.title || article.headline,
      headline: article.title || article.headline,
      summary: article.text || article.summary,
      url: article.url,
      published_at: article.publishedDate || article.published_date,
      datetime: article.publishedDate || article.published_date,
      source: article.site || 'FMP',
      source_provider: 'FMP',
      image: article.image,
      symbol: article.symbol || query,
      source_original: article.site || null
    }));

  } catch (error) {
    console.error('❌ FMP news fetch error:', error.message);
    return [];
  }
}

/**
 * Récupère news depuis Finnhub
 */
async function fetchFinnhubNews(query, limit) {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    let url;

    if (query && query.length <= 5) {
      // News par ticker
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      url = `https://finnhub.io/api/v1/company-news?symbol=${query.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
    } else {
      // News générales
      url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.slice(0, limit).map(article => ({
      title: article.headline,
      headline: article.headline,
      summary: article.summary,
      url: article.url,
      published_at: new Date(article.datetime * 1000).toISOString(),
      datetime: new Date(article.datetime * 1000).toISOString(),
      source: article.source || 'Finnhub',
      source_provider: 'Finnhub',
      image: article.image,
      category: article.category,
      source_original: article.source || null
    }));

  } catch (error) {
    console.error('❌ Finnhub news fetch error:', error.message);
    return [];
  }
}

/**
 * Récupère news depuis Finviz
 */
async function fetchFinvizNews(ticker, limit) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/finviz-news?ticker=${ticker.toUpperCase()}&limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Finviz API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success || !data.news) return [];

    return data.news.map(article => ({
      title: article.headline,
      headline: article.headline,
      summary: null,
      url: article.link,
      published_at: article.date,
      datetime: article.date,
      date: article.date,
      source: article.source || 'Finviz',
      source_provider: 'Finviz',
      source_original: article.source || null,
      ticker: ticker.toUpperCase()
    }));

  } catch (error) {
    console.error('❌ Finviz news fetch error:', error.message);
    return [];
  }
}

/**
 * Déduplique les news par URL et titre similaire
 */
function deduplicateNews(news) {
  const seen = new Set();
  const deduplicated = [];

  for (const article of news) {
    const url = article.url;
    const title = (article.title || article.headline || '').toLowerCase().trim();

    // Créer une clé unique basée sur URL ou titre
    let key = url;
    if (!key || key === 'null' || key === 'undefined') {
      key = title.substring(0, 100); // Utiliser les 100 premiers caractères du titre
    }

    // Normaliser l'URL (enlever paramètres de tracking, etc.)
    if (key && key.startsWith('http')) {
      try {
        const urlObj = new URL(key);
        urlObj.searchParams.delete('utm_source');
        urlObj.searchParams.delete('utm_medium');
        urlObj.searchParams.delete('utm_campaign');
        key = urlObj.toString();
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

    if (!seen.has(key) && title.length > 10) {
      seen.add(key);
      deduplicated.push(article);
    }
  }

  return deduplicated;
}

/**
 * Applique le scoring de pertinence selon le contexte
 */
function applyScoring(news, context = 'general') {
  const weights = scoringConfig.criteria_weights;
  const contextConfig = scoringConfig.contexts[context] || scoringConfig.contexts.general;

  return news.map(article => {
    // Identifier la source dans la config
    const sourceKey = findSourceKey(article.source_original || article.source);
    const sourceConfig = sourceKey ? scoringConfig.sources[sourceKey] : null;

    // Score de base depuis config
    let relevanceScore = 5.0; // Score par défaut

    if (sourceConfig) {
      // Calculer score pondéré
      const scores = sourceConfig.scores;
      relevanceScore = (
        scores.reliability * weights.reliability +
        scores.financial_relevance * weights.financial_relevance +
        scores.frequency * weights.frequency +
        scores.accessibility * weights.accessibility +
        scores.coverage * weights.coverage +
        scores.cost * weights.cost
      );
    }

    // Bonus si source préférée pour le contexte
    if (contextConfig.preferred_sources.includes(sourceKey)) {
      relevanceScore += 0.5;
    }

    // Bonus pour récence (plus récent = score plus élevé)
    const publishedDate = new Date(article.published_at || article.datetime || article.date);
    const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) {
      relevanceScore += 1.0; // Bonus pour news < 24h
    } else if (hoursAgo < 48) {
      relevanceScore += 0.5; // Bonus pour news < 48h
    }

    return {
      ...article,
      relevance_score: Math.min(10, Math.max(0, relevanceScore)),
      source_key: sourceKey
    };
  });
}

/**
 * Trouve la clé de source dans la config depuis le nom
 */
function findSourceKey(sourceName) {
  if (!sourceName) return null;

  const normalized = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Mapping direct
  const directMapping = {
    'bloomberg': 'bloomberg',
    'wsj': 'wsj',
    'wall_street_journal': 'wsj',
    'marketwatch': 'marketwatch',
    'reuters': 'reuters',
    'cnbc': 'cnbc',
    'fox_business': 'fox_business',
    'foxbusiness': 'fox_business',
    'bbc': 'bbc',
    'nyt': 'nyt',
    'new_york_times': 'nyt',
    'nytimes': 'nyt',
    'yahoo_finance': 'yahoo_finance',
    'yahoo': 'yahoo_finance',
    'forbes': 'forbes',
    'fortune': 'fortune',
    'barrons': 'barrons',
    'barron': 'barrons',
    'business_insider': 'business_insider',
    'techcrunch': 'techcrunch',
    'seeking_alpha': 'seeking_alpha',
    'seekingalpha': 'seeking_alpha',
    'zero_hedge': 'zero_hedge',
    'zerohedge': 'zero_hedge',
    'motley_fool': 'motley_fool',
    'fool': 'motley_fool',
    'benzinga': 'benzinga',
    'zacks': 'zacks'
  };

  if (directMapping[normalized]) {
    return directMapping[normalized];
  }

  // Recherche partielle
  for (const [key, config] of Object.entries(scoringConfig.sources)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return key;
    }
  }

  return null;
}

