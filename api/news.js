/**
 * Unified News API
 * Agrege les actualites depuis multiples sources avec deduplication et scoring
 * Sources: FMP, Finnhub, Finviz, RSS feeds
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { applyCors } from './_middleware/emma-cors.js';
import { fetchMultipleRSSFeeds, getAvailableRSSFeeds } from '../lib/rss-parser.js';

// Charger la config de scoring
let scoringConfig;
try {
  const configPath = join(process.cwd(), 'config', 'news-sources-scoring.json');
  scoringConfig = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error(' Could not load scoring config, using defaults');
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
  const handled = applyCors(req, res);
  if (handled) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Methode non autorisee' });
  }

  try {
    const { q, ticker, symbol, limit = 20, context = 'general', strict = false } = req.query;
    const searchQuery = q || ticker || symbol;
    const maxLimit = parseInt(limit, 10) || 20;

    if (!searchQuery && strict) {
      return res.status(400).json({
        error: 'Parametre q, ticker ou symbol requis',
        success: false
      });
    }

    console.log(` Fetching unified news: query="${searchQuery}", limit=${maxLimit}, context=${context}`);

    // Collecter news depuis toutes les sources en parallele
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

    // Source 4: RSS Feeds (blogs et sources premium)
    // IMPORTANT: Skip RSS for ticker queries - RSS doesn't support ticker filtering natively
    // Only use RSS for general/topic queries where we search by keyword
    const isTickerQuery = searchQuery && searchQuery.length <= 5;
    if (!isTickerQuery) {
      const rssFeeds = selectRSSFeedsForContext(context);
      if (rssFeeds.length > 0) {
        newsPromises.push(fetchRSSNews(rssFeeds, maxLimit, searchQuery));
      }
    }

    // Attendre toutes les reponses
    const results = await Promise.allSettled(newsPromises);
    const allNews = [];

    // Traiter les resultats
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allNews.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(' News source error:', result.reason?.message || result.reason);
      }
    }

    if (allNews.length === 0) {
      return res.status(200).json({
        success: true,
        articles: [],
        count: 0,
        sources: [],
        message: 'Aucune actualite trouvee',
        timestamp: new Date().toISOString()
      });
    }

    // Deduplication par URL et titre similaire
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

    // Limiter les resultats
    const limitedNews = scoredNews.slice(0, maxLimit);

    // Extraire les sources utilisees
    const sourcesUsed = [...new Set(limitedNews.map(n => n.source_provider).filter(Boolean))];

    console.log(` Unified news: ${limitedNews.length} articles from ${sourcesUsed.length} sources`);

    return res.status(200).json({
      success: true,
      articles: limitedNews,
      count: limitedNews.length,
      sources: sourcesUsed,
      source: sourcesUsed.join(', '),
      message: `Actualites recuperees depuis ${sourcesUsed.join(', ')}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Unified news API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la recuperation des actualites',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      endpoint: '/api/news',
      query: (req.query.q || req.query.ticker || req.query.symbol || 'general').substring(0, 20),
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Recupere news depuis FMP
 */
async function fetchFMPNews(query, limit) {
  try {
    const apiKey = process.env.FMP_API_KEY;
    let url;

    if (query && query.length <= 5) {
      // News par ticker
      url = `https://financialmodelingprep.com/stable/news/stock?symbols=${query.toUpperCase()}&apikey=${apiKey}`;
    } else {
      // News generales
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
    console.error(' FMP news fetch error:', error.message);
    return [];
  }
}

/**
 * Recupere news depuis Finnhub avec gestion du rate limiting
 */
async function fetchFinnhubNews(query, limit, retryCount = 0) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 1000; // 1 second base delay

  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    let url;

    if (query && query.length <= 5) {
      // News par ticker
      const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];
      url = `https://finnhub.io/api/v1/company-news?symbol=${query.toUpperCase()}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
    } else {
      // News generales
      url = `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`;
    }

    const response = await fetch(url);

    // Handle rate limiting (429)
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
        console.warn(` Finnhub rate limited (429), retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchFinnhubNews(query, limit, retryCount + 1);
      }
      console.warn(' Finnhub rate limit exceeded, skipping source');
      return [];
    }

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
    })).filter(article => {
      // STRICT RELEVANCE CHECK
      // Finnhub often returns general news for a ticker query
      // We filter to ensure specific ticker mention if query is a ticker
      if (query && query.length <= 5) {
        const text = ((article.title || '') + ' ' + (article.summary || '')).toLowerCase();
        const qLower = query.toLowerCase();

        // Check for Ticker as whole word
        const regex = new RegExp(`\\b${qLower}\\b`, 'i');
        return regex.test(text);
      }
      return true;
    });

  } catch (error) {
    console.error(' Finnhub news fetch error:', error.message);
    return [];
  }
}

