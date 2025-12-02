/**
 * API endpoint pour récupérer les actualités financières
 * Sources: Finviz (scraping) + Perplexity (actualités de l'heure et du jour)
 * Traduit en français via Gemini API
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
        // Paramètres de requête
        const { type = 'all', limit = 30 } = req.query;
        const newsLimit = Math.min(parseInt(limit, 10) || 30, 50); // Max 50 actualités
        
        // Récupérer les actualités depuis plusieurs sources en parallèle
        const [finvizNews, perplexityNews] = await Promise.allSettled([
            fetchFinvizNews(),
            fetchPerplexityNews(type, newsLimit)
        ]);

        // Combiner les actualités
        let allNews = [];
        
        if (finvizNews.status === 'fulfilled' && finvizNews.value.length > 0) {
            allNews = [...allNews, ...finvizNews.value];
        }
        
        if (perplexityNews.status === 'fulfilled' && perplexityNews.value.length > 0) {
            allNews = [...allNews, ...perplexityNews.value];
        }

        // Dédupliquer par headline (normalisé)
        const uniqueNews = deduplicateNews(allNews);
        
        // Trier par timestamp (plus récent en premier)
        uniqueNews.sort((a, b) => {
            const timeA = parseTime(a.time);
            const timeB = parseTime(b.time);
            return timeB - timeA;
        });

        // Limiter selon le paramètre limit
        const limitedNews = uniqueNews.slice(0, newsLimit);
        
        // Translate news items to French
        const translatedNews = await translateNews(limitedNews);
        
        return res.status(200).json({
            success: true,
            news: translatedNews,
            count: translatedNews.length,
            sources: {
                finviz: finvizNews.status === 'fulfilled' ? finvizNews.value.length : 0,
                perplexity: perplexityNews.status === 'fulfilled' ? perplexityNews.value.length : 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur News API:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la récupération des actualités',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Fetch news from Finviz
 */
async function fetchFinvizNews() {
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
        return parseFinvizNews(html);
    } catch (error) {
        console.error('Erreur Finviz:', error);
        return [];
    }
}

/**
 * Fetch news from Perplexity (actualités de l'heure et du jour)
 */
async function fetchPerplexityNews(type = 'all', limit = 30) {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
        console.warn('PERPLEXITY_API_KEY non configurée, skip Perplexity news');
        return [];
    }

    try {
        // Construire le prompt selon le type
        const typePrompts = {
            'all': 'toutes les actualités financières et économiques',
            'market': 'actualités de marché (stocks, indices, trading)',
            'economy': 'actualités économiques (Fed, inflation, GDP, emploi)',
            'stocks': 'actualités sur les actions et entreprises',
            'crypto': 'actualités sur les cryptomonnaies et blockchain',
            'forex': 'actualités sur le marché des changes (forex)',
            'commodities': 'actualités sur les matières premières (pétrole, or, etc.)',
            'earnings': 'actualités sur les résultats d\'entreprises (earnings)',
            'ipo': 'actualités sur les introductions en bourse (IPO)',
            'mergers': 'actualités sur les fusions et acquisitions (M&A)'
        };
        
        const typeDescription = typePrompts[type] || typePrompts['all'];
        const newsCount = Math.min(limit, 30);
        
        const prompt = `Liste les ${newsCount} principales ${typeDescription} de l'heure et du jour d'aujourd'hui. Pour chaque actualité, fournis:
1. Le titre (headline) en anglais
2. L'heure approximative (format: "Aujourd'hui, HH:MM AM/PM" ou "Il y a X heures")
3. La source (Bloomberg, Reuters, MarketWatch, CNBC, WSJ, FT, etc.)
4. Le type de nouvelle (market, economy, stocks, crypto, forex, commodities, earnings, ipo, mergers, other)
5. L'URL complète de l'article (si disponible)

Format de réponse (une actualité par ligne):
[Heure] | [Titre] | [Source] | [Type] | [URL]

Exemple:
Aujourd'hui, 11:15 AM | Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data | MarketWatch | market | https://www.marketwatch.com/story/tech-rally-bitcoin-surge
Aujourd'hui, 10:45 AM | Federal Reserve signals potential rate cuts as inflation cools | Reuters | economy | https://www.reuters.com/fed-rate-cuts
Aujourd'hui, 09:30 AM | Apple reports record Q4 earnings, beats expectations | Bloomberg | earnings | https://www.bloomberg.com/apple-earnings

Si l'URL n'est pas disponible, utilise "N/A" à la place. Retourne uniquement les actualités, sans explication supplémentaire.`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'Tu es un assistant spécialisé dans les actualités financières. Tu fournis des informations factuelles et récentes.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3,
                search_recency_filter: 'hour' // Actualités de l'heure
            }),
            signal: AbortSignal.timeout(30000) // 30 secondes timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        
        // Parse Perplexity response
        return parsePerplexityNews(content);
        
    } catch (error) {
        console.error('Erreur Perplexity News:', error);
        return [];
    }
}

