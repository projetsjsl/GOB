/**
 * API Chat Assistant - Endpoint sécurisé pour le chatbot Emma Config
 * Utilise la variable d'environnement GEMINI_API_KEY de Vercel
 */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, context, history } = req.body;

        if (!message || !context) {
            return res.status(400).json({ error: 'Missing message or context' });
        }

        // Récupérer la clé API depuis les variables d'environnement Vercel
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        const GEMINI_MODEL = 'gemini-1.5-flash-latest';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        // Construire l'historique pour Gemini
        const contents = [
            {
                role: 'user',
                parts: [{ text: context }]
            },
            {
                role: 'model',
                parts: [{ text: 'Compris! Je suis prêt à vous aider avec Emma Config. Quelle est votre question?' }]
            }
        ];

        // Ajouter l'historique de conversation
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                });
            });
        }

        // Ajouter le message actuel
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Appeler Gemini
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', response.status, errorText);
            return res.status(500).json({
                error: `Gemini API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid Gemini response:', data);
            return res.status(500).json({ error: 'Invalid response from Gemini' });
        }

        const assistantMessage = data.candidates[0].content.parts[0].text;

        return res.status(200).json({
            success: true,
            message: assistantMessage
        });

    } catch (error) {
        console.error('Chat assistant error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
