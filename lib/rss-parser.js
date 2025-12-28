/**
 * RSS Parser Module
 * Parse les flux RSS des blogs financiers et sources de news
 */

// Mapping des sources vers leurs URLs RSS
const RSS_FEEDS = {
  seeking_alpha: {
    url: 'https://seekingalpha.com/feed.xml',
    name: 'Seeking Alpha',
    category: 'blog'
  },
  zero_hedge: {
    url: 'https://feeds.feedburner.com/zerohedge/feed',
    name: 'Zero Hedge',
    category: 'blog',
    fallback_url: 'https://www.zerohedge.com/rss.xml'
  },
  the_big_picture: {
    url: 'https://www.ritholtz.com/blog/feed/',
    name: 'The Big Picture',
    category: 'blog'
  },
  calculated_risk: {
    url: 'https://www.calculatedriskblog.com/feeds/posts/default',
    name: 'Calculated Risk',
    category: 'blog'
  },
  the_capital_spectator: {
    url: 'https://www.capitalspectator.com/feed/',
    name: 'The Capital Spectator',
    category: 'blog'
  },
  abnormal_returns: {
    url: 'https://abnormalreturns.com/feed/',
    name: 'Abnormal Returns',
    category: 'blog'
  },
  coindesk: {
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    name: 'CoinDesk',
    category: 'crypto'
  },
  cointelegraph: {
    url: 'https://cointelegraph.com/rss',
    name: 'Cointelegraph',
    category: 'crypto'
  },
  cryptoslate: {
    url: 'https://cryptoslate.com/feed/',
    name: 'CryptoSlate',
    category: 'crypto'
  },
  marketwatch: {
    url: 'https://www.marketwatch.com/rss/topstories',
    name: 'MarketWatch',
    category: 'premium'
  },
  cnbc: {
    url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
    name: 'CNBC',
    category: 'premium'
  },
  forbes: {
    url: 'https://www.forbes.com/real-time/feed2/',
    name: 'Forbes',
    category: 'premium'
  },
  fortune: {
    url: 'https://fortune.com/feed/',
    name: 'Fortune',
    category: 'premium'
  },
  business_insider: {
    url: 'https://www.businessinsider.com/rss',
    name: 'Business Insider',
    category: 'premium'
  },
  techcrunch: {
    url: 'https://techcrunch.com/feed/',
    name: 'TechCrunch',
    category: 'premium'
  },
  motley_fool: {
    url: 'https://www.fool.com/feeds/index.aspx',
    name: 'Motley Fool',
    category: 'premium'
  },
  // Sources québécoises et françaises canadiennes
  les_affaires: {
    url: 'https://www.lesaffaires.com/rss',
    name: 'Les Affaires',
    category: 'quebec',
    language: 'fr-CA'
  },
  la_presse: {
    url: 'https://www.lapresse.ca/rss/affaires.xml',
    name: 'La Presse',
    category: 'quebec',
    language: 'fr-CA'
  },
  le_devoir: {
    url: 'https://www.ledevoir.com/rss/economie.xml',
    name: 'Le Devoir',
    category: 'quebec',
    language: 'fr-CA'
  },
  radio_canada_economie: {
    url: 'https://ici.radio-canada.ca/rss/economie.xml',
    name: 'Radio-Canada Économie',
    category: 'quebec',
    language: 'fr-CA'
  },
  journal_montreal: {
    url: 'https://www.journaldemontreal.com/rss/affaires.xml',
    name: 'Le Journal de Montréal',
    category: 'quebec',
    language: 'fr-CA'
  },
  le_soleil: {
    url: 'https://www.lesoleil.com/rss/affaires.xml',
    name: 'Le Soleil',
    category: 'quebec',
    language: 'fr-CA'
  },
  tva_nouvelles: {
    url: 'https://www.tvanouvelles.ca/rss/economie.xml',
    name: 'TVA Nouvelles Économie',
    category: 'quebec',
    language: 'fr-CA'
  },
  bnn_bloomberg_fr: {
    url: 'https://www.bnnbloomberg.ca/fr/rss',
    name: 'BNN Bloomberg (FR)',
    category: 'quebec',
    language: 'fr-CA'
  }
};