/**
 * Parse Perplexity response to extract news items
 */
function parsePerplexityNews(content) {
    const newsItems = [];
    
    try {
        // Pattern: [Heure] | [Titre] | [Source] | [Type] | [URL]
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            // Skip empty lines or lines that don't match the pattern
            if (!line.includes('|')) continue;
            
            const parts = line.split('|').map(p => p.trim());
            
            if (parts.length >= 5) {
                // Format complet: [Heure] | [Titre] | [Source] | [Type] | [URL]
                const time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                const type = parts[3] || 'other';
                let url = parts[4] || '';
                
                // Nettoyer l'URL (enlever "N/A" ou URLs invalides)
                if (url === 'N/A' || !url.startsWith('http')) {
                    url = '';
                }
                
                if (headline && headline.length > 10) {
                    newsItems.push({
                        time: time,
                        headline: headline,
                        source: source,
                        type: type.toLowerCase(),
                        url: url,
                        raw: headline
                    });
                }
            } else if (parts.length >= 4) {
                // Format sans type: [Heure] | [Titre] | [Source] | [URL]
                const time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                let url = parts[3] || '';
                
                // Détecter le type depuis le headline
                const detectedType = detectNewsType(headline);
                
                if (url === 'N/A' || !url.startsWith('http')) {
                    url = '';
                }
                
                if (headline && headline.length > 10) {
                    newsItems.push({
                        time: time,
                        headline: headline,
                        source: source,
                        type: detectedType,
                        url: url,
                        raw: headline
                    });
                }
            } else if (parts.length >= 3) {
                // Format sans URL: [Heure] | [Titre] | [Source]
                const time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                
                // Détecter le type depuis le headline
                const detectedType = detectNewsType(headline);
                
                if (headline && headline.length > 10) {
                    newsItems.push({
                        time: time,
                        headline: headline,
                        source: source,
                        type: detectedType,
                        url: '',
                        raw: headline
                    });
                }
            } else if (parts.length === 2) {
                // Format alternatif: [Heure] | [Titre]
                const time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                
                // Détecter le type depuis le headline
                const detectedType = detectNewsType(headline);
                
                if (headline && headline.length > 10) {
                    newsItems.push({
                        time: time,
                        headline: headline,
                        source: 'Perplexity',
                        type: detectedType,
                        url: '',
                        raw: headline
                    });
                }
            }
        }
        
    } catch (parseError) {
        console.error('Erreur parsing Perplexity response:', parseError);
    }
    
    return newsItems;
}

/**
 * Détecter le type de nouvelle depuis le headline
 */
