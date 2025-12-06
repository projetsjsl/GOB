/**
 * API Vercel pour récupérer les données sectorielles Alpha Vantage
 * Endpoint: GET /api/sector
 * 
 * Cette fonction récupère le JSON brut de l'API SECTOR d'Alpha Vantage
 * avec un système de cache pour respecter les limites de l'API.
 */

// Configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'QGSG95SDH5SE52XS';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Cache simple en mémoire (TTL: 60 secondes pour respecter les limites de l'API)
// Note: En serverless, le cache est partagé entre les invocations de la même instance
const cache = {
  data: null,
  timestamp: null,
  ttl: 60000 // 60 secondes
};

/**
 * Récupère les données sectorielles depuis Alpha Vantage avec cache
 */
async function fetchSectorData() {
  // Vérifier le cache
  if (cache.data && cache.timestamp && (Date.now() - cache.timestamp) < cache.ttl) {
    console.log('📦 Utilisation du cache');
    return cache.data;
  }

  try {
    const url = `${ALPHA_VANTAGE_BASE_URL}?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`;
    console.log(`🔍 Appel Alpha Vantage: ${url.replace(ALPHA_VANTAGE_API_KEY, '***')}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Vérifier les erreurs de l'API
    if (data.Note) {
      throw new Error(`Quota Alpha Vantage dépassé: ${data.Note}`);
    }
    
    if (data.Information) {
      throw new Error(`Information API: ${data.Information}`);
    }

    if (!data['Rank A: Real-Time Performance']) {
      throw new Error('Format de réponse inattendu de l\'API Alpha Vantage');
    }

    // Mettre en cache
    cache.data = data;
    cache.timestamp = Date.now();

    console.log('✅ Données sectorielles récupérées et mises en cache');
    return data;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  try {
    const data = await fetchSectorData();
    
    return res.status(200).json({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      cached: (Date.now() - cache.timestamp) < cache.ttl
    });
  } catch (error) {
    console.error('Erreur /api/sector:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}