/**
 * Recupere news depuis Finviz
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
    console.error(' Finviz news fetch error:', error.message);
    return [];
  }
}

/**
 * Deduplique les news par URL et titre similaire
 */
function deduplicateNews(news) {
  const seen = new Set();
  const deduplicated = [];

  for (const article of news) {
    const url = article.url;
    const title = (article.title || article.headline || '').toLowerCase().trim();

    // Creer une cle unique basee sur URL ou titre
    let key = url;
    if (!key || key === 'null' || key === 'undefined') {
      key = title.substring(0, 100); // Utiliser les 100 premiers caracteres du titre
    }

    // Normaliser l'URL (enlever parametres de tracking, etc.)
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
    let relevanceScore = 5.0; // Score par defaut

    if (sourceConfig) {
      // Calculer score pondere
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

    // Bonus si source preferee pour le contexte
    if (contextConfig.preferred_sources.includes(sourceKey)) {
      relevanceScore += 0.5;
    }

    // Bonus pour recence (plus recent = score plus eleve)
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
 * Trouve la cle de source dans la config depuis le nom
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

/**
 * Selectionne les flux RSS selon le contexte
 */
function selectRSSFeedsForContext(context) {
  const contextFeeds = {
    general: ['seeking_alpha', 'zero_hedge', 'marketwatch', 'cnbc', 'forbes'],
    crypto: ['coindesk', 'cointelegraph', 'cryptoslate'],
    analysis: ['seeking_alpha', 'the_big_picture', 'calculated_risk', 'the_capital_spectator'],
    sectorial: ['seeking_alpha', 'zero_hedge', 'the_big_picture'],
    quebec: ['les_affaires', 'la_presse', 'le_devoir', 'radio_canada_economie', 'bnn_bloomberg_fr'],
    french_canada: ['les_affaires', 'la_presse', 'le_devoir', 'radio_canada_economie', 'journal_montreal', 'le_soleil', 'tva_nouvelles']
  };

  return contextFeeds[context] || contextFeeds.general;
}

/**
 * Recupere news depuis flux RSS
 */
async function fetchRSSNews(feedKeys, limit, query) {
  try {
    const articles = await fetchMultipleRSSFeeds(feedKeys, Math.ceil(limit / feedKeys.length));
    
    // FIXED: Filter by query if provided - previously only filtered when query.length > 5
    // This caused tickers (1-5 chars) to return unfiltered RSS news
    if (query) {
      // Declare variables from query
      const queryLower = query.toLowerCase();
      const tickerBase = query.toUpperCase().replace(/[^A-Z]/g, '');
      
      // Prepare regex for word boundary matching to avoid partial matches
      // e.g. "T" matching "The", "AI" matching "Main"
      const regex = new RegExp(`\\b(${queryLower}|${tickerBase})\\b`, 'i');
      
      return articles.filter(article => {
        const title = (article.title || '').toLowerCase();
        const summary = (article.summary || '').toLowerCase();
        
        return regex.test(title) || regex.test(summary);
      });
    }

    return articles;
  } catch (error) {
    console.error(' RSS news fetch error:', error.message);
    return [];
  }
}
