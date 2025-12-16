/**
 * API Vercel pour calculer la performance pondérée d'un indice
 * Endpoint: GET /api/sector-index?name=msci_world&horizon=B
 * 
 * Calcule la performance pondérée d'un indice (MSCI World ou S&P/TSX)
 * en appliquant les pondérations sectorielles correspondantes.
 */

// Configuration
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'QGSG95SDH5SE52XS';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Utilise le même système de cache que /api/sector via Supabase
const CACHE_TTL = 3600000; // 1 heure
const CACHE_KEY = 'sector_data_alpha_vantage';

/**
 * Récupère les données sectorielles depuis Alpha Vantage avec cache Supabase
 * (Réutilise la même logique que /api/sector)
 */
async function fetchSectorData() {
  // Essayer de charger depuis Supabase cache d'abord
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Vérifier le cache Supabase
      const { data: cacheData, error: cacheError } = await supabase
        .from('daily_market_cache')
        .select('data, updated_at')
        .eq('cache_type', CACHE_KEY)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();
      
      if (!cacheError && cacheData && cacheData.data) {
        const cacheAge = Date.now() - new Date(cacheData.updated_at).getTime();
        if (cacheAge < CACHE_TTL) {
          console.log('📦 Utilisation du cache Supabase');
          return cacheData.data;
        }
      }
    }
  } catch (cacheError) {
    console.warn('⚠️ Erreur cache Supabase, fallback sur API directe:', cacheError.message);
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
      // Si quota dépassé, essayer de retourner le cache même s'il est expiré
      console.warn('⚠️ Quota Alpha Vantage dépassé, tentative de retourner cache expiré');
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: staleCache } = await supabase
            .from('daily_market_cache')
            .select('data')
            .eq('cache_type', CACHE_KEY)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          
          if (staleCache && staleCache.data) {
            console.log('📦 Retour du cache expiré (mieux que rien)');
            return staleCache.data;
          }
        }
      } catch (e) {
        // Ignorer erreur cache
      }
      throw new Error(`Quota Alpha Vantage dépassé: ${data.Note}`);
    }
    
    if (data.Information) {
      throw new Error(`Information API: ${data.Information}`);
    }

    if (!data['Rank A: Real-Time Performance']) {
      throw new Error('Format de réponse inattendu de l\'API Alpha Vantage');
    }

    // Sauvegarder dans le cache Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('daily_market_cache')
          .upsert({
            date: new Date().toISOString().split('T')[0],
            cache_type: CACHE_KEY,
            data: data,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'date,cache_type'
          });
        console.log('✅ Données sectorielles sauvegardées dans cache Supabase');
      }
    } catch (cacheError) {
      console.warn('⚠️ Erreur sauvegarde cache Supabase:', cacheError.message);
    }

    console.log('✅ Données sectorielles récupérées');
    return data;

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des données:', error.message);
    throw error;
  }
}

// Mapping des secteurs Alpha Vantage vers les noms standardisés
const SECTOR_MAPPING = {
  'Communication Services': 'Services de communication',
  'Consumer Discretionary': 'Consommation discrétionnaire',
  'Consumer Staples': 'Consommation courante',
  'Energy': 'Énergie',
  'Financials': 'Financiers',
  'Health Care': 'Santé',
  'Industrials': 'Industriels',
  'Information Technology': 'Technologie de l\'information',
  'Materials': 'Matériaux',
  'Real Estate': 'Immobilier',
  'Utilities': 'Services publics'
};

// Pondérations sectorielles MSCI World (juillet 2025)
const MSCI_WORLD_WEIGHTS = {
  'Technologie de l\'information': 26.9,
  'Financiers': 16.7,
  'Industriels': 11.4,
  'Consommation discrétionnaire': 10.1,
  'Santé': 9.12,
  'Services de communication': 8.48,
  'Consommation courante': 5.75,
  'Énergie': 3.52,
  'Matériaux': 3.15,
  'Services publics': 2.65,
  'Immobilier': 1.97
};

// Pondérations sectorielles S&P/TSX (31 décembre 2024)
const SPTSX_WEIGHTS = {
  'Financiers': 33.0,
  'Énergie': 17.1,
  'Industriels': 12.6,
  'Technologie de l\'information': 10.1,
  'Matériaux': 11.4,
  'Consommation courante': 4.0,
  'Consommation discrétionnaire': 3.3,
  'Services de communication': 2.4,
  'Immobilier': 2.0,
  'Services publics': 3.8,
  'Santé': 0.3
};

/**
 * Convertit le nom de secteur Alpha Vantage vers le nom standardisé
 */
function normalizeSectorName(alphaVantageName) {
  // Chercher dans le mapping
  for (const [avName, stdName] of Object.entries(SECTOR_MAPPING)) {
    if (alphaVantageName === avName || alphaVantageName.includes(avName)) {
      return stdName;
    }
  }
  // Si non trouvé, retourner tel quel
  return alphaVantageName;
}

