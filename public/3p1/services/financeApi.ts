import { AnnualData, CompanyInfo, Assumptions } from '../types';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

/**
 * Fonction intelligente pour récupérer les variables d'environnement.
 * Elle teste tous les préfixes standards (Vite, Next, React, Node)
 * et vérifie le LocalStorage en dernier recours.
 */
const getApiKey = (baseName: string, alternateNames: string[] = []): string => {
  const prefixes = ['VITE_', 'NEXT_PUBLIC_', 'REACT_APP_', ''];
  const candidates = [baseName, ...alternateNames];

  for (const name of candidates) {
    for (const prefix of prefixes) {
      const key = `${prefix}${name}`;
      
      // 1. Check import.meta.env (Vite)
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
      }
      
      // 2. Check process.env (Node/Webpack/CRA/Next)
      // @ts-ignore
      if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
      }
    }
  }

  // 3. Fallback : LocalStorage (permet à l'utilisateur de définir sa clé manuellement s'il le souhaite)
  if (typeof window !== 'undefined') {
      return localStorage.getItem(baseName) || '';
  }

  return '';
};

// Récupération robuste des clés
const FMP_KEY = getApiKey('FMP_API_KEY', ['FMP_KEY']);
const FINNHUB_KEY = getApiKey('FINNHUB_API_KEY', ['FINNHUB_TOKEN']);

export const fetchCompanyData = async (symbol: string): Promise<{
  data: AnnualData[];
  info: Partial<CompanyInfo>;
  currentPrice: number;
}> => {
  // Vérification explicite avant de lancer les requêtes
  if (!FMP_KEY) {
    const userKey = prompt("Clé FMP_API_KEY manquante. Entrez-la ici pour la sauvegarder temporairement :");
    if (userKey) {
        localStorage.setItem('FMP_API_KEY', userKey);
        window.location.reload();
        return Promise.reject("Rechargement pour appliquer la clé...");
    }
    throw new Error("Clé API FMP manquante. Ajoutez 'FMP_API_KEY' dans vos variables Vercel.");
  }

  if (!FINNHUB_KEY) {
      // Finnhub est optionnel pour le prix, mais mieux vaut l'avoir.
      console.warn("Clé FINNHUB_API_KEY manquante. Le prix temps réel pourrait être indisponible.");
  }

  const cleanSymbol = symbol.toUpperCase();

  try {
    // 1. Fetch Company Profile
    const profileRes = await fetch(`${FMP_BASE_URL}/profile/${cleanSymbol}?apikey=${FMP_KEY}`);
    if (!profileRes.ok) throw new Error(`Erreur FMP Profile: ${profileRes.statusText}`);
    const profileData = await profileRes.json();
    
    if (!profileData || profileData.length === 0) {
      throw new Error(`Symbole '${cleanSymbol}' introuvable.`);
    }
    const profile = profileData[0];

    // 2. Fetch Key Metrics (Annual)
    const metricsRes = await fetch(`${FMP_BASE_URL}/key-metrics/${cleanSymbol}?period=annual&limit=10&apikey=${FMP_KEY}`);
    const metricsData = await metricsRes.json();

    // 3. Fetch Historical Prices for High/Low
    const priceRes = await fetch(`${FMP_BASE_URL}/historical-price-full/${cleanSymbol}?serietype=line&timeseries=1825&apikey=${FMP_KEY}`);
    const priceData = await priceRes.json();
    
    // 4. Fetch Realtime Quote (Finnhub)
    let currentPrice = 0;
    if (FINNHUB_KEY) {
        try {
            const quoteRes = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=${cleanSymbol}&token=${FINNHUB_KEY}`);
            const quoteData = await quoteRes.json();
            currentPrice = quoteData.c || 0;
        } catch (e) {
            console.warn("Erreur récupération prix Finnhub, fallback sur FMP price", e);
            currentPrice = profile.price || 0;
        }
    } else {
        currentPrice = profile.price || 0;
    }

    // --- PROCESSING ---

    // Map Prices by Year
    const pricesByYear: Record<number, { high: number; low: number }> = {};
    if (priceData.historical) {
        priceData.historical.forEach((day: any) => {
            const year = new Date(day.date).getFullYear();
            if (!pricesByYear[year]) pricesByYear[year] = { high: 0, low: 999999 };
            
            const val = day.close; // Using close as proxy if OHLC not fully available in lightweight endpoints
            if (val > pricesByYear[year].high) pricesByYear[year].high = val;
            if (val < pricesByYear[year].low) pricesByYear[year].low = val;
        });
    }

    // Map Metrics to AnnualData
    // FMP metrics are usually sorted newest to oldest. We reverse for the table.
    const annualData: AnnualData[] = metricsData.map((metric: any) => {
        const year = new Date(metric.date).getFullYear();
        const priceStats = pricesByYear[year] || { high: 0, low: 0 };

        // Fallbacks
        const high = priceStats.high > 0 ? priceStats.high : (metric.revenuePerShare * 20 || 0); // dummy fallback
        const low = priceStats.low < 999999 && priceStats.low > 0 ? priceStats.low : (high * 0.5);

        // Dividend Calculation logic
        // FMP gives 'dividendYield' sometimes. We prefer raw DPS.
        // key-metrics usually has 'dividendPerShare' or we infer it.
        const dps = metric.dividendPerShare !== undefined ? metric.dividendPerShare : (metric.netIncomePerShare * (metric.payoutRatio || 0));

        return {
            year: year,
            priceHigh: parseFloat(high.toFixed(2)),
            priceLow: parseFloat(low.toFixed(2)),
            cashFlowPerShare: parseFloat((metric.operatingCashFlowPerShare || 0).toFixed(2)),
            dividendPerShare: parseFloat((dps || 0).toFixed(2)),
            bookValuePerShare: parseFloat((metric.bookValuePerShare || 0).toFixed(2)),
            earningsPerShare: parseFloat((metric.netIncomePerShare || 0).toFixed(2)),
            isEstimate: false
        };
    }).sort((a: AnnualData, b: AnnualData) => a.year - b.year);

    // Info Object
    const mappedInfo: Partial<CompanyInfo> = {
        name: profile.companyName,
        sector: profile.sector,
        marketCap: (profile.mktCap / 1000000000).toFixed(1) + 'B',
        // securityRank logic is proprietary to Value Line, we can't get it via API easily
    };

    return {
        data: annualData.slice(-6), // Keep last 6 years to match grid size roughly
        info: mappedInfo,
        currentPrice: parseFloat(currentPrice.toFixed(2))
    };

  } catch (error) {
    console.error("API Fetch Error:", error);
    throw error;
  }
};