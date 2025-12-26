/**
 * Yield Curve API Endpoint
 *
 * Récupère les données de la courbe des taux (yield curve) pour US et Canada
 * Sources de données: FRED API, Bank of Canada API, FMP API
 * Stockage: Supabase pour cache et données historiques
 *
 * Endpoints:
 * - GET /api/yield-curve?country=us (ou canada)
 * - GET /api/yield-curve?country=both (défaut)
 * - GET /api/yield-curve?country=us&date=2024-01-15 (données historiques)
 */
import { createSupabaseClient } from '../lib/supabase-config.js';

const CACHE_CONTROL = 'max-age=0, s-maxage=3600, stale-while-revalidate=86400';

const buckets = new Map();
const WINDOW_MS = 10_000;
const MAX_REQ_PER_WINDOW = 30;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return (req.socket?.remoteAddress ?? 'unknown').toString();
}

function rateLimit(req) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQ_PER_WINDOW) {
    return { ok: false, ip };
  }

  return { ok: true };
}

// Configuration des taux par maturité
const US_TREASURY_RATES = {
  '1M': 'DGS1MO',   // 1 mois
  '3M': 'DGS3MO',   // 3 mois
  '6M': 'DGS6MO',   // 6 mois
  '1Y': 'DGS1',     // 1 an
  '2Y': 'DGS2',     // 2 ans
  '3Y': 'DGS3',     // 3 ans
  '5Y': 'DGS5',     // 5 ans
  '7Y': 'DGS7',     // 7 ans
  '10Y': 'DGS10',   // 10 ans
  '20Y': 'DGS20',   // 20 ans
  '30Y': 'DGS30'    // 30 ans
};

const CANADA_RATES = {
  // Treasury Bills (Bons du Trésor) - Secondary Market
  '1M': 'V39063',
  '2M': 'V39064',
  '3M': 'V39065',
  '6M': 'V39066',
  '1Y': 'V39067',

  // Benchmark Bonds (Obligations Gouvernementales)
  '2Y': 'V39051',
  '3Y': 'V39052',
  '5Y': 'V39053',
  '7Y': 'V39054',
  '10Y': 'V39055',
  '30Y': 'V39056'
};

const CANADA_FALLBACK = [
  { maturity: '1M', rate: 2.25 },
  { maturity: '3M', rate: 2.35 },
  { maturity: '6M', rate: 2.45 },
  { maturity: '1Y', rate: 2.50 },
  { maturity: '2Y', rate: 2.58 },
  { maturity: '3Y', rate: 2.75 },
  { maturity: '5Y', rate: 2.96 },
  { maturity: '7Y', rate: 3.15 },
  { maturity: '10Y', rate: 3.40 },
  { maturity: '30Y', rate: 3.84 }
];

// Convertir la maturité en mois pour le tri
function maturityToMonths(maturity) {
  const value = parseFloat(maturity);
  if (maturity.includes('M')) return value;
  if (maturity.includes('Y')) return value * 12;
  return 0;
}


/**
 * Récupère les données depuis FRED API
 * Récupère l'historique pour calculer la variation sur 1 mois
 * @param {string} seriesId - ID de la série FRED
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel, pour données historiques)
 */
