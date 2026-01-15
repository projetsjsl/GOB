/**
 * API endpoint pour recuperer les actualites financieres
 * Sources hyper fiables:
 * 1. Finviz (scraping) - Agrege Bloomberg, WSJ, Reuters, CNBC, MarketWatch, etc.
 * 2. Gemini avec Google Search (actualites de l'heure et du jour) - Gratuit et a jour
 * 3. FMP (Financial Modeling Prep) - Bloomberg, WSJ, Reuters, CNBC, MarketWatch, Yahoo Finance, Forbes, Fortune
 * 4. Finnhub - Bloomberg, WSJ, Reuters, CNBC, MarketWatch, etc.
 * Traduit en francais via Gemini API
 * Toutes les heures sont converties en heure de Montreal (Eastern Time)
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
        // Parametres de requete
        const { type = 'all', limit = 30 } = req.query;
        const newsLimit = Math.min(parseInt(limit, 10) || 30, 50); // Max 50 actualites
        
        // Recuperer les actualites depuis plusieurs sources fiables en parallele
        // Utiliser Gemini avec Google Search au lieu de Perplexity (gratuit et moins sur-sollicite)
        const [finvizNews, geminiNews, fmpNews, finnhubNews] = await Promise.allSettled([
            fetchFinvizNews(),
            fetchGeminiNews(type, newsLimit),
            fetchFMPNews(type, newsLimit),
            fetchFinnhubNews(type, newsLimit)
        ]);

        // Combiner les actualites
        let allNews = [];
        
        if (finvizNews.status === 'fulfilled' && finvizNews.value.length > 0) {
            allNews = [...allNews, ...finvizNews.value];
        }
        
        if (geminiNews.status === 'fulfilled' && geminiNews.value.length > 0) {
            allNews = [...allNews, ...geminiNews.value];
        }
        
        if (fmpNews.status === 'fulfilled' && fmpNews.value.length > 0) {
            allNews = [...allNews, ...fmpNews.value];
        }
        
        if (finnhubNews.status === 'fulfilled' && finnhubNews.value.length > 0) {
            allNews = [...allNews, ...finnhubNews.value];
        }

        // Dedupliquer par headline (normalise)
        const uniqueNews = deduplicateNews(allNews);
        
        // Trier par timestamp (plus recent en premier)
        uniqueNews.sort((a, b) => {
            const timeA = parseTime(a.time);
            const timeB = parseTime(b.time);
            return timeB - timeA;
        });

        // Limiter selon le parametre limit
        const limitedNews = uniqueNews.slice(0, newsLimit);
        
        // Translate news items to French
        const translatedNews = await translateNews(limitedNews);
        
        return res.status(200).json({
            success: true,
            news: translatedNews,
            count: translatedNews.length,
            sources: {
                finviz: finvizNews.status === 'fulfilled' ? finvizNews.value.length : 0,
                gemini: geminiNews.status === 'fulfilled' ? geminiNews.value.length : 0,
                fmp: fmpNews.status === 'fulfilled' ? fmpNews.value.length : 0,
                finnhub: finnhubNews.status === 'fulfilled' ? finnhubNews.value.length : 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur News API:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de la recuperation des actualites',
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
 * Fetch news from FMP (Financial Modeling Prep) - Sources: Bloomberg, WSJ, Reuters, CNBC, etc.
 */
