/**
 * Finviz Latest News Scraper
 * Scrape la dernière nouvelle importante (encadré avec étoiles) depuis Finviz
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { ticker } = req.query;

    if (!ticker) {
        return res.status(400).json({
            error: 'Missing ticker parameter',
            success: false
        });
    }

    try {
        console.log(`🔍 Fetching latest news for ${ticker} from Finviz...`);

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

        // Extraire la dernière nouvelle (encadré avec étoiles)
        // Pattern: <div class="news-link-left">...</div>
        const newsRegex = /<div class="news-link-left">\s*<div class="news-date-small">([^<]+)<\/div>\s*<a[^>]*>([^<]+)<\/a>\s*<\/div>/;
        const match = html.match(newsRegex);

        if (!match) {
            console.log(`⚠️ No latest news found for ${ticker}`);
            return res.status(200).json({
                success: true,
                ticker: ticker.toUpperCase(),
                latestNews: null,
                message: 'No recent news available'
            });
        }

        const [, date, headline] = match;

        // Extraire aussi le lien si disponible
        const linkRegex = /<div class="news-link-left">.*?<a href="([^"]+)">/;
        const linkMatch = html.match(linkRegex);
        const link = linkMatch ? linkMatch[1] : null;

        const newsData = {
            date: date.trim(),
            headline: headline.trim(),
            link: link,
            timestamp: new Date().toISOString()
        };

        console.log(`✅ Latest news found for ${ticker}:`, newsData.headline.substring(0, 50) + '...');

        return res.status(200).json({
            success: true,
            ticker: ticker.toUpperCase(),
            latestNews: newsData
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