/**
 * Parse un flux RSS et retourne les articles
 * Supports fallback URLs for feeds that may have changed
 */
export async function parseRSSFeed(feedKey, limit = 10) {
  const feedConfig = RSS_FEEDS[feedKey];
  if (!feedConfig) {
    throw new Error(`Unknown RSS feed: ${feedKey}`);
  }

  // Try primary URL first, then fallback if available
  const urlsToTry = [feedConfig.url];
  if (feedConfig.fallback_url) {
    urlsToTry.push(feedConfig.fallback_url);
  }

  for (const url of urlsToTry) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        // If this URL fails and we have more to try, continue to next
        if (urlsToTry.indexOf(url) < urlsToTry.length - 1) {
          console.warn(`⚠️ RSS feed ${feedKey} failed at ${url} (${response.status}), trying fallback...`);
          continue;
        }
        throw new Error(`RSS feed error: ${response.status}`);
      }

      const xml = await response.text();
      const articles = parseRSSXML(xml, feedKey, feedConfig);

      return articles.slice(0, limit);

    } catch (error) {
      // If this URL fails and we have more to try, continue to next
      if (urlsToTry.indexOf(url) < urlsToTry.length - 1) {
        console.warn(`⚠️ RSS feed ${feedKey} error at ${url}: ${error.message}, trying fallback...`);
        continue;
      }
      console.error(`❌ RSS parse error for ${feedKey}:`, error.message);
      return [];
    }
  }

  return [];
}

/**
 * Parse XML RSS simple (sans dépendance externe)
 */
function parseRSSXML(xml, feedKey, feedConfig) {
  const articles = [];

  try {
    // Parser simple pour RSS 2.0
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xml)) !== null && articles.length < 20) {
      const itemContent = itemMatch[1];

      // Extraire titre
      const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? cleanHTML(titleMatch[1]) : null;

      // Extraire lien
      const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || 
                        itemContent.match(/<link[^>]*href=["']([^"']+)["']/i);
      const link = linkMatch ? (linkMatch[1] || linkMatch[2]).trim() : null;

      // Extraire description/summary
      const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
                       itemContent.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      const description = descMatch ? cleanHTML(descMatch[1]) : null;

      // Extraire date
      const dateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
                       itemContent.match(/<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
      const pubDate = dateMatch ? parseDate(dateMatch[1]) : new Date().toISOString();

      // Extraire image
      const imageMatch = itemContent.match(/<enclosure[^>]*url=["']([^"']+)["']/i) ||
                        itemContent.match(/<media:content[^>]*url=["']([^"']+)["']/i) ||
                        itemContent.match(/<img[^>]*src=["']([^"']+)["']/i);
      const image = imageMatch ? imageMatch[1] : null;

      if (title && link) {
        articles.push({
          title,
          headline: title,
          summary: description ? description.substring(0, 500) : null,
          url: link,
          published_at: pubDate,
          datetime: pubDate,
          date: pubDate,
          source: feedConfig.name,
          source_provider: 'RSS',
          source_original: feedKey,
          source_key: feedKey,
          image,
          category: feedConfig.category
        });
      }
    }

  } catch (error) {
    console.error(`❌ XML parse error for ${feedKey}:`, error.message);
  }

  return articles;
}

/**
 * Nettoie le HTML d'un texte
 */
function cleanHTML(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]+>/g, '') // Enlever tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Parse une date RSS en ISO string
 */
function parseDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

/**
 * Récupère les articles depuis plusieurs flux RSS
 */
export async function fetchMultipleRSSFeeds(feedKeys, limit = 10) {
  const promises = feedKeys.map(key => parseRSSFeed(key, limit));
  const results = await Promise.allSettled(promises);
  
  const allArticles = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  return allArticles;
}

/**
 * Liste tous les flux RSS disponibles
 */
export function getAvailableRSSFeeds() {
  return Object.keys(RSS_FEEDS).map(key => ({
    key,
    ...RSS_FEEDS[key]
  }));
}

export { RSS_FEEDS };

