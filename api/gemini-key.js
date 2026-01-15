// ========================================
// API ROUTE VERCEL - CLE GEMINI
// ========================================

export default async function handler(req, res) {
  try {
    // Ajouter des headers CORS pour eviter les problemes de cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gerer les requetes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Verifier que c'est une requete GET
    if (req.method !== 'GET') {
      console.log(' Methode non autorisee:', req.method);
      return res.status(405).json({ error: 'Methode non autorisee' });
    }

    console.log(' Tentative de recuperation de la cle API Gemini...');

    // Recuperer la cle API depuis les variables d'environnement Vercel
    const geminiApiKey = process.env.GEMINI_API_KEY;

    console.log(' Variables d\'environnement disponibles:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
    console.log(' Cle API trouvee:', geminiApiKey ? 'OUI (masquee)' : 'NON');

    if (!geminiApiKey) {
      console.log(' Cle API Gemini non configuree');
      return res.status(500).json({
        error: 'Cle API Gemini non configuree',
        message: 'Veuillez configurer la variable d\'environnement GEMINI_API_KEY dans Vercel',
        debug: {
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('GEMINI')),
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log(' Cle API Gemini recuperee avec succes');

    // Retourner seulement la validation (ne pas exposer la cle complete)
    // Si le client a besoin de la cle, il doit l'obtenir via localStorage ou appeler directement l'API
    const keyPreview = `${geminiApiKey.substring(0, 8)}...${geminiApiKey.substring(geminiApiKey.length - 4)}`;

    return res.status(200).json({
      configured: true,
      source: 'vercel-env',
      keyPreview: keyPreview,
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Cle API Gemini configuree sur le serveur. Utilisez /api/gemini-proxy pour les appels.'
    });
  } catch (error) {
    console.error(' Erreur dans gemini-key API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
