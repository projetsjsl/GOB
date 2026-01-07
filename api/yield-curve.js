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
const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

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

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
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

// Updated Bank of Canada series IDs (December 2024)
// Old V39xxx series are deprecated
const CANADA_RATES = {
  // Treasury Bills (Bons du Trésor) - from tbill_all group
  '1M': 'V80691342',
  '3M': 'V80691344',
  '6M': 'V80691345',
  '1Y': 'V80691346',

  // Benchmark Bonds (Obligations Gouvernementales) - from bond_yields_all group
  '2Y': 'BD.CDN.2YR.DQ.YLD',
  '3Y': 'BD.CDN.3YR.DQ.YLD',
  '5Y': 'BD.CDN.5YR.DQ.YLD',
  '7Y': 'BD.CDN.7YR.DQ.YLD',
  '10Y': 'BD.CDN.10YR.DQ.YLD',
  '30Y': 'BD.CDN.LONG.DQ.YLD'
};

// Updated fallback values based on Dec 2024 rates (only used if all APIs fail)
const CANADA_FALLBACK = [
  { maturity: '1M', rate: 2.12 },
  { maturity: '3M', rate: 2.17 },
  { maturity: '6M', rate: 2.22 },
  { maturity: '1Y', rate: 2.38 },
  { maturity: '2Y', rate: 2.57 },
  { maturity: '3Y', rate: 2.56 },
  { maturity: '5Y', rate: 2.94 },
  { maturity: '7Y', rate: 3.09 },
  { maturity: '10Y', rate: 3.42 },
  { maturity: '30Y', rate: 3.83 }
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

    const response = await fetchWithTimeout(url);

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
 * Récupère les données directement depuis Treasury.gov (NO API KEY REQUIRED)
 * Source officielle du gouvernement américain - très fiable
 */
async function fetchFromTreasuryGov() {
  try {
    const currentYear = new Date().getFullYear();
    const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${currentYear}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${currentYear}&page&_format=csv`;

    console.log('📊 Tentative Treasury.gov (source officielle, sans API key)...');

    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'text/csv',
        'User-Agent': 'GOB-Financial-Dashboard/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.warn(`⚠️ Treasury.gov erreur: ${response.status}`);
      return null;
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    if (lines.length < 2) {
      console.warn('⚠️ Treasury.gov: données insuffisantes');
      return null;
    }

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const colMap = {
      '1M': header.findIndex(h => h === '1 Mo'),
      '2M': header.findIndex(h => h === '2 Mo'),
      '3M': header.findIndex(h => h === '3 Mo'),
      '6M': header.findIndex(h => h === '6 Mo'),
      '1Y': header.findIndex(h => h === '1 Yr'),
      '2Y': header.findIndex(h => h === '2 Yr'),
      '3Y': header.findIndex(h => h === '3 Yr'),
      '5Y': header.findIndex(h => h === '5 Yr'),
      '7Y': header.findIndex(h => h === '7 Yr'),
      '10Y': header.findIndex(h => h === '10 Yr'),
      '20Y': header.findIndex(h => h === '20 Yr'),
      '30Y': header.findIndex(h => h === '30 Yr')
    };

    // Get most recent data (last row with valid data)
    let latestRow = null;
    let prevRow = null;

    for (let i = lines.length - 1; i >= 1; i--) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values[colMap['10Y']] && !isNaN(parseFloat(values[colMap['10Y']]))) {
        if (!latestRow) {
          latestRow = values;
        } else if (!prevRow && i < lines.length - 20) {
          prevRow = values;
          break;
        }
      }
    }

    if (!latestRow) {
      console.warn('⚠️ Treasury.gov: pas de données valides');
      return null;
    }

    const dateIdx = header.findIndex(h => h === 'Date');
    const result = { date: latestRow[dateIdx] || new Date().toISOString().split('T')[0] };

    for (const [maturity, idx] of Object.entries(colMap)) {
      if (idx >= 0 && latestRow[idx]) {
        const value = parseFloat(latestRow[idx]);
        if (!isNaN(value)) {
          result[maturity] = value;
        }
      }
    }

    console.log(`✅ Treasury.gov: ${Object.keys(result).length - 1} taux récupérés`);
    return result;

  } catch (error) {
    console.error('❌ Erreur Treasury.gov:', error.message);
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

    const response = await fetchWithTimeout(url, {}, 10000);

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

    console.log('✅ FMP: taux US récupérés');
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
 * Ordre de priorité pour fiabilité maximale:
 * 1. Treasury.gov (source officielle, PAS DE CLÉ API REQUISE)
 * 2. FMP (1 seul appel API)
 * 3. FRED (multiples appels, nécessite API key)
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel, pour données historiques)
 */
async function getUSTreasury(targetDate = null) {
  console.log(`📊 Récupération des taux US Treasury${targetDate ? ` pour la date ${targetDate}` : ' (actuels)'}...`);

  const rates = {};
  let source = 'Treasury.gov';
  let fetchDate = null;

  // Pour données historiques, utiliser FRED (plus complet pour l'historique)
  if (targetDate) {
    console.log('📊 Données historiques - utilisation de FRED...');
    source = 'FRED';
    // Paralléliser les appels FRED pour l'historique
    const freddPromises = Object.entries(US_TREASURY_RATES).map(async ([maturity, seriesId]) => {
      const data = await fetchFromFRED(seriesId, targetDate);
      return data ? { maturity, data } : null;
    });

    const results = await Promise.all(freddPromises);
    for (const result of results) {
      if (result) {
        rates[result.maturity] = result.data;
        if (!fetchDate) fetchDate = result.data.date;
      }
    }
  } else {
    // Données actuelles: essayer Treasury.gov EN PREMIER (source officielle, pas de clé API!)
    console.log('📊 Données actuelles - tentative Treasury.gov (source officielle, sans API key)...');
    const treasuryData = await fetchFromTreasuryGov();

    if (treasuryData) {
      source = 'Treasury.gov';
      fetchDate = treasuryData.date;

      for (const [maturity, value] of Object.entries(treasuryData)) {
        if (maturity !== 'date' && value !== null && typeof value === 'number') {
          rates[maturity] = { value, change1M: null, prevValue: null };
        }
      }
    }

    // Fallback 1: FMP si Treasury.gov a échoué ou incomplet
    let validRates = Object.keys(rates).length;
    if (validRates < 5) {
      console.log(`⚠️ Treasury.gov incomplet (${validRates} taux), tentative FMP...`);
      const fmpData = await fetchFromFMP();

      if (fmpData) {
        source = 'FMP';
        if (!fetchDate) fetchDate = fmpData.date;

        for (const [maturity, value] of Object.entries(fmpData)) {
          if (maturity !== 'date' && value !== null && !rates[maturity]) {
            rates[maturity] = { value, change1M: null, prevValue: null };
          }
        }
      }
    }

    // Fallback 2: FRED si les sources précédentes ont échoué
    validRates = Object.keys(rates).length;
    if (validRates < 5) {
      console.log(`⚠️ Sources insuffisantes (${validRates} taux), fallback FRED...`);
      source = 'FRED';

      const freddPromises = Object.entries(US_TREASURY_RATES).map(async ([maturity, seriesId]) => {
        if (!rates[maturity]) {
          const data = await fetchFromFRED(seriesId, targetDate);
          return data ? { maturity, data } : null;
        }
        return null;
      });

      const results = await Promise.all(freddPromises);
      for (const result of results) {
        if (result) {
          rates[result.maturity] = result.data;
          if (!fetchDate) fetchDate = result.data.date;
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

  // Log final source utilisée
  console.log(`✅ US Treasury: ${ratesArray.length} taux via ${source}`);

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
 * @param {number} retryCount - Compteur de tentatives pour retry automatique
 */
async function fetchFromBoC(seriesId, targetDate = null, retryCount = 0) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 500;

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

    const response = await fetchWithTimeout(url, {}, 10000);

    // Handle rate limiting or server errors with retry
    if (response.status === 429 || response.status >= 500) {
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchFromBoC(seriesId, targetDate, retryCount + 1);
      }
    }

    if (!response.ok) {
      // Only log once to avoid spam (first attempt only)
      if (retryCount === 0) {
        console.warn(`⚠️ BoC API erreur pour ${seriesId}: ${response.status}`);
      }
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
 * Récupère tous les taux Canada via les groupes API (1-2 appels au lieu de 10+)
 * Plus rapide et plus fiable que les appels individuels
 */
async function fetchCanadaFromGroups() {
  const rates = {};
  let fetchDate = null;

  try {
    // Fetch bond yields and treasury bills in parallel (2 calls instead of 10+)
    const [bondsResponse, tbillsResponse] = await Promise.all([
      fetchWithTimeout('https://www.bankofcanada.ca/valet/observations/group/bond_yields_all/json?recent=30', {}, 15000),
      fetchWithTimeout('https://www.bankofcanada.ca/valet/observations/group/tbill_all/json?recent=30', {}, 15000)
    ]);

    // Process bond yields
    if (bondsResponse.ok) {
      const bondsData = await bondsResponse.json();
      const observations = bondsData.observations || [];

      if (observations.length > 0) {
        // Get most recent observation
        const latest = observations[observations.length - 1];
        fetchDate = latest.d;

        // Map series to maturities
        const bondSeriesMap = {
          'BD.CDN.2YR.DQ.YLD': '2Y',
          'BD.CDN.3YR.DQ.YLD': '3Y',
          'BD.CDN.5YR.DQ.YLD': '5Y',
          'BD.CDN.7YR.DQ.YLD': '7Y',
          'BD.CDN.10YR.DQ.YLD': '10Y',
          'BD.CDN.LONG.DQ.YLD': '30Y'
        };

        for (const [seriesId, maturity] of Object.entries(bondSeriesMap)) {
          if (latest[seriesId] && latest[seriesId].v) {
            const value = parseFloat(latest[seriesId].v);
            // Find previous value (~21 days ago)
            let prevValue = null;
            const prevIdx = Math.max(0, observations.length - 22);
            if (observations[prevIdx] && observations[prevIdx][seriesId]) {
              prevValue = parseFloat(observations[prevIdx][seriesId].v);
            }
            rates[maturity] = {
              value,
              date: fetchDate,
              prevValue,
              change1M: prevValue !== null ? value - prevValue : null
            };
          }
        }
      }
    }

    // Process treasury bills
    if (tbillsResponse.ok) {
      const tbillsData = await tbillsResponse.json();
      const observations = tbillsData.observations || [];

      if (observations.length > 0) {
        const latest = observations[observations.length - 1];
        if (!fetchDate) fetchDate = latest.d;

        const tbillSeriesMap = {
          'V80691342': '1M',
          'V80691344': '3M',
          'V80691345': '6M',
          'V80691346': '1Y'
        };

        for (const [seriesId, maturity] of Object.entries(tbillSeriesMap)) {
          if (latest[seriesId] && latest[seriesId].v) {
            const value = parseFloat(latest[seriesId].v);
            let prevValue = null;
            const prevIdx = Math.max(0, observations.length - 22);
            if (observations[prevIdx] && observations[prevIdx][seriesId]) {
              prevValue = parseFloat(observations[prevIdx][seriesId].v);
            }
            rates[maturity] = {
              value,
              date: fetchDate,
              prevValue,
              change1M: prevValue !== null ? value - prevValue : null
            };
          }
        }
      }
    }

    console.log(`✅ Bank of Canada group API: ${Object.keys(rates).length} taux récupérés`);
    return { rates, fetchDate };

  } catch (error) {
    console.error('❌ Erreur Bank of Canada group API:', error.message);
    return { rates: {}, fetchDate: null };
  }
}

/**
 * Récupère la courbe des taux Canada
 * @param {string} targetDate - Date cible au format YYYY-MM-DD (optionnel, pour données historiques)
 */
async function getCanadaRates(targetDate = null) {
  console.log(`📊 Récupération des taux Canada (via Bank of Canada)${targetDate ? ` pour la date ${targetDate}` : ' (actuels)'}...`);

  let rates = {};
  let fetchDate = null;

  // For current data, try the optimized group API first (2 calls instead of 10+)
  if (!targetDate) {
    console.log('📊 Tentative via group API (optimisé)...');
    const groupResult = await fetchCanadaFromGroups();
    rates = groupResult.rates;
    fetchDate = groupResult.fetchDate;
  }

  // Fallback to individual series calls if group API failed or for historical data
  if (Object.keys(rates).length < 5) {
    console.log('📊 Fallback: appels individuels Bank of Canada...');
    const bocPromises = Object.entries(CANADA_RATES).map(async ([maturity, seriesId]) => {
      const data = await fetchFromBoC(seriesId, targetDate);
      return data ? { maturity, data } : null;
    });

    const results = await Promise.all(bocPromises);
    for (const result of results) {
      if (result && !rates[result.maturity]) {
        rates[result.maturity] = result.data;
        if (!fetchDate) fetchDate = result.data.date;
      }
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
    if (!supabase) return null;
    
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
    console.warn(`⚠️ Supabase non disponible pour ${country}:`, error.message);
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
    if (!supabase) return;
    
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
    console.warn(`⚠️ Supabase non disponible pour sauvegarde:`, error.message);
  }
}

/**
 * Get historical yield curve data from Supabase
 * @param {string} country - 'us' or 'canada'
 * @param {string} period - '1m', '3m', '6m', '1y', '2y'
 */
async function getHistoricalData(country, period = '1m') {
  try {
    const supabase = createSupabaseClient(true);
    if (!supabase) return [];

    // Calculate start date based on period
    const now = new Date();
    let startDate = new Date(now);

    switch (period) {
      case '3m': startDate.setMonth(startDate.getMonth() - 3); break;
      case '6m': startDate.setMonth(startDate.getMonth() - 6); break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); break;
      case '2y': startDate.setFullYear(startDate.getFullYear() - 2); break;
      default: startDate.setMonth(startDate.getMonth() - 1); // 1m default
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('yield_curve_data')
      .select('data_date, rates, spread_10y_2y, inverted, source')
      .eq('country', country.toLowerCase())
      .gte('data_date', startDateStr)
      .order('data_date', { ascending: true });

    if (error) {
      console.warn(`⚠️ Erreur Supabase history pour ${country}:`, error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.warn(`⚠️ Supabase non disponible pour historique:`, error.message);
    return [];
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

    const { country = 'both', date = null, history = null, period = '1m' } = req.query;
    console.log(`📡 [API yield-curve] country=${country}, date=${date}, history=${history}`);

    // Handle history request
    if (history === 'true') {
      try {
        console.log(`📊 Requête historique: country=${country}, period=${period}`);

        const result = {
          timestamp: new Date().toISOString(),
          period,
          history: {}
        };

        if (country === 'us' || country === 'both') {
          result.history.us = await getHistoricalData('us', period);
        }

        if (country === 'canada' || country === 'both') {
          result.history.canada = await getHistoricalData('canada', period);
        }

        res.setHeader('Cache-Control', CACHE_CONTROL);
        return res.status(200).json(result);
      } catch (histError) {
        console.error('❌ Erreur historique:', histError);
        throw histError;
      }
    }

    console.log(`🔍 Requête yield curve: country=${country}, date=${date || 'actuelle'}`);

    const result = {
      timestamp: new Date().toISOString(),
      data: {},
      historicalDate: date || null
    };

    // Récupérer les données selon le pays demandé
    if (country === 'us' || country === 'both') {
      try {
        console.log('🔍 US Data - Checking Supabase...');
        let usData = await getFromSupabase('us', date);
        const today = new Date().toISOString().split('T')[0];
        const shouldFetchFromAPI = !usData || (!date && usData.date !== today);
        
        if (shouldFetchFromAPI) {
          console.log('📡 US Data - Fetching from API...');
          usData = await getUSTreasury(date);
          if (usData && usData.rates && usData.rates.length > 0) {
            await saveToSupabase('us', usData);
          }
        }
        if (usData) result.data.us = usData;
      } catch (usError) {
        console.error('❌ Erreur US Data:', usError);
      }
    }

    if (country === 'canada' || country === 'both') {
      try {
        console.log('🔍 Canada Data - Checking Supabase...');
        let canadaData = await getFromSupabase('canada', date);
        const today = new Date().toISOString().split('T')[0];
        const shouldFetchFromAPI = !canadaData || (!date && canadaData.date !== today);
        
        if (shouldFetchFromAPI) {
          console.log('📡 Canada Data - Fetching from API...');
          canadaData = await getCanadaRates(date);
          if (canadaData && canadaData.rates && canadaData.rates.length > 0) {
            await saveToSupabase('canada', canadaData);
          }
        }
        if (canadaData) result.data.canada = canadaData;
      } catch (caError) {
        console.error('❌ Erreur Canada Data:', caError);
      }
    }

    // Recalculer le spread si nécessaire
    if (result.data.us && result.data.us.rates && !result.data.us.spread_10y_2y) {
      const rate10Y = result.data.us.rates.find(r => r.maturity === '10Y');
      const rate2Y = result.data.us.rates.find(r => r.maturity === '2Y');
      if (rate10Y && rate2Y) {
        result.data.us.spread_10y_2y = rate10Y.rate - rate2Y.rate;
        result.data.us.inverted = result.data.us.spread_10y_2y < 0;
      }
    }

    console.log(`✅ Yield curve OK: US=${result.data.us?.count || 0}, CA=${result.data.canada?.count || 0}`);
    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur Fatale yield-curve:', error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