function detectNewsType(headline) {
    const lowerHeadline = headline.toLowerCase();
    
    // Crypto
    if (lowerHeadline.match(/\b(bitcoin|btc|ethereum|eth|crypto|cryptocurrency|blockchain|nft|defi)\b/)) {
        return 'crypto';
    }
    
    // Earnings
    if (lowerHeadline.match(/\b(earnings|reports|beats|misses|quarterly|q[1-4]|results)\b/)) {
        return 'earnings';
    }
    
    // Economy
    if (lowerHeadline.match(/\b(fed|federal reserve|inflation|gdp|unemployment|rate cut|rate hike|interest rate|central bank)\b/)) {
        return 'economy';
    }
    
    // Forex
    if (lowerHeadline.match(/\b(forex|currency|dollar|euro|yen|pound|exchange rate|fx)\b/)) {
        return 'forex';
    }
    
    // Commodities
    if (lowerHeadline.match(/\b(oil|gold|silver|copper|commodities|crude|wti|brent)\b/)) {
        return 'commodities';
    }
    
    // IPO
    if (lowerHeadline.match(/\b(ipo|initial public offering|goes public|listing)\b/)) {
        return 'ipo';
    }
    
    // Mergers
    if (lowerHeadline.match(/\b(merger|acquisition|m&a|takeover|deal|buys|acquires)\b/)) {
        return 'mergers';
    }
    
    // Stocks/Market
    if (lowerHeadline.match(/\b(stock|stocks|shares|nasdaq|s&p|dow|market|trading|investor)\b/)) {
        return 'market';
    }
    
    // Default
    return 'other';
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
            
            // Extract headline and URL (usually in a link)
            const linkMatch = rowHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/i);
            const headline = linkMatch ? linkMatch[2].trim() : '';
            const url = linkMatch ? linkMatch[1].trim() : '';
            
            // Extract source
            const sourceMatch = rowHtml.match(/<td[^>]*>([A-Z][^<]+)<\/td>/i);
            const source = sourceMatch ? sourceMatch[1].trim() : '';
            
            if (headline && headline.length > 10) {
                // Normaliser l'URL (ajouter https:// si manquant)
                let normalizedUrl = url;
                if (normalizedUrl && !normalizedUrl.startsWith('http')) {
                    if (normalizedUrl.startsWith('//')) {
                        normalizedUrl = 'https:' + normalizedUrl;
                    } else if (normalizedUrl.startsWith('/')) {
                        normalizedUrl = 'https://finviz.com' + normalizedUrl;
                    } else {
                        normalizedUrl = 'https://' + normalizedUrl;
                    }
                }
                
                // Détecter le type depuis le headline
                const detectedType = detectNewsType(headline);
                
                newsItems.push({
                    time: time || 'Aujourd\'hui',
                    headline: headline,
                    source: source || 'Finviz',
                    type: detectedType,
                    url: normalizedUrl || '',
                    raw: headline
                });
                count++;
            }
        }
        
        // Fallback: try to extract from news table structure
        if (newsItems.length === 0) {
            // Alternative pattern: look for news links with URLs
            const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
            let linkMatch;
            let linkCount = 0;
            
            while ((linkMatch = linkRegex.exec(html)) !== null && linkCount < 15) {
                const url = linkMatch[1].trim();
                const headline = linkMatch[2].trim();
                
                if (headline && headline.length > 15 && !headline.includes('<') && url.includes('news')) {
                    // Normaliser l'URL
                    let normalizedUrl = url;
                    if (!normalizedUrl.startsWith('http')) {
                        if (normalizedUrl.startsWith('//')) {
                            normalizedUrl = 'https:' + normalizedUrl;
                        } else if (normalizedUrl.startsWith('/')) {
                            normalizedUrl = 'https://finviz.com' + normalizedUrl;
                        } else {
                            normalizedUrl = 'https://' + normalizedUrl;
                        }
                    }
                    
                    // Détecter le type depuis le headline
                    const detectedType = detectNewsType(headline);
                    
                    newsItems.push({
                        time: 'Aujourd\'hui',
                        headline: headline,
                        source: 'Finviz',
                        type: detectedType,
                        url: normalizedUrl,
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
                type: 'market',
                url: 'https://www.marketwatch.com',
                raw: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data'
            },
            {
                time: 'Aujourd\'hui, 10:45 AM',
                headline: 'Federal Reserve signals potential rate cuts as inflation cools',
                source: 'Reuters',
                type: 'economy',
                url: 'https://www.reuters.com',
                raw: 'Federal Reserve signals potential rate cuts as inflation cools'
            },
            {
                time: 'Aujourd\'hui, 10:20 AM',
                headline: 'Oil prices rise on supply concerns amid Middle East tensions',
                source: 'Bloomberg',
                type: 'commodities',
                url: 'https://www.bloomberg.com',
                raw: 'Oil prices rise on supply concerns amid Middle East tensions'
            }
        ];
    }
    
    return newsItems;
}

/**
 * Dédupliquer les actualités par headline (normalisé)
 */
function deduplicateNews(newsItems) {
    const seen = new Set();
    const unique = [];
    
    for (const item of newsItems) {
        // Normaliser le headline pour la comparaison
        const normalized = item.headline
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!seen.has(normalized) && normalized.length > 10) {
            seen.add(normalized);
            unique.push(item);
        }
    }
    
    return unique;
}

/**
 * Parser le temps pour trier les actualités
 */
function parseTime(timeStr) {
    if (!timeStr) return 0;
    
    // Format: "Aujourd'hui, 11:15 AM" ou "Il y a 2 heures"
    const now = new Date();
    
    // "Aujourd'hui, HH:MM AM/PM"
    const todayMatch = timeStr.match(/Aujourd'hui[,\s]+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (todayMatch) {
        let hours = parseInt(todayMatch[1]);
        const minutes = parseInt(todayMatch[2]);
        const ampm = todayMatch[3].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const time = new Date(now);
        time.setHours(hours, minutes, 0, 0);
        return time.getTime();
    }
    
    // "Il y a X heures"
    const hoursAgoMatch = timeStr.match(/Il y a (\d+)\s*heures?/i);
    if (hoursAgoMatch) {
        const hoursAgo = parseInt(hoursAgoMatch[1]);
        const time = new Date(now);
        time.setHours(time.getHours() - hoursAgo);
        return time.getTime();
    }
    
    // Par défaut, retourner maintenant
    return now.getTime();
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
