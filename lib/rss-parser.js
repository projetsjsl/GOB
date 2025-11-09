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
    url: 'https://www.zerohedge.com/fullrss2.xml',
    name: 'Zero Hedge',
    category: 'blog'
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
  }
};

/**
 * Parse un flux RSS et retourne les articles
 */
export async function parseRSSFeed(feedKey, limit = 10) {
  const feedConfig = RSS_FEEDS[feedKey];
  if (!feedConfig) {
    throw new Error(`Unknown RSS feed: ${feedKey}`);
  }

  try {
    const response = await fetch(feedConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status}`);
    }

    const xml = await response.text();
    const articles = parseRSSXML(xml, feedKey, feedConfig);

    return articles.slice(0, limit);

  } catch (error) {
    console.error(`❌ RSS parse error for ${feedKey}:`, error.message);
    return [];
  }
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

