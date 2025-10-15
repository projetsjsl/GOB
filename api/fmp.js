export default async function handler(req, res) {
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
    const apiKey = process.env.FMP_API_KEY;
    
    return res.status(200).json({ 
      status: 'healthy',
      message: 'FMP API opérationnel',
      apiKey: apiKey ? 'Configurée' : 'Manquante',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
}