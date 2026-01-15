/**
 * API endpoint pour acceder a ChatGPT via l'API OpenAI officielle
 * 
 *  LIMITATION: L'API OpenAI ne permet PAS d'acceder aux chats de groupe partages
 * Cette API cree une nouvelle conversation, pas une connexion au chat de groupe existant
 * 
 * Alternative: Utiliser cette API pour creer un chat integre dans le dashboard
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, conversationId, systemPrompt } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Message requis'
            });
        }

        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
            return res.status(503).json({
                success: false,
                error: 'OPENAI_API_KEY non configuree',
                message: 'Configurez OPENAI_API_KEY dans Vercel pour utiliser cette fonctionnalite'
            });
        }

        // Construire les messages pour l'API OpenAI
        const messages = [];

        // Ajouter le system prompt si fourni
        if (systemPrompt) {
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        // Ajouter le message utilisateur
        messages.push({
            role: 'user',
            content: message
        });

        // Appeler l'API OpenAI Chat Completions
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o', // ou 'gpt-3.5-turbo' pour economiser
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('OpenAI API error:', response.status, errorData);
            return res.status(response.status).json({
                success: false,
                error: 'Erreur API OpenAI',
                details: errorData
            });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return res.status(500).json({
                success: false,
                error: 'Reponse invalide de l\'API OpenAI'
            });
        }

        return res.status(200).json({
            success: true,
            message: data.choices[0].message.content,
            model: data.model,
            usage: data.usage,
            conversationId: conversationId || null,
            note: ' Cette conversation est independante du chat de groupe ChatGPT partage'
        });

    } catch (error) {
        console.error('Erreur API groupchat/chat:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