/**
 * Calcule la performance pondérée d'un indice
 */
function calculateIndexPerformance(sectorData, indexName, horizon) {
  const weights = indexName.toLowerCase() === 'msci_world' ? MSCI_WORLD_WEIGHTS : SPTSX_WEIGHTS;
  const rankKey = `Rank ${horizon}: Real-Time Performance`;

  if (!sectorData[rankKey]) {
    throw new Error(`Horizon "${horizon}" non trouvé dans les données`);
  }

  const contributions = [];
  let totalPerformance = 0;
  let totalWeight = 0;

  // Parcourir tous les secteurs dans les données
  for (const [sectorName, performance] of Object.entries(sectorData[rankKey])) {
    const normalizedSector = normalizeSectorName(sectorName);
    const weight = weights[normalizedSector];

    if (weight !== undefined) {
      const perf = parseFloat(performance);
      if (!isNaN(perf)) {
        const contribution = (weight / 100) * perf;
        contributions.push({
          sector: normalizedSector,
          originalName: sectorName,
          weight: weight,
          performance: perf,
          contribution: contribution
        });
        totalPerformance += contribution;
        totalWeight += weight;
      }
    }
  }

  // Normaliser si le total des poids n'est pas exactement 100%
  if (totalWeight !== 100) {
    const adjustmentFactor = 100 / totalWeight;
    totalPerformance = totalPerformance * adjustmentFactor;
    contributions.forEach(c => {
      c.weight = c.weight * adjustmentFactor;
      c.contribution = c.contribution * adjustmentFactor;
    });
  }

  return {
    index: indexName,
    horizon: horizon,
    totalPerformance: totalPerformance,
    totalWeight: totalWeight,
    contributions: contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
  };
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
    const { name, horizon } = req.query;

    if (!name) {
      // Valeur par défaut pour faciliter les tests
      const defaultName = 'msci_world';
      console.log(`⚠️ Paramètre name manquant, utilisation de la valeur par défaut: ${defaultName}`);
      return res.status(400).json({
        success: false,
        error: 'Paramètre "name" requis (msci_world ou sptsx)',
        suggestion: `Utilisez ?name=${defaultName}&horizon=B pour tester`,
        example: `${req.url.split('?')[0]}?name=${defaultName}&horizon=B`
      });
    }
      });
    }

    if (!horizon) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "horizon" requis (A, B, C, D, E, F, G, H, I, ou J)'
      });
    }

    if (name !== 'msci_world' && name !== 'sptsx') {
      return res.status(400).json({
        success: false,
        error: 'Paramètre "name" doit être "msci_world" ou "sptsx"'
      });
    }

    const validHorizons = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    if (!validHorizons.includes(horizon.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Paramètre "horizon" doit être l'une des valeurs: ${validHorizons.join(', ')}`
      });
    }

    // Récupérer les données sectorielles
    try {
      const sectorData = await fetchSectorData();
      const result = calculateIndexPerformance(sectorData, name, horizon.toUpperCase());

      return res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    } catch (sectorError) {
      // ✅ FIX: Gérer les erreurs de fetchSectorData gracieusement
      console.error('Erreur récupération données sectorielles:', sectorError);
      
      const isRateLimit = sectorError.message && sectorError.message.includes('Quota');
      const statusCode = isRateLimit ? 429 : 503;
      
      return res.status(statusCode).json({
        success: false,
        error: isRateLimit ? 'Quota Alpha Vantage dépassé' : 'Service temporairement indisponible',
        message: sectorError.message,
        name,
        horizon,
        rateLimitExceeded: isRateLimit,
        suggestion: isRateLimit 
          ? 'Veuillez réessayer dans quelques minutes. Les données sont mises en cache pour 1 heure.'
          : 'Vérifiez la configuration de la clé API Alpha Vantage',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur /api/sector-index:', error);
    
    // ✅ FIX: Distinguer les types d'erreurs pour codes HTTP appropriés
    let statusCode = 500;
    let errorType = 'Erreur serveur';
    
    if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
      statusCode = 401;
      errorType = 'API key invalid';
    } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
      statusCode = 503;
      errorType = 'Service temporarily unavailable';
    } else if (error.message?.includes('quota') || error.message?.includes('Quota')) {
      statusCode = 429;
      errorType = 'Rate limit exceeded';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorType,
      message: error.message,
      timestamp: new Date().toISOString(),
      suggestion: statusCode === 401
        ? 'Vérifiez ALPHA_VANTAGE_API_KEY dans Vercel'
        : statusCode === 429
        ? 'Quota Alpha Vantage dépassé. Réessayez plus tard.'
        : 'Service temporairement indisponible'
    });
  }
}
