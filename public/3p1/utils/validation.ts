/**
 * Strict Data Validation Utilities for 3p1 Finance Pro
 * 
 * IMPORTANT: These validators reject ANY placeholder, fallback, or estimated data.
 * Only real, verified data from FMP or Supabase should pass validation.
 */

import { AnnualData, CompanyInfo, Assumptions } from '../types';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a price is real (not placeholder)
 * Rejects: 0, negative, 100 (default), NaN, Infinity
 */
export const isValidPrice = (price: number | undefined | null): boolean => {
  if (price == null) return false;
  if (!isFinite(price)) return false;
  if (price <= 0) return false;
  if (price === 100) return false; // Common placeholder
  return true;
};

/**
 * Validate that EPS is real
 * Zero EPS can be valid for unprofitable companies, but should be flagged
 */
export const isValidEPS = (eps: number | undefined | null): boolean => {
  if (eps == null) return false;
  if (!isFinite(eps)) return false;
  // Allow negative EPS (losses) but not zero as it's often placeholder
  return eps !== 0;
};

/**
 * Validate annual data row - strict mode
 * ALL fields must have real data, no placeholders
 */
export const validateAnnualDataRow = (row: AnnualData): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!row.year || row.year < 1900 || row.year > new Date().getFullYear() + 2) {
    errors.push(`Invalid year: ${row.year}`);
  }

  if (row.priceHigh <= 0 || !isFinite(row.priceHigh)) {
    errors.push(`Invalid priceHigh: ${row.priceHigh}`);
  }

  if (row.priceLow <= 0 || !isFinite(row.priceLow)) {
    errors.push(`Invalid priceLow: ${row.priceLow}`);
  }

  if (row.priceHigh < row.priceLow) {
    errors.push(`priceHigh (${row.priceHigh}) < priceLow (${row.priceLow})`);
  }

  // EPS can be negative (losses) but warn if zero
  if (!isFinite(row.earningsPerShare)) {
    errors.push(`Invalid EPS: ${row.earningsPerShare}`);
  } else if (row.earningsPerShare === 0) {
    warnings.push(`EPS is 0 for ${row.year} - may be placeholder`);
  }

  // Cash flow should generally be positive
  if (!isFinite(row.cashFlowPerShare)) {
    errors.push(`Invalid cashFlowPerShare: ${row.cashFlowPerShare}`);
  } else if (row.cashFlowPerShare <= 0) {
    warnings.push(`Negative/zero cashFlow for ${row.year}`);
  }

  // Book value should be positive
  if (!isFinite(row.bookValuePerShare)) {
    errors.push(`Invalid bookValuePerShare: ${row.bookValuePerShare}`);
  } else if (row.bookValuePerShare <= 0) {
    warnings.push(`Negative/zero bookValue for ${row.year}`);
  }

  // Dividend can be 0 for non-dividend stocks
  if (!isFinite(row.dividendPerShare)) {
    errors.push(`Invalid dividendPerShare: ${row.dividendPerShare}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate entire annual data array
 * Requires at least 3 years of valid data
 */
export const validateAnnualDataArray = (data: AnnualData[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || !Array.isArray(data)) {
    return { isValid: false, errors: ['Data is not an array'], warnings: [] };
  }

  if (data.length < 3) {
    errors.push(`Insufficient data: ${data.length} years (minimum 3 required)`);
  }

  let validRows = 0;
  data.forEach((row, index) => {
    const rowResult = validateAnnualDataRow(row);
    if (rowResult.isValid) {
      validRows++;
    } else {
      rowResult.errors.forEach(e => errors.push(`Row ${index} (${row.year}): ${e}`));
    }
    rowResult.warnings.forEach(w => warnings.push(`Row ${index} (${row.year}): ${w}`));
  });

  if (validRows < 3) {
    errors.push(`Only ${validRows} valid rows (minimum 3 required)`);
  }

  // Check for year continuity
  const years = data.map(d => d.year).sort((a, b) => a - b);
  for (let i = 1; i < years.length; i++) {
    if (years[i] - years[i - 1] > 2) {
      warnings.push(`Gap in years: ${years[i - 1]} to ${years[i]}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate company info - reject placeholders
 */
export const validateCompanyInfo = (info: Partial<CompanyInfo>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!info.symbol || info.symbol.trim() === '') {
    errors.push('Missing symbol');
  }

  if (!info.name || info.name.trim() === '' || info.name === 'Chargement...') {
    errors.push('Missing or placeholder company name');
  }

  if (!info.sector || info.sector.trim() === '') {
    warnings.push('Missing sector');
  }

  if (!info.marketCap || info.marketCap === 'N/A' || info.marketCap === '0') {
    warnings.push('Missing or invalid marketCap');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate assumptions - ensure no placeholder values
 */
export const validateAssumptions = (assumptions: Partial<Assumptions>): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Current price must be valid
  if (!isValidPrice(assumptions.currentPrice)) {
    errors.push(`Invalid currentPrice: ${assumptions.currentPrice}`);
  }

  // Base year must be recent
  const currentYear = new Date().getFullYear();
  if (!assumptions.baseYear || assumptions.baseYear < currentYear - 5 || assumptions.baseYear > currentYear + 1) {
    warnings.push(`baseYear ${assumptions.baseYear} may be outdated`);
  }

  // Growth rates should be reasonable (-50% to +50%)
  const growthFields = ['growthRateEPS', 'growthRateCF', 'growthRateBV', 'growthRateDiv'] as const;
  growthFields.forEach(field => {
    const value = assumptions[field];
    if (value != null && (value < -50 || value > 50)) {
      warnings.push(`${field} (${value}%) seems extreme`);
    }
  });

  // Target ratios should be reasonable
  if (assumptions.targetPE != null && (assumptions.targetPE <= 0 || assumptions.targetPE > 100)) {
    warnings.push(`targetPE ${assumptions.targetPE} seems extreme`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Full profile validation - combines all validators
 */
export const validateProfile = (
  data: AnnualData[],
  info: Partial<CompanyInfo>,
  assumptions: Partial<Assumptions>
): ValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  const dataResult = validateAnnualDataArray(data);
  const infoResult = validateCompanyInfo(info);
  const assumptionsResult = validateAssumptions(assumptions);

  allErrors.push(...dataResult.errors);
  allErrors.push(...infoResult.errors);
  allErrors.push(...assumptionsResult.errors);

  allWarnings.push(...dataResult.warnings);
  allWarnings.push(...infoResult.warnings);
  allWarnings.push(...assumptionsResult.warnings);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * Cache pour les paramètres de validation (évite les appels API répétés)
 */
let validationSettingsCache: {
  settings: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Charge les paramètres de validation depuis l'API (avec cache)
 */
async function loadValidationSettingsWithCache(): Promise<any> {
  // Vérifier le cache
  if (validationSettingsCache && Date.now() - validationSettingsCache.timestamp < CACHE_DURATION) {
    return validationSettingsCache.settings;
  }

  try {
    const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${API_BASE}/api/validation-settings?key=default`);
    
    if (response.ok) {
      const settings = await response.json();
      validationSettingsCache = {
        settings,
        timestamp: Date.now()
      };
      return settings;
    }
  } catch (error) {
    console.warn('Failed to load validation settings, using defaults:', error);
  }

  // Retourner les valeurs par défaut
  return {
    growth_min: -20.00,
    growth_max: 20.00,
    target_pe_min: 5.0,
    target_pe_max: 50.0,
    target_pcf_min: 3.0,
    target_pcf_max: 50.0,
    target_pbv_min: 0.5,
    target_pbv_max: 10.0,
    target_yield_min: 0.0,
    target_yield_max: 15.0,
    required_return_min: 5.0,
    required_return_max: 25.0,
    dividend_payout_ratio_min: 0.0,
    dividend_payout_ratio_max: 100.0,
    growth_precision: 2,
    ratio_precision: 1,
    yield_precision: 2
  };
}

/**
 * Invalide le cache des paramètres de validation
 */
export function invalidateValidationSettingsCache() {
  validationSettingsCache = null;
}

/**
 * SANITIZE ASSUMPTIONS - Corrige les valeurs aberrantes avant sauvegarde
 * Cette fonction doit être appelée AVANT chaque sauvegarde Supabase
 * 
 * Utilise les paramètres personnalisés depuis Supabase si disponibles,
 * sinon utilise les valeurs par défaut.
 */
export const sanitizeAssumptions = async (assumptions: Partial<Assumptions>): Promise<Assumptions> => {
  // Charger les paramètres de validation (avec cache)
  const validationSettings = await loadValidationSettingsWithCache();

  // Valeurs par défaut sécurisées
  const safeDefaults: Assumptions = {
    currentPrice: 0,
    currentDividend: 0,
    baseYear: new Date().getFullYear(),
    growthRateEPS: 5,
    growthRateSales: 5,
    growthRateCF: 5,
    growthRateBV: 5,
    growthRateDiv: 0,
    targetPE: 15,
    targetPCF: 10,
    targetPBV: 2,
    targetYield: 2,
    requiredReturn: 10,
    dividendPayoutRatio: 30,
    excludeEPS: false,
    excludeCF: false,
    excludeBV: false,
    excludeDIV: false
  };

  // Helper pour limiter une valeur dans une plage
  const clamp = (value: number | undefined | null, min: number, max: number, defaultVal: number): number => {
    if (value === undefined || value === null || !isFinite(value)) return defaultVal;
    return Math.max(min, Math.min(value, max));
  };

  // Helper pour arrondir proprement
  const round = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Extraire les limites depuis les paramètres de validation
  const growthMin = validationSettings.growth_min ?? -20;
  const growthMax = validationSettings.growth_max ?? 20;
  const growthPrecision = validationSettings.growth_precision ?? 2;
  const ratioPrecision = validationSettings.ratio_precision ?? 1;
  const yieldPrecision = validationSettings.yield_precision ?? 2;

  const sanitized: Assumptions = {
    // Prix actuel: doit être > 0
    currentPrice: assumptions.currentPrice && assumptions.currentPrice > 0 && isFinite(assumptions.currentPrice)
      ? round(assumptions.currentPrice, 2)
      : safeDefaults.currentPrice,
    
    // Dividende actuel: >= 0
    currentDividend: assumptions.currentDividend && assumptions.currentDividend >= 0 && isFinite(assumptions.currentDividend)
      ? round(assumptions.currentDividend, 4)
      : safeDefaults.currentDividend,
    
    // Année de base: doit être récente
    baseYear: assumptions.baseYear && assumptions.baseYear >= 2015 && assumptions.baseYear <= new Date().getFullYear() + 1
      ? assumptions.baseYear
      : safeDefaults.baseYear,
    
    // TAUX DE CROISSANCE: Utilise les limites personnalisées
    // ✅ CRITIQUE : Préserver undefined pour éviter les valeurs inventées (0)
    growthRateEPS: assumptions.growthRateEPS !== undefined 
      ? round(clamp(assumptions.growthRateEPS, growthMin, growthMax, safeDefaults.growthRateEPS)!, growthPrecision)
      : undefined,
    growthRateSales: assumptions.growthRateSales !== undefined 
      ? round(clamp(assumptions.growthRateSales, growthMin, growthMax, safeDefaults.growthRateSales)!, growthPrecision)
      : undefined,
    growthRateCF: assumptions.growthRateCF !== undefined 
      ? round(clamp(assumptions.growthRateCF, growthMin, growthMax, safeDefaults.growthRateCF)!, growthPrecision)
      : undefined,
    growthRateBV: assumptions.growthRateBV !== undefined 
      ? round(clamp(assumptions.growthRateBV, growthMin, growthMax, safeDefaults.growthRateBV)!, growthPrecision)
      : undefined,
    growthRateDiv: assumptions.growthRateDiv !== undefined 
      ? round(clamp(assumptions.growthRateDiv, growthMin, growthMax, safeDefaults.growthRateDiv)!, growthPrecision)
      : undefined,
    
    // RATIOS CIBLES: Utilise les limites personnalisées
    // ✅ CRITIQUE : Préserver undefined pour éviter les valeurs inventées (0)
    targetPE: assumptions.targetPE !== undefined 
      ? round(clamp(assumptions.targetPE, validationSettings.target_pe_min ?? 5, validationSettings.target_pe_max ?? 50, safeDefaults.targetPE)!, ratioPrecision)
      : undefined,
    targetPCF: assumptions.targetPCF !== undefined 
      ? round(clamp(assumptions.targetPCF, validationSettings.target_pcf_min ?? 3, validationSettings.target_pcf_max ?? 50, safeDefaults.targetPCF)!, ratioPrecision)
      : undefined,
    targetPBV: assumptions.targetPBV !== undefined 
      ? round(clamp(assumptions.targetPBV, validationSettings.target_pbv_min ?? 0.5, validationSettings.target_pbv_max ?? 10, safeDefaults.targetPBV)!, ratioPrecision)
      : undefined,
    targetYield: assumptions.targetYield !== undefined 
      ? round(clamp(assumptions.targetYield, validationSettings.target_yield_min ?? 0, validationSettings.target_yield_max ?? 15, safeDefaults.targetYield)!, yieldPrecision)
      : undefined,
    
    // Autres paramètres
    requiredReturn: round(clamp(assumptions.requiredReturn, validationSettings.required_return_min ?? 5, validationSettings.required_return_max ?? 25, safeDefaults.requiredReturn), ratioPrecision),
    dividendPayoutRatio: round(clamp(assumptions.dividendPayoutRatio, validationSettings.dividend_payout_ratio_min ?? 0, validationSettings.dividend_payout_ratio_max ?? 100, safeDefaults.dividendPayoutRatio), ratioPrecision),
    
    // Exclusions: préserver les valeurs booléennes
    excludeEPS: assumptions.excludeEPS ?? safeDefaults.excludeEPS,
    excludeCF: assumptions.excludeCF ?? safeDefaults.excludeCF,
    excludeBV: assumptions.excludeBV ?? safeDefaults.excludeBV,
    excludeDIV: assumptions.excludeDIV ?? safeDefaults.excludeDIV
  };

  // Log si des corrections ont été faites
  const corrections: string[] = [];
  
  if (assumptions.growthRateEPS !== undefined && assumptions.growthRateEPS !== sanitized.growthRateEPS) {
    corrections.push(`growthRateEPS: ${assumptions.growthRateEPS} → ${sanitized.growthRateEPS}`);
  }
  if (assumptions.growthRateCF !== undefined && assumptions.growthRateCF !== sanitized.growthRateCF) {
    corrections.push(`growthRateCF: ${assumptions.growthRateCF} → ${sanitized.growthRateCF}`);
  }
  if (assumptions.targetPE !== undefined && assumptions.targetPE !== sanitized.targetPE) {
    corrections.push(`targetPE: ${assumptions.targetPE} → ${sanitized.targetPE}`);
  }
  if (assumptions.targetPCF !== undefined && assumptions.targetPCF !== sanitized.targetPCF) {
    corrections.push(`targetPCF: ${assumptions.targetPCF} → ${sanitized.targetPCF}`);
  }
  if (assumptions.targetPBV !== undefined && assumptions.targetPBV !== sanitized.targetPBV) {
    corrections.push(`targetPBV: ${assumptions.targetPBV} → ${sanitized.targetPBV}`);
  }

  if (corrections.length > 0) {
    console.log(`🔧 Assumptions sanitized: ${corrections.join(', ')}`);
  }

  return sanitized;
};

/**
 * Version synchrone de sanitizeAssumptions (utilise les valeurs par défaut)
 * Pour compatibilité avec le code existant
 */
export const sanitizeAssumptionsSync = (assumptions: Partial<Assumptions>): Assumptions => {
  // Valeurs par défaut sécurisées
  const safeDefaults: Assumptions = {
    currentPrice: 0,
    currentDividend: 0,
    baseYear: new Date().getFullYear(),
    growthRateEPS: 5,
    growthRateSales: 5,
    growthRateCF: 5,
    growthRateBV: 5,
    growthRateDiv: 0,
    targetPE: 15,
    targetPCF: 10,
    targetPBV: 2,
    targetYield: 2,
    requiredReturn: 10,
    dividendPayoutRatio: 30,
    excludeEPS: false,
    excludeCF: false,
    excludeBV: false,
    excludeDIV: false
  };

  // Helper pour limiter une valeur dans une plage
  // ✅ CRITIQUE : Préserver undefined pour éviter les valeurs inventées (0) dans les profils squelettes
  const clamp = (value: number | undefined | null, min: number, max: number, defaultVal: number): number | undefined => {
    // ✅ Si undefined, retourner undefined (ne pas utiliser la valeur par défaut)
    if (value === undefined) return undefined;
    // ✅ Si null ou NaN, utiliser la valeur par défaut
    if (value === null || !isFinite(value)) return defaultVal;
    return Math.max(min, Math.min(value, max));
  };

  // Helper pour arrondir proprement
  const round = (value: number, decimals: number = 2): number => {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  };

  // Utiliser les valeurs du cache si disponibles, sinon valeurs par défaut
  const settings = validationSettingsCache?.settings || {
    growth_min: -20,
    growth_max: 20,
    target_pe_min: 5,
    target_pe_max: 50,
    target_pcf_min: 3,
    target_pcf_max: 50,
    target_pbv_min: 0.5,
    target_pbv_max: 10,
    target_yield_min: 0,
    target_yield_max: 15,
    required_return_min: 5,
    required_return_max: 25,
    dividend_payout_ratio_min: 0,
    dividend_payout_ratio_max: 100,
    growth_precision: 2,
    ratio_precision: 1,
    yield_precision: 2
  };

  // ✅ CRITIQUE : Créer un objet avec undefined préservé, puis utiliser un cast pour le type
  // Cela permet de préserver les undefined dans les profils squelettes sans casser le type Assumptions
  const sanitized: any = {
    currentPrice: assumptions.currentPrice && assumptions.currentPrice > 0 && isFinite(assumptions.currentPrice)
      ? round(assumptions.currentPrice, 2)
      : safeDefaults.currentPrice,
    
    currentDividend: assumptions.currentDividend && assumptions.currentDividend >= 0 && isFinite(assumptions.currentDividend)
      ? round(assumptions.currentDividend, 4)
      : safeDefaults.currentDividend,
    
    baseYear: assumptions.baseYear && assumptions.baseYear >= 2015 && assumptions.baseYear <= new Date().getFullYear() + 1
      ? assumptions.baseYear
      : safeDefaults.baseYear,
    
    // ✅ CRITIQUE : Préserver undefined pour éviter les valeurs inventées (0) dans les profils squelettes
    growthRateEPS: assumptions.growthRateEPS !== undefined 
      ? (() => { const clamped = clamp(assumptions.growthRateEPS, settings.growth_min, settings.growth_max, safeDefaults.growthRateEPS); return clamped !== undefined ? round(clamped, settings.growth_precision) : undefined; })()
      : undefined,
    growthRateSales: assumptions.growthRateSales !== undefined 
      ? (() => { const clamped = clamp(assumptions.growthRateSales, settings.growth_min, settings.growth_max, safeDefaults.growthRateSales); return clamped !== undefined ? round(clamped, settings.growth_precision) : undefined; })()
      : undefined,
    growthRateCF: assumptions.growthRateCF !== undefined 
      ? (() => { const clamped = clamp(assumptions.growthRateCF, settings.growth_min, settings.growth_max, safeDefaults.growthRateCF); return clamped !== undefined ? round(clamped, settings.growth_precision) : undefined; })()
      : undefined,
    growthRateBV: assumptions.growthRateBV !== undefined 
      ? (() => { const clamped = clamp(assumptions.growthRateBV, settings.growth_min, settings.growth_max, safeDefaults.growthRateBV); return clamped !== undefined ? round(clamped, settings.growth_precision) : undefined; })()
      : undefined,
    growthRateDiv: assumptions.growthRateDiv !== undefined 
      ? (() => { const clamped = clamp(assumptions.growthRateDiv, settings.growth_min, settings.growth_max, safeDefaults.growthRateDiv); return clamped !== undefined ? round(clamped, settings.growth_precision) : undefined; })()
      : undefined,
    
    // ✅ CRITIQUE : Préserver undefined pour éviter les valeurs inventées (0)
    targetPE: assumptions.targetPE !== undefined 
      ? (() => { const clamped = clamp(assumptions.targetPE, settings.target_pe_min, settings.target_pe_max, safeDefaults.targetPE); return clamped !== undefined ? round(clamped, settings.ratio_precision) : undefined; })()
      : undefined,
    targetPCF: assumptions.targetPCF !== undefined 
      ? (() => { const clamped = clamp(assumptions.targetPCF, settings.target_pcf_min, settings.target_pcf_max, safeDefaults.targetPCF); return clamped !== undefined ? round(clamped, settings.ratio_precision) : undefined; })()
      : undefined,
    targetPBV: assumptions.targetPBV !== undefined 
      ? (() => { const clamped = clamp(assumptions.targetPBV, settings.target_pbv_min, settings.target_pbv_max, safeDefaults.targetPBV); return clamped !== undefined ? round(clamped, settings.ratio_precision) : undefined; })()
      : undefined,
    targetYield: assumptions.targetYield !== undefined 
      ? (() => { const clamped = clamp(assumptions.targetYield, settings.target_yield_min, settings.target_yield_max, safeDefaults.targetYield); return clamped !== undefined ? round(clamped, settings.yield_precision) : undefined; })()
      : undefined,
    
    requiredReturn: round(clamp(assumptions.requiredReturn, settings.required_return_min, settings.required_return_max, safeDefaults.requiredReturn), settings.ratio_precision),
    dividendPayoutRatio: round(clamp(assumptions.dividendPayoutRatio, settings.dividend_payout_ratio_min, settings.dividend_payout_ratio_max, safeDefaults.dividendPayoutRatio), settings.ratio_precision),
    
    excludeEPS: assumptions.excludeEPS ?? safeDefaults.excludeEPS,
    excludeCF: assumptions.excludeCF ?? safeDefaults.excludeCF,
    excludeBV: assumptions.excludeBV ?? safeDefaults.excludeBV,
    excludeDIV: assumptions.excludeDIV ?? safeDefaults.excludeDIV
  };

  // ✅ CRITIQUE : Utiliser un cast pour permettre les undefined temporairement
  // Les valeurs undefined seront préservées et ne seront pas transformées en 0
  // Le type Assumptions ne permet pas undefined, mais on utilise un cast pour la compatibilité
  return sanitized as Assumptions;
};

/**
 * Check if data appears to be from FMP (real API data)
 * vs placeholder/skeleton data
 */
export const isRealFMPData = (data: AnnualData[]): boolean => {
  if (!data || data.length === 0) return false;
  
  // Check for autoFetched flag
  const hasAutoFetched = data.some(d => d.autoFetched === true);
  if (!hasAutoFetched) return false;

  // At least 5 years of data with valid prices
  const validYears = data.filter(d => 
    d.priceHigh > 0 && 
    d.priceLow > 0 && 
    isFinite(d.priceHigh) && 
    isFinite(d.priceLow)
  );
  
  return validYears.length >= 5;
};

/**
 * Reject profile if it contains placeholder data
 * Returns null if valid, error message if invalid
 */
export const rejectPlaceholderData = (
  data: AnnualData[],
  currentPrice: number
): string | null => {
  // Check for common placeholder patterns
  if (data.length === 1 && data[0].earningsPerShare === 0 && data[0].cashFlowPerShare === 0) {
    return 'Data appears to be placeholder (single row with zero values)';
  }

  if (currentPrice === 100 || currentPrice === 0) {
    return 'Current price appears to be placeholder (100 or 0)';
  }

  // Check if all EPS are zero
  if (data.every(d => d.earningsPerShare === 0)) {
    return 'All EPS values are zero - likely placeholder data';
  }

  // Check if all prices are identical
  const prices = data.map(d => d.priceHigh);
  if (prices.length > 1 && prices.every(p => p === prices[0])) {
    return 'All prices are identical - likely placeholder data';
  }

  return null; // Valid
};
