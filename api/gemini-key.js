// ========================================
// API ROUTE VERCEL - CLÉ GEMINI
// ========================================

export default function handler(req, res) {
  // Vérifier que c'est une requête GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Récupérer la clé API depuis les variables d'environnement Vercel
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ 
      error: 'Clé API Gemini non configurée',
      message: 'Veuillez configurer la variable d\'environnement GEMINI_API_KEY dans Vercel'
    });
  }

  // Retourner la clé API (sécurisé côté serveur)
  return res.status(200).json({
    apiKey: geminiApiKey,
    source: 'vercel-env',
    timestamp: new Date().toISOString()
  });
}
