import { AnnualData, CalculatedRatios, Assumptions, Recommendation } from '../types';
import { sanitizeAssumptionsSync } from './validation';

export const safeDiv = (num: number, den: number): number => {
  if (den === 0 || isNaN(den)) return 0;
  return num / den;
};

export const calculateRowRatios = (row: AnnualData): CalculatedRatios => {
  return {
    pcfHigh: safeDiv(row.priceHigh, row.cashFlowPerShare),
    pcfLow: safeDiv(row.priceLow, row.cashFlowPerShare),
    yieldHigh: safeDiv(row.dividendPerShare, row.priceLow) * 100, // Yield is typically Div/Price. High Yield comes from Low Price.
    yieldLow: safeDiv(row.dividendPerShare, row.priceHigh) * 100,
    pbvHigh: safeDiv(row.priceHigh, row.bookValuePerShare),
    pbvLow: safeDiv(row.priceLow, row.bookValuePerShare),
    peHigh: safeDiv(row.priceHigh, row.earningsPerShare),
    peLow: safeDiv(row.priceLow, row.earningsPerShare),
  };
};

export const calculateAverage = (data: number[]): number => {
  if (!data || data.length === 0) return 0;
  // Filter out invalid values before calculating
  const validData = data.filter(n => n != null && isFinite(n));
  if (validData.length === 0) return 0;
  const sum = validData.reduce((a, b) => a + b, 0);
  return isFinite(sum) ? sum / validData.length : 0;
};


export const projectFutureValue = (current: number, rate: number, years: number): number => {
  // Validate inputs - return 0 for invalid data
  if (current == null || rate == null || years == null) return 0;
  if (!isFinite(current) || !isFinite(rate) || !isFinite(years)) return 0;
  if (years <= 0) return current;
  
  const result = current * Math.pow(1 + rate / 100, years);
  return isFinite(result) ? result : 0;
};

export const calculateCAGR = (startValue: number, endValue: number, years: number): number => {
  // Validate inputs - return 0 for invalid data
  if (startValue == null || endValue == null || years == null) return 0;
  if (!isFinite(startValue) || !isFinite(endValue) || !isFinite(years)) return 0;
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  
  const result = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return isFinite(result) ? result : 0;
};

/**
 * Calcule la croissance historique sur une période donnée (par défaut 5 ans) pour une métrique
 * Utilisé pour initialiser automatiquement les taux de croissance si absents
 * 
 * @param data - Données historiques annuelles
 * @param metricKey - Clé de la métrique à calculer ('earningsPerShare', 'cashFlowPerShare', etc.)
 * @param period - Période en années (par défaut 5 ans)
 * @returns Taux de croissance en pourcentage (CAGR)
 */
export const calculateHistoricalGrowth = (
  data: AnnualData[],
  metricKey: keyof AnnualData,
  period: number = 5
): number => {
  if (!data || data.length < 2) return 0;
  
  // Trier par année
  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const last = sorted[sorted.length - 1];
  const lastValue = Number(last[metricKey]);

  if (lastValue <= 0) return 0;

  const targetStartYear = Number(last.year) - period;
  
  // Chercher le point de départ valide le plus proche de N-period
  let startCandidate = sorted
    .filter(d => Number(d.year) <= targetStartYear && Number(d[metricKey]) > 0)
    .sort((a, b) => Number(b.year) - Number(a.year))[0];

  // Fallback: Si rien trouvé, essayer n'importe quel point antérieur
  if (!startCandidate) {
    startCandidate = sorted
      .filter(d => Number(d.year) < Number(last.year) && Number(d[metricKey]) > 0)
      .sort((a, b) => Number(a.year) - Number(b.year))[0];
  }

  if (!startCandidate) return 0;

  const startValue = Number(startCandidate[metricKey]);
  const years = Number(last.year) - Number(startCandidate.year);

  if (years < 1) return 0;

  return calculateCAGR(startValue, lastValue, years);
};


export const formatCurrency = (val: number | undefined | null) => {
  // ✅ CRITIQUE : Gérer undefined/null pour éviter d'afficher "0,00 $" pour des valeurs non chargées
  if (val === undefined || val === null || !isFinite(val) || val === 0) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
};

