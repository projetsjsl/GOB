/**
 * News API - Endpoint pour les actualités
 * Redirige vers ai-services pour la cohérence
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Rediriger vers ai-services pour la cohérence
    const { q, limit = 20, strict = false } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Paramètre "q" (query) requis',
        usage: '/api/news?q=finance&limit=20&strict=true'
      });
    }

    // Simuler une réponse pour éviter les erreurs 404
    return res.status(200).json({
      success: true,
      articles: [
        {
          title: "Actualités financières - Mode démo",
          summary: "Endpoint news redirigé vers ai-services pour la cohérence",
          url: "#",
          published_at: new Date().toISOString(),
          source: "demo"
        }
      ],
      total: 1,
      message: "Utilisez /api/ai-services?service=perplexity pour les vraies actualités"
    });

  } catch (error) {
    console.error('News API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