async function fetchFromFRED(seriesId, targetDate = null) {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    console.warn('⚠️ FRED_API_KEY non configurée');
    return null;
  }

  try {
    let url;
    
    if (targetDate) {
      // Récupérer les données pour une date spécifique (historique)
      // FRED nécessite une plage de dates, on prend 30 jours autour de la date cible
      const target = new Date(targetDate);
      const startDate = new Date(target);
      startDate.setDate(startDate.getDate() - 15);
      const endDate = new Date(target);
      endDate.setDate(endDate.getDate() + 15);
      
      url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate.toISOString().split('T')[0]}&observation_end=${endDate.toISOString().split('T')[0]}&sort_order=desc`;
    } else {
      // Récupérer les 30 dernières observations (données actuelles)
      url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=30`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ FRED API erreur pour ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      // Nettoyer les données (' . ' valeurs manquantes)
      const validObs = data.observations.filter(o => o.value !== '.' && o.value !== null);
      
      if (validObs.length === 0) return null;

      let targetObs;
      
      if (targetDate) {
        // Pour données historiques, trouver l'observation la plus proche de la date cible
        const target = new Date(targetDate);
        targetObs = validObs.find(obs => {
          const obsDate = new Date(obs.date);
          return obsDate <= target;
        }) || validObs[validObs.length - 1]; // Prendre la plus récente disponible si pas d'exact match
      } else {
        // Pour données actuelles, prendre la plus récente
        targetObs = validObs[0];
      }

      if (!targetObs) return null;

      // Chercher ~1 mois en arrière (seulement pour données actuelles)
      let prevObs = null;
      if (!targetDate) {
        const prevIndex = Math.min(21, validObs.length - 1);
        prevObs = validObs[prevIndex];
      }

      return {
        value: parseFloat(targetObs.value),
        date: targetObs.date,
        prevValue: prevObs ? parseFloat(prevObs.value) : null,
        change1M: prevObs ? (parseFloat(targetObs.value) - parseFloat(prevObs.value)) : null
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Erreur FRED pour ${seriesId}:`, error.message);
    return null;
  }
}

/**
 * Récupère les données depuis FMP API (fallback pour US Treasury)
 */
async function fetchFromFMP() {
  const FMP_API_KEY = process.env.FMP_API_KEY;

  if (!FMP_API_KEY) {
    console.warn('⚠️ FMP_API_KEY non configurée');
    return null;
  }

  try {
    const url = `https://financialmodelingprep.com/api/v4/treasury?apikey=${FMP_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ FMP API erreur: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    // FMP retourne les taux au format: { date, month1, month2, month3, year1, year2, etc. }
    const latest = data[0];

    return {
      '1M': latest.month1 || null,
      '2M': latest.month2 || null,
      '3M': latest.month3 || null,
      '6M': latest.month6 || null,
      '1Y': latest.year1 || null,
      '2Y': latest.year2 || null,
      '3Y': latest.year3 || null,
      '5Y': latest.year5 || null,
      '7Y': latest.year7 || null,
      '10Y': latest.year10 || null,
      '20Y': latest.year20 || null,
      '30Y': latest.year30 || null,
      date: latest.date
    };
  } catch (error) {
    console.error('❌ Erreur FMP:', error.message);
    return null;
  }
}

/**
 * Récupère la courbe des taux US Treasury
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel, pour données historiques)
 */
async function getUSTreasury(targetDate = null) {
  console.log(`📊 Récupération des taux US Treasury${targetDate ? ` pour la date ${targetDate}` : ' (actuels)'}...`);

  const rates = {};
  let source = 'FRED';
  let fetchDate = null;

  // Essayer FRED en premier
  for (const [maturity, seriesId] of Object.entries(US_TREASURY_RATES)) {
    const data = await fetchFromFRED(seriesId, targetDate);
    if (data) {
      rates[maturity] = data; // Stocker l'objet complet {value, change1M...}
      if (!fetchDate) fetchDate = data.date;
    }
  }

  // Si FRED n'a pas retourné assez de données, essayer FMP
  const validRates = Object.keys(rates).length;
  if (validRates < 5) {
    console.log('⚠️ FRED incomplet, tentative FMP...');
    const fmpData = await fetchFromFMP();

    if (fmpData) {
      source = 'FMP';
      fetchDate = fmpData.date;

      // Merger les données FMP (Note: FMP ne donne pas l'historique dans cette fonction, change1M sera null)
      for (const [maturity, value] of Object.entries(fmpData)) {
        if (maturity !== 'date' && value !== null && !rates[maturity]) {
          rates[maturity] = { value, change1M: null, prevValue: null };
        }
      }
    }
  }

  // Convertir en array et trier par maturité
  const ratesArray = Object.entries(rates)
    .map(([maturity, data]) => ({
      maturity,
      rate: data.value,
      change1M: data.change1M,
      prevValue: data.prevValue,
      months: maturityToMonths(maturity)
    }))
    .sort((a, b) => a.months - b.months);

  return {
    country: 'US',
    currency: 'USD',
    rates: ratesArray,
    source,
    date: fetchDate,
    count: ratesArray.length
  };
}

/**
 * Récupère les données depuis Bank of Canada Valet API pour une date spécifique
 * @param {string} seriesId - ID de la série BoC
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel)
 */
