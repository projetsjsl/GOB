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

// Cache via Supabase daily_cache (TTL: 1 heure pour respecter les limites de l'API)
const CACHE_TTL = 3600000; // 1 heure en millisecondes
const CACHE_KEY = 'sector_data_alpha_vantage';

/**
 * Récupère les données sectorielles depuis Alpha Vantage avec cache Supabase
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

    // Vérifier si les données sont valides (plusieurs formats possibles)
    if (!data['Rank A: Real-Time Performance'] && !data['Meta Data'] && !data['Rank B: 1 Day Performance']) {
      // Si quota dépassé ou format inattendu, essayer de retourner le cache même expiré
      console.warn('⚠️ Format de réponse inattendu, tentative de retourner cache expiré');
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
    
    // ✅ FIX: Ne pas throw, retourner une erreur gracieuse
    // Le handler principal gérera l'affichage
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
      source: 'alpha_vantage'
    });
  } catch (error) {
    console.error('Erreur /api/sector:', error);
    
    // Retourner une réponse plus informative
    const isRateLimit = error.message && error.message.includes('Quota');
    const statusCode = isRateLimit ? 429 : 500;
    
    return res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      rateLimitExceeded: isRateLimit,
      suggestion: isRateLimit ? 'Veuillez réessayer dans quelques minutes. Les données sont mises en cache pour 1 heure.' : 'Erreur de l\'API Alpha Vantage'
    });
  }
}














