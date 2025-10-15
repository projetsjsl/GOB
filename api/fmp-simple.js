// ============================================================================
// FMP API SIMPLIFIÉ - Financial Modeling Prep
// Version simplifiée pour corriger les erreurs de déploiement
// ============================================================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test de santé simple
    if (req.method === 'GET' && !req.query.endpoint) {
      return res.status(200).json({ 
        status: 'healthy',
        message: 'FMP API simplifié opérationnel',
        timestamp: new Date().toISOString(),
        apiKey: process.env.FMP_API_KEY ? 'Configurée' : 'Manquante'
      });
    }

    // Vérifier la clé API
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        error: 'FMP_API_KEY manquante',
        message: 'Clé API Financial Modeling Prep non configurée',
        helpUrl: 'https://site.financialmodelingprep.com/',
        steps: [
          '1. Obtenez une clé gratuite (250 req/jour) sur https://site.financialmodelingprep.com/',
          '2. Ajoutez FMP_API_KEY dans Vercel',
          '3. Redéployez l\'application'
        ],
        data: [],
        timestamp: new Date().toISOString()
      });
    }

    // Endpoint simple pour test
    const { endpoint, symbol } = req.query;
    
    if (endpoint === 'quote' && symbol) {
      const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FMP API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return res.status(200).json({
        success: true,
        symbol,
        data: data[0] || {},
        source: 'FMP',
        timestamp: new Date().toISOString()
      });
    }

    // Endpoint par défaut
    return res.status(200).json({
      success: true,
      message: 'FMP API simplifié - Endpoint non spécifié',
      availableEndpoints: ['quote'],
      usage: '?endpoint=quote&symbol=AAPL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('FMP API error:', error);
    return res.status(200).json({
      error: error.message,
      data: [],
      warning: 'API call failed but returning empty data to prevent UI crash',
      timestamp: new Date().toISOString()
    });
  }
}
