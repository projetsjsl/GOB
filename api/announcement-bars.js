/**
 * API endpoint pour generer le contenu des barres d'annonces via Gemini avec Google Search
 * Types de barres supportes selon l'article Elfsight :
 * - news: Actualites financieres importantes
 * - update: Mises a jour du systeme
 * - event: Evenements economiques
 * - market-alert: Alertes de marche
 * - promotion: Promotions sur services premium
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return res.status(503).json({
            success: false,
            error: 'GEMINI_API_KEY non configuree'
        });
    }

    try {
        const { type = 'news', section = 'top', config: customConfig = {} } = req.method === 'POST' ? req.body : req.query;

        // Prompts par defaut selon le type de barre (bases sur l'article Elfsight)
        const typePrompts = {
            'news': {
                prompt: `Utilise Google Search pour trouver la principale actualite financiere de l'heure. Genere un message court (max 80 caracteres) pour une barre d'annonce en haut de page. Format: " [Titre accrocheur]"`,
                example: ' Tech rally lifts US stocks as traders eye earnings'
            },
            'update': {
                prompt: `Genere un message de mise a jour systeme court (max 80 caracteres) pour une barre d'annonce. Format: " [Message de mise a jour]"`,
                example: ' Nouvelle fonctionnalite: Analyse IA amelioree disponible'
            },
            'event': {
                prompt: `Utilise Google Search pour trouver le prochain evenement economique important (Fed, GDP, emploi, etc.). Genere un message court (max 80 caracteres). Format: " [Evenement] - [Date/Heure]"`,
                example: ' Fed Meeting - 14h00 aujourd\'hui'
            },
            'market-alert': {
                prompt: `Utilise Google Search pour trouver une alerte de marche importante (volatilite, crash, rally). Genere un message court (max 80 caracteres). Format: " [Alerte]"`,
                example: ' Volatilite elevee sur les indices US'
            },
            'promotion': {
                prompt: `Genere un message promotionnel court (max 80 caracteres) pour services premium. Format: " [Offre]"`,
                example: ' 30% OFF sur Premium - Offre limitee'
            }
        };

        // Utiliser la configuration personnalisee si fournie, sinon utiliser les valeurs par defaut
        const defaultConfig = typePrompts[type] || typePrompts['news'];
        const prompt = customConfig.prompt || defaultConfig.prompt;
        const temperature = customConfig.temperature !== undefined ? customConfig.temperature : 0.7;
        const maxOutputTokens = customConfig.maxOutputTokens !== undefined ? customConfig.maxOutputTokens : 150;
        const useGoogleSearch = customConfig.useGoogleSearch !== undefined 
            ? customConfig.useGoogleSearch 
            : (type === 'news' || type === 'event' || type === 'market-alert');
        
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
                tools: useGoogleSearch ? [{
                    googleSearchRetrieval: {} // Active Google Search pour donnees a jour
                }] : undefined,
                generationConfig: {
                    temperature: temperature,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: maxOutputTokens,
                    candidateCount: 1
                }
            }),
            signal: AbortSignal.timeout(15000) // 15 secondes timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || defaultConfig.example;
        
        // Nettoyer le contenu (enlever guillemets, espaces en trop)
        const cleanContent = content.trim().replace(/^["']|["']$/g, '');

        return res.status(200).json({
            success: true,
            type,
            section,
            content: cleanContent,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur Announcement Bar API:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            type: req.method === 'POST' ? req.body?.type : req.query?.type
        });
    }
}