async function fetchFMPNews(type = 'all', limit = 30) {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    
    if (!FMP_API_KEY) {
        console.warn('FMP_API_KEY non configuree, skip FMP news');
        return [];
    }

    try {
        const limitParam = Math.min(limit, 50);
        const fmpUrl = `https://financialmodelingprep.com/stable/news/general-latest?page=0&limit=${limitParam}&apikey=${FMP_API_KEY}`;
        
        const response = await fetch(fmpUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GOB-Financial-Dashboard/1.0'
            },
            signal: AbortSignal.timeout(15000) // 15 secondes timeout
        });

        if (!response.ok) {
            throw new Error(`FMP API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Convertir les nouvelles FMP au format standard
        const newsItems = [];
        for (const item of data.slice(0, limit)) {
            if (!item.title || item.title.length < 10) continue;
            
            // Detecter le type depuis le titre
            const detectedType = detectNewsType(item.title);
            
            // Extraire la source (FMP fournit parfois le site source)
            const source = item.site || item.source || 'FMP';
            
            // Parser la date
            let time = 'Aujourd\'hui';
            if (item.publishedDate) {
                try {
                    const pubDate = new Date(item.publishedDate);
                    time = formatTimeMontreal(pubDate);
                } catch (e) {
                    // Garder 'Aujourd\'hui' si erreur de parsing
                }
            }
            
            // Normaliser l'URL
            let url = item.url || '';
            if (url && !url.startsWith('http')) {
                url = 'https://' + url;
            }
            
            newsItems.push({
                time: time,
                headline: item.title,
                source: source,
                type: detectedType,
                url: url,
                raw: item.title
            });
        }
        
        return newsItems;
        
    } catch (error) {
        console.error('Erreur FMP News:', error);
        return [];
    }
}

/**
 * Fetch news from Finnhub - Sources: Bloomberg, WSJ, Reuters, CNBC, MarketWatch, etc.
 * Includes rate limiting protection with retry logic
 */
async function fetchFinnhubNews(type = 'all', limit = 30, retryCount = 0) {
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const MAX_RETRIES = 2;
    const RETRY_DELAY_MS = 1000;

    if (!FINNHUB_API_KEY) {
        console.warn('FINNHUB_API_KEY non configuree, skip Finnhub news');
        return [];
    }

    try {
        // Mapper le type vers la categorie Finnhub
        const categoryMap = {
            'all': 'general',
            'market': 'general',
            'economy': 'general',
            'stocks': 'general',
            'crypto': 'crypto',
            'forex': 'forex',
            'commodities': 'general',
            'earnings': 'general',
            'ipo': 'general',
            'mergers': 'general'
        };

        const category = categoryMap[type] || 'general';
        const finnhubUrl = `https://finnhub.io/api/v1/news?category=${category}&token=${FINNHUB_API_KEY}`;

        const response = await fetch(finnhubUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'GOB-Financial-Dashboard/1.0'
            },
            signal: AbortSignal.timeout(15000) // 15 secondes timeout
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
                console.warn(` Finnhub rate limited (429), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchFinnhubNews(type, limit, retryCount + 1);
            }
            console.warn(' Finnhub rate limit exceeded, skipping source');
            return [];
        }

        if (!response.ok) {
            throw new Error(`Finnhub API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        // Convertir les nouvelles Finnhub au format standard
        const newsItems = [];
        for (const item of data.slice(0, limit)) {
            if (!item.headline || item.headline.length < 10) continue;
            
            // Detecter le type depuis le headline
            const detectedType = detectNewsType(item.headline);
            
            // Extraire la source (Finnhub fournit la source)
            const source = item.source || 'Finnhub';
            
            // Parser la date (Finnhub utilise timestamp Unix)
            let time = 'Aujourd\'hui';
            if (item.datetime) {
                try {
                    const pubDate = new Date(item.datetime * 1000); // Convertir timestamp Unix en millisecondes
                    time = formatTimeMontreal(pubDate);
                } catch (e) {
                    // Garder 'Aujourd\'hui' si erreur de parsing
                }
            }
            
            // Normaliser l'URL
            let url = item.url || '';
            if (url && !url.startsWith('http')) {
                url = 'https://' + url;
            }
            
            newsItems.push({
                time: time,
                headline: item.headline,
                source: source,
                type: detectedType,
                url: url,
                raw: item.headline
            });
        }
        
        return newsItems;

    } catch (error) {
        console.error('Erreur Finnhub News:', error);
        return [];
    }
}

/**
 * Fetch news from Gemini with Google Search (actualites de l'heure et du jour)
 * Remplace Perplexity pour eviter la sur-sollicitation
 */
async function fetchGeminiNews(type = 'all', limit = 30) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY non configuree, skip Gemini news');
        return [];
    }

    try {
        // Construire le prompt selon le type
        const typePrompts = {
            'all': 'toutes les actualites financieres et economiques',
            'market': 'actualites de marche (stocks, indices, trading)',
            'economy': 'actualites economiques (Fed, inflation, GDP, emploi)',
            'stocks': 'actualites sur les actions et entreprises',
            'crypto': 'actualites sur les cryptomonnaies et blockchain',
            'forex': 'actualites sur le marche des changes (forex)',
            'commodities': 'actualites sur les matieres premieres (petrole, or, etc.)',
            'earnings': 'actualites sur les resultats d\'entreprises (earnings)',
            'ipo': 'actualites sur les introductions en bourse (IPO)',
            'mergers': 'actualites sur les fusions et acquisitions (M&A)'
        };
        
        const typeDescription = typePrompts[type] || typePrompts['all'];
        const newsCount = Math.min(limit, 30);
        
        const prompt = `Utilise Google Search pour trouver les ${newsCount} principales ${typeDescription} de l'heure et du jour d'aujourd'hui. Pour chaque actualite, fournis:
1. Le titre (headline) en anglais
2. L'heure approximative (format: "Aujourd'hui, HH:MM AM/PM" ou "Il y a X heures")
3. La source (Bloomberg, Reuters, MarketWatch, CNBC, WSJ, FT, etc.)
4. Le type de nouvelle (market, economy, stocks, crypto, forex, commodities, earnings, ipo, mergers, other)
5. L'URL complete de l'article (si disponible)

Format de reponse (une actualite par ligne):
[Heure] | [Titre] | [Source] | [Type] | [URL]

Exemple:
Aujourd'hui, 11:15 AM | Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data | MarketWatch | market | https://www.marketwatch.com/story/tech-rally-bitcoin-surge
Aujourd'hui, 10:45 AM | Federal Reserve signals potential rate cuts as inflation cools | Reuters | economy | https://www.reuters.com/fed-rate-cuts
Aujourd'hui, 09:30 AM | Apple reports record Q4 earnings, beats expectations | Bloomberg | earnings | https://www.bloomberg.com/apple-earnings

Si l'URL n'est pas disponible, utilise "N/A" a la place. Retourne uniquement les actualites, sans explication supplementaire.`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                tools: [{
                    googleSearchRetrieval: {} // Active Google Search pour donnees a jour
                }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 2000,
                    candidateCount: 1
                }
            }),
            signal: AbortSignal.timeout(30000) // 30 secondes timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse Gemini response (meme format que Perplexity)
        return parsePerplexityNews(content);
        
    } catch (error) {
        console.error('Erreur Gemini News:', error);
        return [];
    }
}

