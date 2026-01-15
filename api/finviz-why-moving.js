/**
 * Finviz "Why Is It Moving?" Extractor
 * Extrait les explications AI-driven des mouvements de prix depuis Finviz
 * Analyse news, reseaux sociaux, SEC filings, et discussions de forums
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
        console.log(` Fetching "Why Is It Moving?" for ${ticker} from Finviz...`);

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

        // Extraire l'explication "Why Is It Moving?"
        // Cette section se trouve generalement dans la section News, avec un format specifique
        // Pattern 1: Section avec explication AI-driven (nouveau format Finviz)
        const whyMovingPatterns = [
            // Pattern pour explication directe dans la section News
            /<div[^>]*class="[^"]*news[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*news-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            // Pattern pour explication dans un tooltip ou popup
            /<div[^>]*title="([^"]*why[^"]*moving[^"]*)"[^>]*>/i,
            // Pattern pour section explicative avec date/heure
            /<div[^>]*class="[^"]*news-date[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<div[^>]*class="[^"]*news-link[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            // Pattern generique pour explication de mouvement
            /why.*moving|reason.*move|explanation.*price|price.*move|stock.*move/i
        ];

        let explanation = null;
        let explanationDate = null;
        let explanationSource = 'Finviz AI';

        // Fonction helper pour nettoyer le HTML
        function cleanHTML(text) {
            if (!text) return '';
            return text
                .replace(/<[^>]+>/g, '') // Enlever tags HTML
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
        }

        // Chercher dans la section News pour trouver l'explication "Why Is It Moving?"
        // Cette section se trouve generalement en haut de la page de cotation
        
        // Pattern 1: Chercher la table/news section principale
        const newsTableMatch = html.match(/<table[^>]*class="[^"]*news[^"]*"[^>]*>([\s\S]{0,5000})<\/table>/i) ||
                              html.match(/<div[^>]*id="[^"]*news[^"]*"[^>]*>([\s\S]{0,5000})<\/div>/i);
        
        if (newsTableMatch) {
            const newsSection = newsTableMatch[1];
            
            // Pattern 2: Chercher le format avec date/heure et explication
            // Format typique: "Jan 15, 10:30AM - Explanation text" ou "Jan 15 - Explanation"
            const dateExplanationPatterns = [
                /<div[^>]*class="[^"]*news-date-small[^"]*"[^>]*>([^<]+)<\/div>\s*<a[^>]*>([^<]+)<\/a>/i,
                /([A-Z][a-z]{2}\s+\d{1,2}(?:,\s+\d{1,2}:\d{2}(?:AM|PM))?)\s*[--]\s*([^<\n]+)/i,
                /<div[^>]*class="[^"]*news-link-left[^"]*"[^>]*>\s*<div[^>]*class="[^"]*news-date-small[^"]*"[^>]*>([^<]+)<\/div>\s*<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/i
            ];
            
            for (const pattern of dateExplanationPatterns) {
                const match = newsSection.match(pattern);
                if (match) {
                    // Le premier match est generalement la date, le second l'explication
                    if (match[1] && match[2]) {
                        explanationDate = match[1].trim();
                        explanation = cleanHTML(match[2].trim());
                        if (explanation && explanation.length > 10) {
                            break;
                        }
                    }
                }
            }
            
            // Si pas trouve avec date, chercher juste la premiere explication significative
            if (!explanation) {
                // Chercher le premier lien de news avec texte explicatif
                const firstNewsLinkPattern = /<div[^>]*class="[^"]*news-link-left[^"]*"[^>]*>[\s\S]*?<a[^>]*href="[^"]*"[^>]*>([^<]{20,200})<\/a>/i;
                const firstNewsMatch = newsSection.match(firstNewsLinkPattern);
                
                if (firstNewsMatch && firstNewsMatch[1]) {
                    explanation = cleanHTML(firstNewsMatch[1].trim());
                    // Extraire la date depuis le contexte
                    const dateMatch = newsSection.match(/([A-Z][a-z]{2}\s+\d{1,2})/);
                    if (dateMatch) {
                        explanationDate = dateMatch[1];
                    }
                }
            }
        }
        
        // Pattern 3: Si toujours pas trouve, chercher dans toute la page HTML
        if (!explanation) {
            // Chercher directement les patterns de news-link-left (format standard Finviz)
            const allNewsPattern = /<div[^>]*class="[^"]*news-link-left[^"]*"[^>]*>[\s\S]*?<div[^>]*class="[^"]*news-date-small[^"]*"[^>]*>([^<]+)<\/div>[\s\S]*?<a[^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/i;
            const allNewsMatch = html.match(allNewsPattern);
            
            if (allNewsMatch) {
                explanationDate = allNewsMatch[1].trim();
                explanation = cleanHTML(allNewsMatch[2].trim());
            }
        }

        // Si pas trouve dans la section News, chercher dans toute la page
        if (!explanation) {
            // Chercher des patterns d'explication generiques
            const genericPatterns = [
                /<div[^>]*class="[^"]*news-link-left[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+(?:earnings|results|announcement|filing|guidance|upgrade|downgrade)[^<]+)<\/a>/i,
                /<td[^>]*class="[^"]*news[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+(?:earnings|results|announcement|filing|guidance)[^<]+)<\/a>/i
            ];

            for (const pattern of genericPatterns) {
                const match = html.match(pattern);
                if (match && match[1]) {
                    explanation = match[1].trim();
                    break;
                }
            }
        }

        // Analyser le type d'explication (earnings, news, filing, etc.)
        const explanationType = analyzeExplanationType(explanation);

        // Enrichir avec Emma AI si disponible (optionnel)
        let enrichedExplanation = null;
        if (explanation && process.env.GEMINI_API_KEY) {
            try {
                enrichedExplanation = await enrichWithAI(ticker, explanation);
            } catch (error) {
                console.warn(' AI enrichment failed, using original explanation');
            }
        }

        const result = {
            success: true,
            ticker: ticker.toUpperCase(),
            explanation: explanation || null,
            explanation_enriched: enrichedExplanation || null,
            date: explanationDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            source: explanationSource,
            type: explanationType,
            timestamp: new Date().toISOString()
        };

        if (!explanation) {
            console.log(` No "Why Is It Moving?" explanation found for ${ticker}`);
            return res.status(200).json({
                ...result,
                message: 'No explanation available at this time'
            });
        }

        console.log(` Found explanation for ${ticker}: ${explanation.substring(0, 60)}...`);

        return res.status(200).json(result);

    } catch (error) {
        console.error(` Error fetching "Why Is It Moving?" for ${ticker}:`, error.message);

        return res.status(500).json({
            error: error.message,
            success: false,
            ticker: ticker.toUpperCase()
        });
    }
}

/**
 * Analyse le type d'explication
 */
