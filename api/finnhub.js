// API Finnhub (route serverless racine)
export default async function handler(req, res) {
  // CORS basique
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  const { endpoint, ...params } = req.query || {};

  if (!endpoint) {
    return res.status(400).json({ error: 'Paramètre endpoint manquant' });
  }

  if (!FINNHUB_API_KEY) {
    // Fournir une forme de réponse neutre pour ne pas casser l’UI
    return res.status(200).json({
      message: "FINNHUB_API_KEY non configurée - utilisez /api/marketdata avec source=auto ou ajoutez la clé",
      c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0, t: Date.now(), source: 'missing-key'
    });
  }

  try {
    const search = new URLSearchParams(params);
    search.append('token', FINNHUB_API_KEY);
    const url = `https://finnhub.io/api/v1/${endpoint}?${search.toString()}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Finnhub API error: ${response.status}`);

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur Finnhub API:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'appel Finnhub', details: error.message });
  }
}
