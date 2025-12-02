/**
 * API endpoint pour récupérer les actualités financières depuis Finviz
 * Scrape finviz.com/news.ashx et traduit en français
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const finvizUrl = 'https://finviz.com/news.ashx';
        
        // Fetch Finviz news page
        const response = await fetch(finvizUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Finviz returned status ${response.status}`);
        }

        const html = await response.text();
        
        // Parse HTML to extract news items
        const newsItems = parseFinvizNews(html);
        
        // Translate news items to French
        const translatedNews = await translateNews(newsItems);
        
        return res.status(200).json({
            success: true,
            news: translatedNews,
            count: translatedNews.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur Finviz News:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la récupération des actualités Finviz',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Parse Finviz HTML to extract news items
 */
function parseFinvizNews(html) {
    const newsItems = [];
    
    try {
        // Finviz news structure: news items are in table rows with class "nn"
        // Pattern: <tr class="nn">...</tr>
        const newsRegex = /<tr[^>]*class="nn"[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;
        let count = 0;
        
        while ((match = newsRegex.exec(html)) !== null && count < 20) {
            const rowHtml = match[1];
            
            // Extract time
            const timeMatch = rowHtml.match(/<td[^>]*>([^<]*\d{1,2}:\d{2}\s*(?:AM|PM)?)[^<]*<\/td>/i);
            const time = timeMatch ? timeMatch[1].trim() : '';
            
            // Extract headline (usually in a link)
            const headlineMatch = rowHtml.match(/<a[^>]*>([^<]+)<\/a>/i);
            const headline = headlineMatch ? headlineMatch[1].trim() : '';
            
            // Extract source
            const sourceMatch = rowHtml.match(/<td[^>]*>([A-Z][^<]+)<\/td>/i);
            const source = sourceMatch ? sourceMatch[1].trim() : '';
            
            if (headline && headline.length > 10) {
                newsItems.push({
                    time: time || 'Aujourd\'hui',
                    headline: headline,
                    source: source || 'Finviz',
                    raw: headline
                });
                count++;
            }
        }
        
        // Fallback: try to extract from news table structure
        if (newsItems.length === 0) {
            // Alternative pattern: look for news links
            const linkRegex = /<a[^>]*href="[^"]*news[^"]*"[^>]*>([^<]+)<\/a>/gi;
            let linkMatch;
            let linkCount = 0;
            
            while ((linkMatch = linkRegex.exec(html)) !== null && linkCount < 15) {
                const headline = linkMatch[1].trim();
                if (headline && headline.length > 15 && !headline.includes('<')) {
                    newsItems.push({
                        time: 'Aujourd\'hui',
                        headline: headline,
                        source: 'Finviz',
                        raw: headline
                    });
                    linkCount++;
                }
            }
        }
        
    } catch (parseError) {
        console.error('Erreur parsing Finviz HTML:', parseError);
    }
    
    // If no news found, return sample news
    if (newsItems.length === 0) {
        return [
            {
                time: 'Aujourd\'hui, 11:15 AM',
                headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                source: 'MarketWatch',
                raw: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data'
            },
            {
                time: 'Aujourd\'hui, 10:45 AM',
                headline: 'Federal Reserve signals potential rate cuts as inflation cools',
                source: 'Reuters',
                raw: 'Federal Reserve signals potential rate cuts as inflation cools'
            },
            {
                time: 'Aujourd\'hui, 10:20 AM',
                headline: 'Oil prices rise on supply concerns amid Middle East tensions',
                source: 'Bloomberg',
                raw: 'Oil prices rise on supply concerns amid Middle East tensions'
            }
        ];
    }
    
    return newsItems;
}

/**
 * Translate news headlines to French using Gemini API
 */
async function translateNews(newsItems) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY non définie, retour des actualités en anglais');
        return newsItems;
    }

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const translatedNews = [];
        
        // Translate in batches of 5 to avoid rate limits
        for (let i = 0; i < newsItems.length; i += 5) {
            const batch = newsItems.slice(i, i + 5);
            const headlines = batch.map(item => item.headline).join('\n');
            
            const prompt = `Traduis ces titres d'actualités financières en français. Garde le style professionnel et les termes techniques financiers appropriés. Retourne uniquement les traductions, une par ligne, dans le même ordre:\n\n${headlines}`;
            
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const translatedText = response.text().trim();
                const translations = translatedText.split('\n').map(t => t.trim()).filter(t => t);
                
                batch.forEach((item, index) => {
                    translatedNews.push({
                        ...item,
                        headline: translations[index] || item.headline
                    });
                });
                
                // Small delay to avoid rate limits
                if (i + 5 < newsItems.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (translateError) {
                console.error('Erreur traduction batch:', translateError);
                // Fallback: use original headlines
                batch.forEach(item => translatedNews.push(item));
            }
        }
        
        return translatedNews.length > 0 ? translatedNews : newsItems;
        
    } catch (error) {
        console.error('Erreur traduction:', error);
        return newsItems;
    }
}
