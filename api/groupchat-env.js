/**
 * API endpoint pour recuperer la variable d'environnement VITE_GROUP_CHAT_URL
 * Utilise par ChatGPTGroupTab pour charger l'URL par defaut
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
        // Recuperer la variable d'environnement
        // Note: En Vercel, les variables VITE_* sont disponibles cote serveur
        // mais doivent etre prefixees VITE_ pour etre accessibles cote client
        const groupChatUrl = process.env.VITE_GROUP_CHAT_URL || '';

        return res.status(200).json({
            success: true,
            url: groupChatUrl,
            configured: Boolean(groupChatUrl)
        });
    } catch (error) {
        console.error('Erreur API groupchat-env:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            url: '',
            configured: false
        });
    }
}
























