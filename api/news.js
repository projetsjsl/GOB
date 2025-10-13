/**
 * News API - Version simplifiée
 * Fournit les actualités financières
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q, limit = 10, strict = false } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Paramètre q (query) requis' });
    }

    // Simulation des actualités (en attendant la configuration de NewsAPI)
    const mockNews = {
      articles: [
        {
          title: `Actualités financières pour ${q}`,
          description: `Dernières nouvelles concernant ${q} et le marché financier.`,
          url: `https://example.com/news/${q}`,
          publishedAt: new Date().toISOString(),
          source: { name: 'Financial News' }
        }
      ],
      totalResults: 1,
      status: 'ok'
    };

    res.status(200).json(mockNews);

  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Fonction exportée pour compatibilité
export async function getNews(query, limit = 10) {
  return {
    articles: [
      {
        title: `Actualités pour ${query}`,
        description: `Dernières nouvelles concernant ${query}.`,
        url: `https://example.com/news/${query}`,
        publishedAt: new Date().toISOString(),
        source: { name: 'Financial News' }
      }
    ],
    totalResults: 1,
    status: 'ok'
  };
}
