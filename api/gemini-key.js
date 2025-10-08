// ========================================
// API ROUTE VERCEL - CLÉ GEMINI
// ========================================

export default function handler(req, res) {
  try {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Vérifier que c'est une requête GET
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Méthode non autorisée',
        method: req.method,
        allowed: ['GET', 'OPTIONS']
      });
    }

    // Récupérer la clé API depuis les variables d'environnement Vercel
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // Debug info
    const debugInfo = {
      hasApiKey: !!geminiApiKey,
      apiKeyLength: geminiApiKey ? geminiApiKey.length : 0,
      availableEnvVars: Object.keys(process.env).filter(key => 
        key.includes('GEMINI') || key.includes('API')
      ),
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    if (!geminiApiKey) {
      return res.status(500).json({ 
        error: 'Clé API Gemini non configurée',
        message: 'Veuillez configurer la variable d\'environnement GEMINI_API_KEY dans Vercel',
        debug: debugInfo
      });
    }

    // Retourner la clé API (sécurisé côté serveur)
    return res.status(200).json({
      apiKey: geminiApiKey,
      source: 'vercel-env',
      timestamp: new Date().toISOString(),
      status: 'success',
      debug: {
        hasApiKey: true,
        apiKeyLength: geminiApiKey.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur dans gemini-key API:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
