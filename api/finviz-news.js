/**
 * Finviz News Scraper
 * Scrape les actualités depuis Finviz avec identification de la source originale
 * Finviz agrège: Bloomberg, WSJ, MarketWatch, Reuters, CNBC, Fox Business, BBC, NYT, Yahoo Finance
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { ticker, limit = 10 } = req.query;

    if (!ticker) {
        return res.status(400).json({
            error: 'Missing ticker parameter',
            success: false
        });
    }

    try {
        console.log(`🔍 Fetching news for ${ticker} from Finviz...`);

        // Fetch page from Finviz
        const url = `https://finviz.com/quote.ashx?t=${ticker.toUpperCase()}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Finviz returned ${response.status}`);
        }

        const html = await response.text();

        // Extraire toutes les news (pas seulement la dernière)
        // Pattern: <div class="news-link-left">...</div> avec source
        const newsPattern = /<div class="news-link-left">\s*<div class="news-date-small">([^<]+)<\/div>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>\s*(?:<div class="news-source">([^<]+)<\/div>)?/g;
        
        const newsItems = [];
        let match;
        let count = 0;
        const maxLimit = parseInt(limit, 10) || 10;

        while ((match = newsPattern.exec(html)) !== null && count < maxLimit) {
            const [, date, link, headline, source] = match;
            
            // Identifier la source originale depuis le lien ou le texte
            const identifiedSource = identifySource(link, headline, source);
            
            newsItems.push({
                date: date.trim(),
                headline: headline.trim(),
                link: link.startsWith('http') ? link : `https://finviz.com${link}`,
                source: identifiedSource,
                source_raw: source ? source.trim() : null,
                timestamp: new Date().toISOString()
            });
            count++;
        }

        if (newsItems.length === 0) {
            console.log(`⚠️ No news found for ${ticker}`);
            return res.status(200).json({
                success: true,
                ticker: ticker.toUpperCase(),
                news: [],
                count: 0,
                message: 'No recent news available'
            });
        }

        console.log(`✅ Found ${newsItems.length} news items for ${ticker}`);

        return res.status(200).json({
            success: true,
            ticker: ticker.toUpperCase(),
            news: newsItems,
            count: newsItems.length,
            sources: [...new Set(newsItems.map(n => n.source).filter(Boolean))]
        });

    } catch (error) {
        console.error(`❌ Error fetching Finviz news for ${ticker}:`, error.message);

        return res.status(500).json({
            error: error.message,
            success: false,
            ticker: ticker.toUpperCase()
        });
    }
}

/**
 * Identifie la source originale depuis le lien ou le texte
 */
function identifySource(link, headline, sourceText) {
    if (!link && !headline && !sourceText) {
        return 'Unknown';
    }

    const text = `${link} ${headline} ${sourceText || ''}`.toLowerCase();

    // Mapping des domaines et patterns vers sources connues
    const sourcePatterns = {
        'bloomberg': ['bloomberg.com', 'bloomberg'],
        'wsj': ['wsj.com', 'wall street journal', 'wsj'],
        'marketwatch': ['marketwatch.com', 'marketwatch'],
        'reuters': ['reuters.com', 'reuters'],
        'cnbc': ['cnbc.com', 'cnbc'],
        'fox_business': ['foxbusiness.com', 'fox business', 'foxbusiness'],
        'bbc': ['bbc.com', 'bbc.co.uk', 'bbc'],
        'nyt': ['nytimes.com', 'new york times', 'ny times'],
        'yahoo_finance': ['yahoo.com/finance', 'yahoo finance', 'finance.yahoo'],
        'forbes': ['forbes.com', 'forbes'],
        'fortune': ['fortune.com', 'fortune'],
        'barrons': ['barrons.com', "barron's", 'barrons'],
        'business_insider': ['businessinsider.com', 'business insider'],
        'techcrunch': ['techcrunch.com', 'techcrunch'],
        'seeking_alpha': ['seekingalpha.com', 'seeking alpha'],
        'zero_hedge': ['zerohedge.com', 'zero hedge'],
        'motley_fool': ['fool.com', 'motley fool', 'fool'],
        'benzinga': ['benzinga.com', 'benzinga'],
        'zacks': ['zacks.com', 'zacks']
    };

    for (const [source, patterns] of Object.entries(sourcePatterns)) {
        for (const pattern of patterns) {
            if (text.includes(pattern)) {
                return source;
            }
        }
    }

    // Si sourceText existe, l'utiliser
    if (sourceText && sourceText.trim()) {
        return sourceText.trim();
    }

    // Extraire le domaine du lien si disponible
    if (link) {
        try {
            const url = new URL(link.startsWith('http') ? link : `https://${link}`);
            const domain = url.hostname.replace('www.', '');
            return domain.split('.')[0]; // Retourne le premier sous-domaine
        } catch (e) {
            // Ignore URL parsing errors
        }
    }

    return 'Unknown';
}
