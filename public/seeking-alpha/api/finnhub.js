// api/finnhub.js
// API Route serverless Vercel pour gérer les appels Finnhub

export default async function handler(req, res) {
  // Configurer CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Récupérer la clé API depuis les variables d'environnement Vercel
  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

  if (!FINNHUB_API_KEY) {
    return res.status(200).json({ 
      message: 'FINNHUB_API_KEY non configurée - Veuillez configurer la variable d\'environnement dans Vercel',
      c: 0,
      d: 0,
      dp: 0,
      h: 0,
      l: 0,
      o: 0,
      pc: 0,
      t: Date.now()
    });
  }

  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'Paramètre endpoint manquant' });
  }

  try {
    // Construire l'URL Finnhub
    const queryParams = new URLSearchParams(params);
    queryParams.append('token', FINNHUB_API_KEY);
    
    const finnhubUrl = `https://finnhub.io/api/v1/${endpoint}?${queryParams.toString()}`;

    // Appeler Finnhub API
    const response = await fetch(finnhubUrl);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Mettre en cache pendant 60 secondes
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur Finnhub API:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'appel à Finnhub API',
      details: error.message 
    });
  }
}