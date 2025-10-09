// ========================================
// GEMINI SIMPLE - Version de test sans function calling
// API Route pour tester la connexion Gemini de base
// ========================================

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { message, temperature = 0.3 } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message requis' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY non configurée');
        return res.status(500).json({ error: 'Clé API Gemini non configurée' });
    }

    try {
        console.log('🔧 Test Gemini Simple');
        console.log('📝 Message:', message);
        console.log('🌡️ Température:', temperature);
        console.log('🔑 Clé API présente:', !!GEMINI_API_KEY);

        // Appel direct à Gemini sans function calling
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }],
                generationConfig: {
                    temperature: temperature,
                    topK: 20,
                    topP: 0.8,
                    maxOutputTokens: 4096,
                    candidateCount: 1
                }
            })
        });

        console.log('📡 Statut de réponse Gemini:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur Gemini:', response.status, errorText);
            throw new Error(`Erreur Gemini: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📊 Réponse Gemini reçue:', Object.keys(data));

        // Extraire la réponse
        let responseText = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            responseText = data.candidates[0].content.parts[0].text;
        } else {
            console.error('❌ Structure de réponse inattendue:', data);
            throw new Error('Structure de réponse invalide');
        }

        console.log('✅ Réponse extraite:', responseText.substring(0, 100) + '...');

        return res.status(200).json({
            response: responseText,
            temperature: temperature,
            timestamp: new Date().toISOString(),
            source: 'gemini-simple'
        });
        
    } catch (error) {
        console.error('❌ Erreur dans gemini-simple:', error);
        return res.status(500).json({ 
            error: 'Erreur lors de la génération de la réponse',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
