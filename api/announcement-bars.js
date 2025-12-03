/**
 * API endpoint pour générer le contenu des barres d'annonces via Gemini avec Google Search
 * Types de barres supportés selon l'article Elfsight :
 * - news: Actualités financières importantes
 * - update: Mises à jour du système
 * - event: Événements économiques
 * - market-alert: Alertes de marché
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
            error: 'GEMINI_API_KEY non configurée'
        });
    }

    try {
        const { type = 'news', section = 'top' } = req.method === 'POST' ? req.body : req.query;

        // Prompts selon le type de barre (basés sur l'article Elfsight)
        const typePrompts = {
            'news': {
                prompt: `Utilise Google Search pour trouver la principale actualité financière de l'heure. Génère un message court (max 80 caractères) pour une barre d'annonce en haut de page. Format: "📰 [Titre accrocheur]"`,
                example: '📰 Tech rally lifts US stocks as traders eye earnings'
            },
            'update': {
                prompt: `Génère un message de mise à jour système court (max 80 caractères) pour une barre d'annonce. Format: "🆕 [Message de mise à jour]"`,
                example: '🆕 Nouvelle fonctionnalité: Analyse IA améliorée disponible'
            },
            'event': {
                prompt: `Utilise Google Search pour trouver le prochain événement économique important (Fed, GDP, emploi, etc.). Génère un message court (max 80 caractères). Format: "📅 [Événement] - [Date/Heure]"`,
                example: '📅 Fed Meeting - 14h00 aujourd\'hui'
            },
            'market-alert': {
                prompt: `Utilise Google Search pour trouver une alerte de marché importante (volatilité, crash, rally). Génère un message court (max 80 caractères). Format: "⚠️ [Alerte]"`,
                example: '⚠️ Volatilité élevée sur les indices US'
            },
            'promotion': {
                prompt: `Génère un message promotionnel court (max 80 caractères) pour services premium. Format: "🎁 [Offre]"`,
                example: '🎁 30% OFF sur Premium - Offre limitée'
            }
        };

        const config = typePrompts[type] || typePrompts['news'];
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: config.prompt }]
                }],
                tools: type === 'news' || type === 'event' || type === 'market-alert' ? [{
                    googleSearchRetrieval: {} // Active Google Search pour données à jour
                }] : undefined,
                generationConfig: {
                    temperature: 0.7,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 150,
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
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || config.example;
        
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

