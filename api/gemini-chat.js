// ========================================
// API ROUTE VERCEL - CHAT GEMINI
// ========================================

export default async function handler(req, res) {
  try {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Vérifier que c'est une requête POST
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Méthode non autorisée',
        method: req.method,
        allowed: ['POST', 'OPTIONS']
      });
    }

    // Récupérer la clé API depuis les variables d'environnement Vercel
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return res.status(500).json({ 
        error: 'Clé API Gemini non configurée',
        message: 'Veuillez configurer la variable d\'environnement GEMINI_API_KEY dans Vercel'
      });
    }

    // Récupérer le message de l'utilisateur
    const { message, prompt } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        error: 'Message requis',
        message: 'Veuillez fournir un message à envoyer à Gemini'
      });
    }

    // Construire le prompt final
    const finalPrompt = prompt ? `${prompt}\n\n${message}` : message;

    // Appeler l'API Gemini côté serveur
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: finalPrompt
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      return res.status(geminiResponse.status).json({
        error: 'Erreur API Gemini',
        message: errorData.error?.message || `HTTP ${geminiResponse.status}`,
        details: errorData
      });
    }

    const geminiData = await geminiResponse.json();
    
    // Extraire la réponse de Gemini
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Aucune réponse générée';

    // Retourner la réponse
    return res.status(200).json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString(),
      model: 'gemini-pro'
    });

  } catch (error) {
    console.error('Erreur dans gemini-chat API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}