/**
 * Market Data API - Version simplifiée
 * Fournit les données de marché depuis plusieurs sources
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
    const { endpoint, symbol, source = 'auto' } = req.query;

    if (!endpoint || !symbol) {
      return res.status(400).json({ 
        error: 'Paramètres endpoint et symbol requis',
        availableEndpoints: ['quote', 'fundamentals', 'profile']
      });
    }

    let result;

    switch (endpoint) {
      case 'quote':
        result = await getQuote(symbol, source);
        break;
      case 'fundamentals':
        result = await getFundamentals(symbol, source);
        break;
      case 'profile':
        result = await getProfile(symbol, source);
        break;
      default:
        return res.status(404).json({ 
          error: `Endpoint "${endpoint}" non trouvé`,
          availableEndpoints: ['quote', 'fundamentals', 'profile']
        });
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Market Data API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Récupérer les données de prix
export async function getQuote(symbol, source = 'auto') {
  try {
    // Utiliser FMP comme source principale
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/fmp?endpoint=quote&symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Formater les données pour compatibilité
    return {
      c: data.price || data.c,           // Prix actuel
      d: data.change || data.d,          // Variation
      dp: data.changesPercentage || data.dp, // Pourcentage de variation
      h: data.dayHigh || data.h,         // Plus haut du jour
      l: data.dayLow || data.l,          // Plus bas du jour
      o: data.open || data.o,            // Prix d'ouverture
      pc: data.previousClose || data.pc, // Prix de clôture précédent
      volume: data.volume || 0,          // Volume
      timestamp: new Date().toISOString(),
      source: 'FMP'
    };

  } catch (error) {
    console.error('Error fetching quote:', error);
    throw error;
  }
}

// Récupérer les fondamentaux
export async function getFundamentals(symbol, source = 'auto') {
  try {
    // Utiliser FMP pour les fondamentaux
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/fmp?endpoint=profile&symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      symbol,
      companyName: data.companyName || data.name,
      sector: data.sector,
      industry: data.industry,
      marketCap: data.mktCap || data.marketCapitalization,
      sharesOutstanding: data.sharesOutstanding,
      eps: data.eps,
      pe: data.pe,
      pb: data.pb,
      ps: data.ps,
      dividendYield: data.lastDiv || 0,
      website: data.website,
      description: data.description,
      timestamp: new Date().toISOString(),
      source: 'FMP'
    };

  } catch (error) {
    console.error('Error fetching fundamentals:', error);
    throw error;
  }
}

// Récupérer le profil de l'entreprise
export async function getProfile(symbol, source = 'auto') {
  try {
    // Utiliser FMP pour le profil
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/fmp?endpoint=profile&symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`FMP API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      symbol,
      name: data.companyName || data.name,
      sector: data.sector,
      industry: data.industry,
      country: data.country,
      exchange: data.exchange,
      marketCapitalization: data.mktCap || data.marketCapitalization,
      sharesOutstanding: data.sharesOutstanding,
      website: data.website,
      description: data.description,
      employees: data.fullTimeEmployees,
      timestamp: new Date().toISOString(),
      source: 'FMP'
    };

  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
}