export const formatPercent = (val: number) => {
  // ✅ Validation pour éviter NaN
  if (val == null || !isFinite(val) || isNaN(val)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('fr-CA', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(val / 100);
};

/**
 * Détecte si un ticker est probablement un fonds mutuel
 * Basé sur des patterns communs de symboles de fonds mutuels
 * 
 * @param symbol - Le symbole du ticker à vérifier
 * @param companyName - Le nom de la compagnie (optionnel, pour validation supplémentaire)
 * @returns true si le ticker semble être un fonds mutuel
 */
export const isMutualFund = (symbol: string, companyName?: string): boolean => {
  const symbolUpper = symbol.toUpperCase().trim();
  const nameUpper = (companyName || '').toUpperCase();
  
  // Liste exhaustive d'actions légitimes qui pourraient être confondues
  const knownStocksWhitelist = [
    'CGNX', 'EQIX', 'GATX', 'HOLX', 'LRCX', 'NBIX', 'NFLX', 'OTEX', 'PAYX', 
    'IDXX', 'VRTX', 'TXN', 'XOM', 'XEL', 'XPO', 'XRAY', 'XYL', 'XEC', 'XENE',
    'AMZN', 'CMNX', 'CNX', 'DEX', 'FLEX', 'HEX', 'JXN', 'KEX', 'LEX', 'MEX',
    'NEX', 'PEX', 'QEX', 'REX', 'SEX', 'TEX', 'UEX', 'VEX', 'WEX', 'YEX', 'ZEX',
    'POW', 'TROW', 'T', 'AT', 'V', 'MA', 'BLK' // Ajout de POW, TROW et autres
  ];
  
  // Si c'est une action connue, ce n'est PAS un fonds mutuel
  if (knownStocksWhitelist.includes(symbolUpper)) {
    return false;
  }
  
  // Vérifier le nom de la compagnie pour des indicateurs de fonds mutuel (MÉTHODE PRINCIPALE)
  if (nameUpper.includes('MUTUAL FUND') || 
      nameUpper.includes('FUND TRUST') ||
      nameUpper.includes('INVESTMENT FUND') ||
      nameUpper.includes('INDEX FUND') ||
      /* nameUpper.includes('ETF') || */ // ETF sont OK, on les garde souvent
      (nameUpper.includes('FUND') && nameUpper.includes('SERIES')) ||
      nameUpper.includes('VANGUARD FUNDS') || // Plus spécifique
      nameUpper.includes('FIDELITY FUNDS')
      /* Removed T. ROWE PRICE checks which was flagging the company itself */) {
    return true;
  }
  
  // Patterns spécifiques connus de fonds mutuels (Vanguard, Fidelity, etc.)
  // VTSAX, VFIAX, VTSIX, etc. - fonds Vanguard avec pattern V + 3-4 lettres + X/IX
  // DOIT faire 5 lettres pour être un mutual fund typique US
  const vanguardPattern = /^V[A-Z]{3}X$/; 
  if (vanguardPattern.test(symbolUpper) && symbolUpper.length === 5) {
    return true;
  }
  
  // Fonds Fidelity : FIDXX, FDRXX, etc.
  const fidelityPattern = /^F[D|I][A-Z]{2}X$/;
  if (fidelityPattern.test(symbolUpper) && symbolUpper.length === 5) {
    return true;
  }
  
  // Fonds avec suffixe XX (double X) - très commun pour les fonds mutuels
  // MAIS attention aux actions comme MAXX, TJX, etc.
  // On exige 5 lettres minimum pour ce pattern
  if (symbolUpper.endsWith('XX') && symbolUpper.length >= 5) {
    return true;
  }
  
  // Ne PAS détecter comme fonds mutuel si :
  // - Le symbole contient un point (ex: XOM.MX = bourse mexicaine)
  // - Le symbole est trop court (< 4 caractères)
  // - Le symbole est trop long (> 6 caractères, sauf patterns spécifiques)
  if (symbolUpper.includes('.') || symbolUpper.length < 5) { // Mutual funds are usually 5 chars
    return false;
  }
  
  // Par défaut, ne pas considérer comme fonds mutuel
  return false;
};

// New Helper to centralize Recommendation Logic
export const calculateRecommendation = (
  data: AnnualData[], 
  assumptions: Assumptions
): { 
  recommendation: Recommendation, 
  targetPrice: number, 
  buyLimit: number, 
  sellLimit: number 
} => {
  
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Robust Base Year Data Selection
  const baseYearData = data.find(d => d.year === assumptions.baseYear) || data[data.length - 1];
  const baseEPS = baseYearData?.earningsPerShare || 0;
  
  // Projection
  const projectedEPS5Y = projectFutureValue(baseEPS, assumptions.growthRateEPS, 5);
  const targetPriceEPS = projectedEPS5Y * assumptions.targetPE;

  // Logic matching App.tsx
  const targetPrice = targetPriceEPS; 

  const avgLowPrice = calculateAverage(validHistory.map(d => d.priceLow));
  // Fallback if no history
  const floorPrice = (avgLowPrice > 0 ? avgLowPrice : assumptions.currentPrice * 0.5) * 0.9; 

  // Buy Limit calculation (approximate 40% of the spread)
  const spread = targetPrice - floorPrice;
  const buyLimit = floorPrice + (spread * 0.33); // Slightly adjusted to be conservative, or use 0.4
  const sellLimit = targetPrice; // Or TargetPrice * 0.9

  let recommendation = Recommendation.HOLD;
  
  // Safety check to prevent showing Buy if target is 0
  if (targetPrice > 0) {
      if (assumptions.currentPrice < buyLimit) recommendation = Recommendation.BUY;
      else if (assumptions.currentPrice > sellLimit) recommendation = Recommendation.SELL;
  }

  return { recommendation, targetPrice, buyLimit, sellLimit };
};

/**
 * Auto-fill assumptions basées sur les données historiques FMP
 * Cette fonction centralise la logique d'auto-fill pour garantir la cohérence
 * Utilisée lors de la création de nouveaux profils et lors de la synchronisation
 * 
 * @param data - Données historiques annuelles depuis FMP
 * @param currentPrice - Prix actuel de l'action
 * @param existingAssumptions - Assumptions existantes (pour préserver les valeurs non calculées)
 * @returns Nouvelles assumptions avec métriques auto-remplies
 */
export const autoFillAssumptionsFromFMPData = (
  data: AnnualData[],
  currentPrice: number,
  existingAssumptions?: Partial<Assumptions>,
  currentDividendFromAPI?: number // ✅ NOUVEAU: Dividende actuel depuis l'API FMP
): Partial<Assumptions> => {
  // Guard clause for empty or invalid data
  if (!data || data.length === 0) {
    console.warn('⚠️ autoFillAssumptionsFromFMPData: Aucune donnée fournie pour les calculs');
    return existingAssumptions || {};
  }

  // Filtrer les données valides (avec prix High/Low > 0)
  const validHistory = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  
  // Trouver la dernière année avec EPS valide pour Base Year
  const lastValidData = [...data].reverse().find(d => d.earningsPerShare > 0) || data[data.length - 1];
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const yearsDiff = Math.max(1, lastValidData.year - firstData.year); // Au moins 1 an
  
  // Helper pour calculer la moyenne (arithmétique) - demandé par l'utilisateur "5 ans moyen"
  const calculateAverage = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  };

  // Helper pour calculer le CAGR sur 5 ans (ou max disponible si < 5 ans)
  const calculate5YearGrowth = (paramData: AnnualData[], metricKey: keyof AnnualData): number => {
    if (paramData.length < 2) return 0;
    
    // Trier par année et assurer typage numérique
    const sorted = [...paramData].sort((a, b) => Number(a.year) - Number(b.year));
    const last = sorted[sorted.length - 1]; // Année N
    const lastValue = Number(last[metricKey]);

    if (lastValue <= 0) return 0; // Si la fin est négative, croissance indéfinie

    const targetStartYear = Number(last.year) - 5;
    
    // Stratégie plus robuste: Chercher le point de départ VALIDE (> 0) le plus proche de N-5 (en reculant)
    // On cherche d'abord exactement N-5, sinon N-6, etc.
    // On veut un point au moins 5 ans en arrière pour avoir une tendance long terme
    let startCandidate = sorted
        .filter(d => Number(d.year) <= targetStartYear && Number(d[metricKey]) > 0)
        .sort((a, b) => Number(b.year) - Number(a.year))[0]; // Prendre le plus récent parmi les anciens (le plus proche de N-5)

    // Fallback: Si rien trouvé avant N-5, essayer de trouver n'importe quel point de départ positif valide antérieur à N
    if (!startCandidate) {
        startCandidate = sorted
            .filter(d => Number(d.year) < Number(last.year) && Number(d[metricKey]) > 0)
            .sort((a, b) => Number(a.year) - Number(b.year))[0]; // Prendre le plus ancien disponible positif
    }

    if (!startCandidate) return 0; // Aucun historique positif trouvé

    const startValue = Number(startCandidate[metricKey]);
    const years = Number(last.year) - Number(startCandidate.year);

    if (years < 1) return 0;

    return calculateCAGR(startValue, lastValue, years);
  };

  // 1. Calculer Croissance 5 Ans (CAGR)
  const growthEPS = calculate5YearGrowth(data, 'earningsPerShare');
  const growthCF = calculate5YearGrowth(data, 'cashFlowPerShare');
  const growthBV = calculate5YearGrowth(data, 'bookValuePerShare');
  const growthDiv = calculate5YearGrowth(data, 'dividendPerShare');

  // 2. Calculer Ratios Moyens 5 Ans
  // Prendre les 5 dernières années de données VALIDES (avec prix)
  const last5YearsData = validHistory.slice(-5); // Les 5 derniers éléments (supposant tri croissant)

  // P/E = Prix moyen / EPS moyen (Moyenne 5 ans)
  const peRatios = last5YearsData
    .map(d => {
      if (d.earningsPerShare <= 0) return null;
      return (d.priceHigh / d.earningsPerShare + d.priceLow / d.earningsPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 200);
  const avgPE = peRatios.length > 0 ? calculateAverage(peRatios) : 15;
  
  // P/CF = Prix moyen / Cash Flow moyen (Moyenne 5 ans)
  const pcfRatios = last5YearsData
    .map(d => {
      if (d.cashFlowPerShare <= 0.1) return null;
      return (d.priceHigh / d.cashFlowPerShare + d.priceLow / d.cashFlowPerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 200);
  const avgPCF = pcfRatios.length > 0 ? calculateAverage(pcfRatios) : 10;
  
  // P/BV = Prix moyen / Book Value moyen (Moyenne 5 ans)
  const pbvRatios = last5YearsData
    .map(d => {
      if (d.bookValuePerShare <= 0) return null;
      return (d.priceHigh / d.bookValuePerShare + d.priceLow / d.bookValuePerShare) / 2;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v > 0 && v < 50);
  const avgPBV = pbvRatios.length > 0 ? calculateAverage(pbvRatios) : 6;
  
  // Yield = Dividende / Prix (Moyenne 5 ans)
  const yieldValues = last5YearsData
    .map(d => {
      if (d.priceHigh <= 0) return null;
      return (d.dividendPerShare / d.priceHigh) * 100;
    })
    .filter((v): v is number => v !== null && isFinite(v) && v >= 0 && v < 100);
  const avgYield = yieldValues.length > 0 ? calculateAverage(yieldValues) : 2.0;
  
  // Helper pour arrondir proprement
  const round = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // ✅ HELPER : Préserver les valeurs existantes si elles sont déjà définies (non-0 pour les taux)
  // Cela permet de préserver les valeurs manuelles (orange) entrées par l'utilisateur
  const preserveIfExists = (calculated: number, existing: number | undefined | null, isGrowthRate: boolean = false): number => {
    // Pour les taux de croissance, préserver si la valeur existante est non-null, non-undefined, et non-0
    // (0 signifie généralement "non défini" pour les taux de croissance)
    if (isGrowthRate && existing !== undefined && existing !== null && existing !== 0) {
      return existing; // Préserver la valeur manuelle (orange)
    }
    // Pour les autres valeurs, préserver si définie
    if (!isGrowthRate && existing !== undefined && existing !== null) {
      return existing; // Préserver la valeur manuelle
    }
    return calculated; // Utiliser la valeur calculée
  };

  // ✅ AMÉLIORATION: Utiliser le dividende depuis l'API FMP si disponible (priorité 1)
  // Sinon, trouver le dividende le plus récent dans les données historiques
  let finalCurrentDividend = 0;
  
  // Priorité 1: Utiliser le dividende depuis l'API FMP (calculé depuis key metrics ou yield)
  if (currentDividendFromAPI !== undefined && currentDividendFromAPI > 0) {
    finalCurrentDividend = currentDividendFromAPI;
  } else {
    // Priorité 2: Trouver le dividende le plus récent (année en cours ou dernière année avec dividende > 0)
    const currentYear = new Date().getFullYear();
    
    // 1. Chercher le dividende de l'année en cours d'abord
    const currentYearData = data.find(d => d.year === currentYear && d.dividendPerShare > 0);
    if (currentYearData) {
      finalCurrentDividend = currentYearData.dividendPerShare;
    } else {
      // 2. Chercher la dernière année avec un dividende > 0 (en ordre décroissant)
      const sortedData = [...data].sort((a, b) => b.year - a.year);
      const lastYearWithDividend = sortedData.find(d => d.dividendPerShare > 0);
      if (lastYearWithDividend) {
        finalCurrentDividend = lastYearWithDividend.dividendPerShare;
      } else {
        // 3. Fallback: utiliser lastData.dividendPerShare même si 0
        finalCurrentDividend = lastData.dividendPerShare || 0;
      }
    }
    
    // Priorité 3: Si le dividende est toujours 0 mais qu'on a un prix actuel, 
    // essayer de calculer à partir du yield moyen historique (si disponible)
    if (finalCurrentDividend === 0 && currentPrice > 0 && data.length > 0) {
      // Calculer le yield moyen historique pour les années avec dividende
      const yearsWithDividend = data.filter(d => d.dividendPerShare > 0 && d.priceHigh > 0);
      if (yearsWithDividend.length > 0) {
        const avgYield = yearsWithDividend.reduce((sum, d) => {
          const yieldPercent = (d.dividendPerShare / d.priceHigh) * 100;
          return sum + yieldPercent;
        }, 0) / yearsWithDividend.length;
        
        // Si le yield moyen est raisonnable (0.1% à 20%), utiliser pour estimer le dividende actuel
        if (avgYield > 0.1 && avgYield < 20) {
          finalCurrentDividend = (avgYield / 100) * currentPrice;
          console.log(`ℹ️ Dividende estimé à partir du yield moyen historique (${avgYield.toFixed(2)}%): ${finalCurrentDividend.toFixed(4)}`);
        }
      }
    }
  }

  // Retourner les assumptions auto-remplies avec limites STRICTES
  // Ces limites sont cruciales pour éviter les prix cibles aberrants
  const rawAssumptions: Partial<Assumptions> = {
    currentPrice: round(currentPrice, 2), // ✅ Toujours mettre à jour le prix actuel
    currentDividend: preserveIfExists(
      round(finalCurrentDividend, 4),
      existingAssumptions?.currentDividend,
      true // ✅ FIX: Traiter comme un taux - ne pas préserver si existant est 0
    ),
    baseYear: preserveIfExists(
      lastValidData.year,
      existingAssumptions?.baseYear,
      false
    ),
    
    // ✅ Taux de croissance: PRÉSERVER les valeurs existantes (orange) si définies
    growthRateEPS: preserveIfExists(
      round(Math.min(Math.max(growthEPS, -20), 20), 2),
      existingAssumptions?.growthRateEPS,
      true // ✅ Flag pour indiquer que c'est un taux de croissance
    ),
    growthRateSales: preserveIfExists(
      round(Math.min(Math.max(growthCF, -20), 20), 2),
      existingAssumptions?.growthRateSales,
      true
    ),
    growthRateCF: preserveIfExists(
      round(Math.min(Math.max(growthCF, -20), 20), 2),
      existingAssumptions?.growthRateCF,
      true
    ),
    growthRateBV: preserveIfExists(
      round(Math.min(Math.max(growthBV, -20), 20), 2),
      existingAssumptions?.growthRateBV,
      true
    ),
    growthRateDiv: preserveIfExists(
      round(Math.min(Math.max(growthDiv, -20), 20), 2),
      existingAssumptions?.growthRateDiv,
      true
    ),
    
    // ✅ Ratios cibles: PRÉSERVER les valeurs existantes (orange) si définies
    targetPE: preserveIfExists(
      round(Math.max(5, Math.min(avgPE, 50)), 1),
      existingAssumptions?.targetPE,
      false
    ),
    targetPCF: preserveIfExists(
      round(Math.max(3, Math.min(avgPCF, 50)), 1),
      existingAssumptions?.targetPCF,
      false
    ),
    targetPBV: preserveIfExists(
      round(Math.max(0.5, Math.min(avgPBV, 10)), 2),
      existingAssumptions?.targetPBV,
      false
    ),
    targetYield: preserveIfExists(
      round(Math.max(0, Math.min(avgYield, 15)), 2),
      existingAssumptions?.targetYield,
      false
    ),
    
    // Préserver les autres valeurs existantes si fournies
    requiredReturn: existingAssumptions?.requiredReturn,
    dividendPayoutRatio: existingAssumptions?.dividendPayoutRatio,
    excludeEPS: existingAssumptions?.excludeEPS,
    excludeCF: existingAssumptions?.excludeCF,
    excludeBV: existingAssumptions?.excludeBV,
    excludeDIV: existingAssumptions?.excludeDIV
  };

  // ✅ SANITISER les assumptions avec les paramètres personnalisés avant de retourner
  // Cela garantit que même si les calculs génèrent des valeurs aberrantes, elles seront corrigées
  const sanitized = sanitizeAssumptionsSync(rawAssumptions);
  
  // Retourner en Partial pour préserver la compatibilité
  return {
    ...sanitized,
    excludeEPS: rawAssumptions.excludeEPS,
    excludeCF: rawAssumptions.excludeCF,
    excludeBV: rawAssumptions.excludeBV,
    excludeDIV: rawAssumptions.excludeDIV
  };
};