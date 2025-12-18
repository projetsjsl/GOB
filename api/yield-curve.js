/**
 * Yield Curve API Endpoint
 *
 * Récupère les données de la courbe des taux (yield curve) pour US et Canada
 * Sources de données: FRED API et FMP API
 *
 * Endpoints:
 * - GET /api/yield-curve?country=us (ou canada)
 * - GET /api/yield-curve?country=both (défaut)
 */

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
 * Récupère les données depuis Bank of Canada Valet API
 */
async function fetchFromBoC(seriesId) {
  try {
    const url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?recent=1`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ BoC API erreur pour ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      const latestObservation = data.observations[0];
      const value = latestObservation[seriesId]?.v;

      if (!value || value === null) return null;

      return {
        value: parseFloat(value),
        date: latestObservation.d
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Erreur BoC pour ${seriesId}:`, error.message);
    return null;
  }
}

/**
 * Récupère les données depuis FRED API
 */
async function fetchFromFRED(seriesId) {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    console.warn('⚠️ FRED_API_KEY non configurée');
    return null;
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`⚠️ FRED API erreur pour ${seriesId}: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.observations && data.observations.length > 0) {
      const latestValue = data.observations[0].value;

      // FRED retourne '.' pour les valeurs manquantes
      if (latestValue === '.' || latestValue === null) {
        return null;
      }

      return {
        value: parseFloat(latestValue),
        date: data.observations[0].date
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
 */
async function getUSTreasury() {
  console.log('📊 Récupération des taux US Treasury...');

  const rates = {};
  let source = 'FRED';
  let fetchDate = null;

  // Essayer FRED en premier
  for (const [maturity, seriesId] of Object.entries(US_TREASURY_RATES)) {
    const data = await fetchFromFRED(seriesId);
    if (data) {
      rates[maturity] = data.value;
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

      // Merger les données FMP
      for (const [maturity, value] of Object.entries(fmpData)) {
        if (maturity !== 'date' && value !== null && !rates[maturity]) {
          rates[maturity] = value;
        }
      }
    }
  }

  // Convertir en array et trier par maturité
  const ratesArray = Object.entries(rates)
    .map(([maturity, rate]) => ({
      maturity,
      rate,
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
 * Récupère la courbe des taux Canada
 */
async function getCanadaRates() {
  console.log('📊 Récupération des taux Canada (via Bank of Canada)...');

  const rates = {};
  let fetchDate = null;

  // Récupérer depuis Bank of Canada
  for (const [maturity, seriesId] of Object.entries(CANADA_RATES)) {
    const data = await fetchFromBoC(seriesId);
    if (data) {
      rates[maturity] = data.value;
      if (!fetchDate) fetchDate = data.date;
    }
  }

  // Convertir en array et trier par maturité
  let ratesArray = Object.entries(rates)
    .map(([maturity, rate]) => ({
      maturity,
      rate,
      months: maturityToMonths(maturity)
    }))
    .sort((a, b) => a.months - b.months);

  if (ratesArray.length === 0) {
    console.warn('⚠️ Aucun taux Canada via API - utilisation des valeurs par défaut');
    ratesArray = CANADA_FALLBACK.map(item => ({
      maturity: item.maturity,
      rate: item.rate,
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
    const { country = 'both' } = req.query;

    console.log(`🔍 Requête yield curve: country=${country}`);

    const result = {
      timestamp: new Date().toISOString(),
      data: {}
    };

    // Récupérer les données selon le pays demandé
    if (country === 'us' || country === 'both') {
      result.data.us = await getUSTreasury();
    }

    if (country === 'canada' || country === 'both') {
      result.data.canada = await getCanadaRates();
    }

    // Calculer le spread 10Y-2Y si disponible (indicateur de récession)
    if (result.data.us && result.data.us.rates) {
      const rate10Y = result.data.us.rates.find(r => r.maturity === '10Y');
      const rate2Y = result.data.us.rates.find(r => r.maturity === '2Y');

      if (rate10Y && rate2Y) {
        result.data.us.spread_10y_2y = rate10Y.rate - rate2Y.rate;
        result.data.us.inverted = result.data.us.spread_10y_2y < 0;
      }
    }

    console.log(`✅ Yield curve récupérée: US=${result.data.us?.count || 0} points, Canada=${result.data.canada?.count || 0} points`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Erreur yield-curve:', error);
    return res.status(500).json({
      error: 'Erreur lors de la récupération de la yield curve',
      message: error.message
    });
  }
}