async function fetchFromBoC(seriesId, targetDate = null) {
  try {
    let url;
    
    if (targetDate) {
      // Pour données historiques, récupérer une plage autour de la date cible
      const target = new Date(targetDate);
      const startDate = new Date(target);
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date(target);
      endDate.setDate(endDate.getDate() + 5);
      
      url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
    } else {
      // Récupérer les 30 derniers jours pour trouver la comparaison M-1
      url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?recent=30`;
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ BoC API erreur pour ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      // Trier par date décroissante (le plus récent en premier)
      const sortedObs = data.observations.sort((a, b) => new Date(b.d) - new Date(a.d));
      
      let targetObservation;
      
      if (targetDate) {
        // Pour données historiques, trouver l'observation la plus proche de la date cible
        const target = new Date(targetDate);
        targetObservation = sortedObs.find(obs => {
          const obsDate = new Date(obs.d);
          return obsDate <= target;
        }) || sortedObs[sortedObs.length - 1];
      } else {
        // Pour données actuelles, prendre la plus récente
        targetObservation = sortedObs[0];
      }
      
      if (!targetObservation) return null;
      
      const value = targetObservation[seriesId]?.v;

      if (!value || value === null) return null;

      // Chercher la valeur il y a environ 1 mois (~20-22 jours de trading) - seulement pour données actuelles
      let prevValue = null;
      if (!targetDate) {
        const prevIndex = Math.min(21, sortedObs.length - 1);
        const prevObservation = sortedObs[prevIndex];
        prevValue = prevObservation ? prevObservation[seriesId]?.v : null;
      }

      return {
        value: parseFloat(value),
        date: targetObservation.d,
        prevValue: prevValue ? parseFloat(prevValue) : null,
        change1M: prevValue ? (parseFloat(value) - parseFloat(prevValue)) : null
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Erreur BoC pour ${seriesId}:`, error.message);
    return null;
  }
}

/**
 * Récupère la courbe des taux Canada
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel, pour données historiques)
 */
async function getCanadaRates(targetDate = null) {
  console.log(`📊 Récupération des taux Canada (via Bank of Canada)${targetDate ? ` pour la date ${targetDate}` : ' (actuels)'}...`);

  const rates = {};
  let fetchDate = null;

  // Récupérer depuis Bank of Canada
  for (const [maturity, seriesId] of Object.entries(CANADA_RATES)) {
    const data = await fetchFromBoC(seriesId, targetDate);
    if (data) {
      rates[maturity] = data; // Stocker l'objet complet
      if (!fetchDate) fetchDate = data.date;
    }
  }

  // Convertir en array et trier par maturité
  let ratesArray = Object.entries(rates)
    .map(([maturity, data]) => ({
      maturity,
      rate: data.value,
      change1M: data.change1M,
      prevValue: data.prevValue,
      months: maturityToMonths(maturity)
    }))
    .sort((a, b) => a.months - b.months);

  if (ratesArray.length === 0) {
    console.warn('⚠️ Aucun taux Canada via API - utilisation des valeurs par défaut');
    ratesArray = CANADA_FALLBACK.map(item => ({
      maturity: item.maturity,
      rate: item.rate,
      change1M: null, // Pas de variation pour le fallback
      prevValue: null,
      months: maturityToMonths(item.maturity)
    }));
    fetchDate = new Date().toISOString().split('T')[0];
  }

  return {
    country: 'Canada',
    currency: 'CAD',
    rates: ratesArray,
    source: 'Bank of Canada',
    date: fetchDate,
    count: ratesArray.length
  };
}

/**
 * Récupère les données depuis Supabase
 * @param {string} country - 'us' ou 'canada'
 * @param {string} date - Date au format YYYY-MM-DD (null pour données actuelles)
 */