function analyzeExplanationType(explanation) {
    if (!explanation) return 'unknown';

    const text = explanation.toLowerCase();

    if (text.includes('earnings') || text.includes('results') || text.includes('quarterly')) {
        return 'earnings';
    }
    if (text.includes('guidance') || text.includes('forecast') || text.includes('outlook')) {
        return 'guidance';
    }
    if (text.includes('filing') || text.includes('sec') || text.includes('form')) {
        return 'filing';
    }
    if (text.includes('upgrade') || text.includes('downgrade') || text.includes('rating')) {
        return 'analyst';
    }
    if (text.includes('acquisition') || text.includes('merger') || text.includes('deal')) {
        return 'm&a';
    }
    if (text.includes('announcement') || text.includes('news') || text.includes('report')) {
        return 'news';
    }
    if (text.includes('product') || text.includes('launch') || text.includes('release')) {
        return 'product';
    }
    if (text.includes('approval') || text.includes('fda') || text.includes('regulatory')) {
        return 'regulatory';
    }

    return 'general';
}

/**
 * Enrichit l'explication avec Emma AI (optionnel)
 */
async function enrichWithAI(ticker, explanation) {
    try {
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/gemini/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Explique brievement (2-3 phrases) pourquoi ${ticker} bouge selon cette information: "${explanation}". Sois concis et factuel.`,
                context: 'financial_analysis'
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.response || data.message || null;
        }
    } catch (error) {
        console.error('AI enrichment error:', error);
    }
    return null;
}