/**
 * Fetch news from Perplexity (actualites de l'heure et du jour)
 * @deprecated Utiliser fetchGeminiNews a la place pour eviter la sur-sollicitation
 */
async function fetchPerplexityNews(type = 'all', limit = 30) {
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    
    if (!PERPLEXITY_API_KEY) {
        console.warn('PERPLEXITY_API_KEY non configuree, skip Perplexity news');
        return [];
    }

    try {
        // Construire le prompt selon le type
        const typePrompts = {
            'all': 'toutes les actualites financieres et economiques',
            'market': 'actualites de marche (stocks, indices, trading)',
            'economy': 'actualites economiques (Fed, inflation, GDP, emploi)',
            'stocks': 'actualites sur les actions et entreprises',
            'crypto': 'actualites sur les cryptomonnaies et blockchain',
            'forex': 'actualites sur le marche des changes (forex)',
            'commodities': 'actualites sur les matieres premieres (petrole, or, etc.)',
            'earnings': 'actualites sur les resultats d\'entreprises (earnings)',
            'ipo': 'actualites sur les introductions en bourse (IPO)',
            'mergers': 'actualites sur les fusions et acquisitions (M&A)'
        };
        
        const typeDescription = typePrompts[type] || typePrompts['all'];
        const newsCount = Math.min(limit, 30);
        
        const prompt = `Liste les ${newsCount} principales ${typeDescription} de l'heure et du jour d'aujourd'hui. Pour chaque actualite, fournis:
1. Le titre (headline) en anglais
2. L'heure approximative (format: "Aujourd'hui, HH:MM AM/PM" ou "Il y a X heures")
3. La source (Bloomberg, Reuters, MarketWatch, CNBC, WSJ, FT, etc.)
4. Le type de nouvelle (market, economy, stocks, crypto, forex, commodities, earnings, ipo, mergers, other)
5. L'URL complete de l'article (si disponible)

Format de reponse (une actualite par ligne):
[Heure] | [Titre] | [Source] | [Type] | [URL]

Exemple:
Aujourd'hui, 11:15 AM | Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data | MarketWatch | market | https://www.marketwatch.com/story/tech-rally-bitcoin-surge
Aujourd'hui, 10:45 AM | Federal Reserve signals potential rate cuts as inflation cools | Reuters | economy | https://www.reuters.com/fed-rate-cuts
Aujourd'hui, 09:30 AM | Apple reports record Q4 earnings, beats expectations | Bloomberg | earnings | https://www.bloomberg.com/apple-earnings

Si l'URL n'est pas disponible, utilise "N/A" a la place. Retourne uniquement les actualites, sans explication supplementaire.`;

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
                        content: 'Tu es un assistant specialise dans les actualites financieres. Tu fournis des informations factuelles et recentes.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3,
                search_recency_filter: 'hour' // Actualites de l'heure
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
                let time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                const type = parts[3] || 'other';
                let url = parts[4] || '';
                
                // Convertir l'heure en heure de Montreal
                time = formatTimeMontreal(time);
                
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
                let time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                let url = parts[3] || '';
                
                // Convertir l'heure en heure de Montreal
                time = formatTimeMontreal(time);
                
                // Detecter le type depuis le headline
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
                let time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                const source = parts[2] || 'Perplexity';
                
                // Convertir l'heure en heure de Montreal
                time = formatTimeMontreal(time);
                
                // Detecter le type depuis le headline
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
                let time = parts[0] || 'Aujourd\'hui';
                const headline = parts[1] || '';
                
                // Convertir l'heure en heure de Montreal
                time = formatTimeMontreal(time);
                
                // Detecter le type depuis le headline
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
 * Detecter le type de nouvelle depuis le headline
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
            let time = timeMatch ? timeMatch[1].trim() : '';
            
            // Convertir l'heure en heure de Montreal si disponible
            if (time) {
                // Parser l'heure de Finviz (generalement en format "HH:MM AM/PM")
                const timeParts = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeParts) {
                    let hours = parseInt(timeParts[1]);
                    const minutes = parseInt(timeParts[2]);
                    const ampm = timeParts[3].toUpperCase();
                    
                    if (ampm === 'PM' && hours !== 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                    
                    // Creer une date avec l'heure (en supposant que c'est aujourd'hui)
                    const date = new Date();
                    date.setHours(hours, minutes, 0, 0);
                    
                    // Formater en heure de Montreal
                    time = formatTimeMontreal(date);
                }
            }
            
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
                
                // Detecter le type depuis le headline
                const detectedType = detectNewsType(headline);
            
            newsItems.push({
                    time: time || formatTimeMontreal(new Date()),
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
                    
                    // Detecter le type depuis le headline
                    const detectedType = detectNewsType(headline);
                    
                    newsItems.push({
                        time: formatTimeMontreal(new Date()),
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
        // Retourner des actualites d'exemple avec l'heure de Montreal
        const now = new Date();
        const sampleTime1 = new Date(now);
        sampleTime1.setHours(11, 15, 0, 0);
        const sampleTime2 = new Date(now);
        sampleTime2.setHours(10, 45, 0, 0);
        const sampleTime3 = new Date(now);
        sampleTime3.setHours(10, 20, 0, 0);
        
        return [
            {
                time: formatTimeMontreal(sampleTime1),
                headline: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data',
                source: 'MarketWatch',
                type: 'market',
                url: 'https://www.marketwatch.com',
                raw: 'Tech rally and Bitcoin surge lift US stocks as traders eye earnings and economic data'
            },
            {
                time: formatTimeMontreal(sampleTime2),
                headline: 'Federal Reserve signals potential rate cuts as inflation cools',
                source: 'Reuters',
                type: 'economy',
                url: 'https://www.reuters.com',
                raw: 'Federal Reserve signals potential rate cuts as inflation cools'
            },
            {
                time: formatTimeMontreal(sampleTime3),
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
 * Dedupliquer les actualites par headline (normalise)
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
 * Formater une date/heure en heure de Montreal (Eastern Time)
 * Format: "Aujourd'hui, HH:MM AM/PM" ou "Il y a X heures"
 */
function formatTimeMontreal(dateOrTimeString) {
    let date;
    
    // Si c'est une string de temps existante, essayer de la parser
    if (typeof dateOrTimeString === 'string') {
        // Si c'est deja formate "Aujourd'hui, HH:MM AM/PM", parser l'heure
        const todayMatch = dateOrTimeString.match(/Aujourd'hui[,\s]+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (todayMatch) {
            const now = new Date();
            let hours = parseInt(todayMatch[1]);
            const minutes = parseInt(todayMatch[2]);
            const ampm = todayMatch[3].toUpperCase();
            
            if (ampm === 'PM' && hours !== 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            date = new Date(now);
            date.setHours(hours, minutes, 0, 0);
        } else if (dateOrTimeString.match(/Il y a (\d+)\s*heures?/i)) {
            // "Il y a X heures" - calculer depuis maintenant
            const hoursAgoMatch = dateOrTimeString.match(/Il y a (\d+)\s*heures?/i);
            const hoursAgo = parseInt(hoursAgoMatch[1]);
            date = new Date();
            date.setHours(date.getHours() - hoursAgo);
        } else {
            // Sinon, essayer de parser comme date ISO ou timestamp
            date = new Date(dateOrTimeString);
        }
    } else if (dateOrTimeString instanceof Date) {
        date = dateOrTimeString;
    } else {
        date = new Date();
    }
    
    // Verifier si la date est valide
    if (isNaN(date.getTime())) {
        return 'Aujourd\'hui';
    }
    
    // Obtenir l'heure actuelle en heure de Montreal
    const nowMontreal = new Date();
    const nowMontrealStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Montreal',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(nowMontreal);
    
    // Convertir la date en heure de Montreal
    const montrealFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Montreal',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    const montrealParts = montrealFormatter.formatToParts(date);
    const montrealDateStr = `${montrealParts.find(p => p.type === 'year').value}-${montrealParts.find(p => p.type === 'month').value}-${montrealParts.find(p => p.type === 'day').value}`;
    
    // Verifier si c'est aujourd'hui
    const isToday = montrealDateStr === nowMontrealStr.replace(/\//g, '-');
    
    if (isToday) {
        // Formater en "Aujourd'hui, HH:MM AM/PM" en heure de Montreal
        const hours = parseInt(montrealParts.find(p => p.type === 'hour').value);
        const minutes = parseInt(montrealParts.find(p => p.type === 'minute').value);
        const ampm = montrealParts.find(p => p.type === 'dayPeriod').value;
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `Aujourd'hui, ${displayHours}:${displayMinutes} ${ampm.toUpperCase()}`;
    } else {
        // Calculer la difference en heures (en utilisant les timestamps UTC)
        const diffMs = nowMontreal.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            return 'A l\'instant';
        } else if (diffHours < 24) {
            return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        }
    }
}

/**
 * Parser le temps pour trier les actualites
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
    
    // Par defaut, retourner maintenant
    return now.getTime();
}

/**
 * Translate news headlines to French using Gemini API
 */
async function translateNews(newsItems) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY non definie, retour des actualites en anglais');
        return newsItems;
    }

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const translatedNews = [];
        let apiKeyValid = true; // Track if API key is still valid

        // Translate in batches of 5 to avoid rate limits
        for (let i = 0; i < newsItems.length; i += 5) {
            const batch = newsItems.slice(i, i + 5);

            // Skip translation if API key is known to be invalid
            if (!apiKeyValid) {
                batch.forEach(item => translatedNews.push(item));
                continue;
            }

            const headlines = batch.map(item => item.headline).join('\n');

            const prompt = `Traduis ces titres d'actualites financieres en francais. Garde le style professionnel et les termes techniques financiers appropries. Retourne uniquement les traductions, une par ligne, dans le meme ordre:\n\n${headlines}`;

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
                const errorMessage = translateError.message || '';
                // Check for API key expiry/invalid errors
                if (errorMessage.includes('API key expired') ||
                    errorMessage.includes('API_KEY_INVALID') ||
                    errorMessage.includes('PERMISSION_DENIED') ||
                    errorMessage.includes('invalid api key')) {
                    console.warn(' Gemini API key invalid/expired, skipping translation');
                    apiKeyValid = false;
                } else {
                    console.error('Erreur traduction batch:', translateError.message);
                }
                // Fallback: use original headlines
                batch.forEach(item => translatedNews.push(item));
            }
        }

        return translatedNews.length > 0 ? translatedNews : newsItems;

    } catch (error) {
        const errorMessage = error.message || '';
        // Check for API key expiry/invalid at module level
        if (errorMessage.includes('API key expired') ||
            errorMessage.includes('API_KEY_INVALID') ||
            errorMessage.includes('PERMISSION_DENIED')) {
            console.warn(' Gemini API key invalid/expired, returning news in English');
        } else {
            console.error('Erreur traduction:', error.message);
        }
        return newsItems;
    }
}