async function getFromSupabase(country, date = null) {
  try {
    const supabase = createSupabaseClient(true); // Service role pour lecture
    
    let query = supabase
      .from('yield_curve_data')
      .select('*')
      .eq('country', country)
      .order('data_date', { ascending: false })
      .limit(1);
    
    if (date) {
      // Pour données historiques, chercher la date exacte ou la plus proche
      query = supabase
        .from('yield_curve_data')
        .select('*')
        .eq('country', country)
        .lte('data_date', date)
        .order('data_date', { ascending: false })
        .limit(1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.warn(`⚠️ Erreur Supabase pour ${country}:`, error.message);
      return null;
    }
    
    if (data && data.length > 0) {
      const record = data[0];
      console.log(`✅ Données ${country} trouvées dans Supabase pour ${record.data_date}`);
      
      // Convertir le format Supabase vers le format API
      // Les rates sont stockés en JSONB et sont déjà au bon format
      return {
        country: record.country === 'us' ? 'US' : 'Canada',
        currency: record.currency,
        rates: Array.isArray(record.rates) ? record.rates : [], // S'assurer que c'est un array
        source: record.source,
        date: record.data_date,
        count: record.count || (Array.isArray(record.rates) ? record.rates.length : 0),
        spread_10y_2y: record.spread_10y_2y,
        inverted: record.inverted || false
      };
    }
    
    return null;
  } catch (error) {
    console.warn(`⚠️ Erreur Supabase pour ${country}:`, error.message);
    return null;
  }
}

/**
 * Stocke les données dans Supabase
 * @param {string} country - 'us' ou 'canada'
 * @param {object} yieldData - Données de yield curve
 */
async function saveToSupabase(country, yieldData) {
  try {
    const supabase = createSupabaseClient(true); // Service role pour écriture
    
    // Calculer spread_10y_2y si disponible
    let spread_10y_2y = null;
    let inverted = false;
    
    if (yieldData.rates && Array.isArray(yieldData.rates)) {
      const rate10Y = yieldData.rates.find(r => r.maturity === '10Y');
      const rate2Y = yieldData.rates.find(r => r.maturity === '2Y');
      
      if (rate10Y && rate2Y) {
        spread_10y_2y = rate10Y.rate - rate2Y.rate;
        inverted = spread_10y_2y < 0;
      }
    }
    
    const record = {
      country: country.toLowerCase(),
      data_date: yieldData.date,
      rates: yieldData.rates,
      source: yieldData.source,
      currency: yieldData.currency,
      count: yieldData.count,
      spread_10y_2y: spread_10y_2y,
      inverted: inverted
    };
    
    const { error } = await supabase
      .from('yield_curve_data')
      .upsert(record, { onConflict: 'country,data_date' });
    
    if (error) {
      console.warn(`⚠️ Erreur sauvegarde Supabase pour ${country}:`, error.message);
    } else {
      console.log(`✅ Données ${country} sauvegardées dans Supabase pour ${yieldData.date}`);
    }
  } catch (error) {
    console.warn(`⚠️ Erreur sauvegarde Supabase pour ${country}:`, error.message);
  }
}

/**
 * Handler principal Vercel
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rate = rateLimit(req);
    if (!rate.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(429).json({ error: 'Rate limited' });
    }

    const { country = 'both', date = null } = req.query;

    console.log(`🔍 Requête yield curve: country=${country}, date=${date || 'actuelle'}`);

    const result = {
      timestamp: new Date().toISOString(),
      data: {},
      historicalDate: date || null
    };

    // Récupérer les données selon le pays demandé
    // Pour les données historiques, vérifier Supabase en premier
    // Pour les données actuelles, vérifier Supabase (cache du jour) puis API si nécessaire
    
    if (country === 'us' || country === 'both') {
      // Essayer Supabase d'abord
      let usData = await getFromSupabase('us', date);
      
      // Si pas dans Supabase ou si données actuelles et plus vieilles que 1 jour, récupérer via API
      const today = new Date().toISOString().split('T')[0];
      const shouldFetchFromAPI = !usData || (!date && usData.date !== today);
      
      if (shouldFetchFromAPI) {
        console.log('📡 Récupération US depuis API...');
        usData = await getUSTreasury(date);
        
        // Sauvegarder dans Supabase si récupération réussie
        if (usData && usData.rates && usData.rates.length > 0) {
          await saveToSupabase('us', usData);
        }
      }
      
      if (usData) {
        result.data.us = usData;
      }
    }

    if (country === 'canada' || country === 'both') {
      // Essayer Supabase d'abord
      let canadaData = await getFromSupabase('canada', date);
      
      // Si pas dans Supabase ou si données actuelles et plus vieilles que 1 jour, récupérer via API
      const today = new Date().toISOString().split('T')[0];
      const shouldFetchFromAPI = !canadaData || (!date && canadaData.date !== today);
      
      if (shouldFetchFromAPI) {
        console.log('📡 Récupération Canada depuis API...');
        canadaData = await getCanadaRates(date);
        
        // Sauvegarder dans Supabase si récupération réussie
        if (canadaData && canadaData.rates && canadaData.rates.length > 0) {
          await saveToSupabase('canada', canadaData);
        }
      }
      
      if (canadaData) {
        result.data.canada = canadaData;
      }
    }

    // Le spread est déjà calculé dans saveToSupabase et getFromSupabase
    // Mais on peut le recalculer si nécessaire pour cohérence
    if (result.data.us && result.data.us.rates && !result.data.us.spread_10y_2y) {
      const rate10Y = result.data.us.rates.find(r => r.maturity === '10Y');
      const rate2Y = result.data.us.rates.find(r => r.maturity === '2Y');

      if (rate10Y && rate2Y) {
        result.data.us.spread_10y_2y = rate10Y.rate - rate2Y.rate;
        result.data.us.inverted = result.data.us.spread_10y_2y < 0;
      }
    }

    console.log(`✅ Yield curve récupérée: US=${result.data.us?.count || 0} points, Canada=${result.data.canada?.count || 0} points`);

    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur yield-curve:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({
      error: 'Erreur lors de la récupération de la yield curve',
      message: error.message
    });
  }
}
