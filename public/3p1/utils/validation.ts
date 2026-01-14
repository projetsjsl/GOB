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

  // Retourner les valeurs par défaut (limites STRICTES pour 5 ans)
  return {
    growth_min: -20.00,
    growth_max: 12.00,
    target_pe_min: 8.0,
    target_pe_max: 25.0,
    target_pcf_min: 5.0,
    target_pcf_max: 20.0,
    target_pbv_min: 0.8,
    target_pbv_max: 5.0,
    target_yield_min: 1.0,
    target_yield_max: 8.0,
    required_return_min: 5.0,
    required_return_max: 15.0,
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

  // Utiliser les valeurs du cache si disponibles, sinon valeurs par défaut (limites STRICTES)
  const settings = validationSettingsCache?.settings || {
    growth_min: -20,
    growth_max: 12,
    target_pe_min: 8,
    target_pe_max: 25,
    target_pcf_min: 5,
    target_pcf_max: 20,
    target_pbv_min: 0.8,
    target_pbv_max: 5,
    target_yield_min: 1,
    target_yield_max: 8,
    required_return_min: 5,
    required_return_max: 15,
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

/**
 * S1-VALID-003: Detect and flag outlier values using statistical methods
 * Uses 3 standard deviations as threshold
 *
 * @param values - Array of numeric values
 * @returns Indices of outliers
 */
export const detectStatisticalOutliers = (values: number[]): number[] => {
  if (!values || values.length < 3) return [];

  const validValues = values.filter(v => isFinite(v));
  if (validValues.length < 3) return [];

  const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  const variance = validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validValues.length;
  const stdDev = Math.sqrt(variance);

  const outlierIndices: number[] = [];
  values.forEach((value, index) => {
    if (isFinite(value)) {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > 3) {
        outlierIndices.push(index);
      }
    }
  });

  return outlierIndices;
};

/**
 * S1-VALID-007: Flag suspicious growth rates (>100% YoY)
 *
 * @param data - Historical annual data
 * @param metricKey - Key of metric to check
 * @returns Array of suspicious years
 */
export const flagSuspiciousGrowthRates = (
  data: AnnualData[],
  metricKey: keyof AnnualData
): { year: number; growthRate: number }[] => {
  if (!data || data.length < 2) return [];

  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const suspicious: { year: number; growthRate: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevValue = Number(sorted[i - 1][metricKey]);
    const currentValue = Number(sorted[i][metricKey]);

    if (prevValue > 0 && currentValue > 0) {
      const growthRate = ((currentValue - prevValue) / prevValue) * 100;

      if (Math.abs(growthRate) > 100) {
        suspicious.push({
          year: sorted[i].year,
          growthRate
        });
      }
    }
  }

  return suspicious;
};

/**
 * S1-VALID-009: Check for duplicate ticker entries
 *
 * @param profiles - Array of analysis profiles
 * @returns Array of duplicate symbols
 */
export const detectDuplicateTickers = (
  profiles: { id: string; info: { symbol: string } }[]
): string[] => {
  const symbolCounts = new Map<string, number>();

  profiles.forEach(profile => {
    const symbol = profile.info?.symbol?.toUpperCase().trim();
    if (symbol) {
      symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
    }
  });

  return Array.from(symbolCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([symbol, _]) => symbol);
};

/**
 * S1-VALID-011: Flag stale prices (>5 days old on weekdays)
 *
 * @param lastUpdateDate - Last price update date
 * @param currentDate - Current date (for testing purposes)
 * @returns true if price is stale
 */
export const isPriceStale = (
  lastUpdateDate: Date,
  currentDate: Date = new Date()
): boolean => {
  const daysSinceUpdate = (currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24);

  // Check if current date is a weekday
  const currentDay = currentDate.getDay();
  const isWeekday = currentDay >= 1 && currentDay <= 5;

  // On weekdays, prices older than 5 days are stale
  // On weekends, allow up to 7 days
  const staleDays = isWeekday ? 5 : 7;

  return daysSinceUpdate > staleDays;
};

/**
 * S1-VALID-013: Check for split-adjusted data consistency
 * Detects sudden price jumps that might indicate missing split adjustments
 *
 * @param data - Historical price data
 * @returns Array of potential split issues
 */
export const detectPotentialSplits = (
  data: AnnualData[]
): { year: number; priceRatio: number }[] => {
  if (!data || data.length < 2) return [];

  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const potentialSplits: { year: number; priceRatio: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = (sorted[i - 1].priceHigh + sorted[i - 1].priceLow) / 2;
    const currentPrice = (sorted[i].priceHigh + sorted[i].priceLow) / 2;

    if (prevPrice > 0 && currentPrice > 0) {
      const ratio = currentPrice / prevPrice;

      // Check for 2:1, 3:1, or 1:2 splits (ratio ~0.5, ~0.33, or ~2.0)
      if (ratio < 0.6 || ratio > 1.8) {
        potentialSplits.push({
          year: sorted[i].year,
          priceRatio: ratio
        });
      }
    }
  }

  return potentialSplits;
};

/**
 * S1-VALID-015: Flag companies with data gaps >2 years
 *
 * @param data - Historical annual data
 * @returns Array of gap periods
 */
export const detectDataGaps = (
  data: AnnualData[]
): { fromYear: number; toYear: number; gapYears: number }[] => {
  if (!data || data.length < 2) return [];

  const sorted = [...data].sort((a, b) => Number(a.year) - Number(b.year));
  const gaps: { fromYear: number; toYear: number; gapYears: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const gapYears = sorted[i].year - sorted[i - 1].year - 1;

    if (gapYears > 2) {
      gaps.push({
        fromYear: sorted[i - 1].year,
        toYear: sorted[i].year,
        gapYears
      });
    }
  }

  return gaps;
};

/**
 * Comprehensive data quality report
 * Combines all validation checks
 *
 * @param data - Historical annual data
 * @param info - Company info
 * @param assumptions - Valuation assumptions
 * @returns Detailed quality report
 */
export const generateDataQualityReport = (
  data: AnnualData[],
  info: Partial<CompanyInfo>,
  assumptions: Partial<Assumptions>
): {
  overallScore: number; // 0-100
  issues: {
    critical: string[];
    warnings: string[];
    info: string[];
  };
  checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
  }[];
} => {
  const critical: string[] = [];
  const warnings: string[] = [];
  const infoMessages: string[] = [];
  const checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    message: string;
  }[] = [];

  let passedChecks = 0;
  const totalChecks = 12;

  // Check 1: Sufficient data
  if (data.length >= 5) {
    passedChecks++;
    checks.push({ name: 'Data Quantity', status: 'pass', message: `${data.length} years of data` });
  } else if (data.length >= 3) {
    warnings.push(`Only ${data.length} years of data (recommended: 5+)`);
    checks.push({ name: 'Data Quantity', status: 'warning', message: `${data.length} years (min 5 recommended)` });
  } else {
    critical.push(`Insufficient data: ${data.length} years (minimum 3 required)`);
    checks.push({ name: 'Data Quantity', status: 'fail', message: `${data.length} years (min 3 required)` });
  }

  // Check 2: Valid prices
  const validPrices = data.filter(d => d.priceHigh > 0 && d.priceLow > 0);
  if (validPrices.length === data.length) {
    passedChecks++;
    checks.push({ name: 'Price Validity', status: 'pass', message: 'All prices valid' });
  } else {
    critical.push(`${data.length - validPrices.length} years have invalid prices`);
    checks.push({ name: 'Price Validity', status: 'fail', message: `${data.length - validPrices.length} invalid` });
  }

  // Check 3: Outliers
  const epsOutliers = detectStatisticalOutliers(data.map(d => d.earningsPerShare));
  if (epsOutliers.length === 0) {
    passedChecks++;
    checks.push({ name: 'EPS Outliers', status: 'pass', message: 'No outliers detected' });
  } else {
    warnings.push(`${epsOutliers.length} EPS outliers detected`);
    checks.push({ name: 'EPS Outliers', status: 'warning', message: `${epsOutliers.length} outliers` });
  }

  // Check 4: Suspicious growth rates
  const suspiciousEPS = flagSuspiciousGrowthRates(data, 'earningsPerShare');
  if (suspiciousEPS.length === 0) {
    passedChecks++;
    checks.push({ name: 'Growth Rates', status: 'pass', message: 'All growth rates reasonable' });
  } else {
    warnings.push(`${suspiciousEPS.length} suspicious EPS growth rates (>100% YoY)`);
    checks.push({ name: 'Growth Rates', status: 'warning', message: `${suspiciousEPS.length} suspicious` });
  }

  // Check 5: Data gaps
  const gaps = detectDataGaps(data);
  if (gaps.length === 0) {
    passedChecks++;
    checks.push({ name: 'Data Continuity', status: 'pass', message: 'No significant gaps' });
  } else {
    warnings.push(`${gaps.length} data gaps >2 years detected`);
    checks.push({ name: 'Data Continuity', status: 'warning', message: `${gaps.length} gaps found` });
  }

  // Check 6: Potential splits
  const splits = detectPotentialSplits(data);
  if (splits.length === 0) {
    passedChecks++;
    checks.push({ name: 'Split Adjustments', status: 'pass', message: 'No split issues detected' });
  } else {
    infoMessages.push(`${splits.length} potential stock splits detected`);
    checks.push({ name: 'Split Adjustments', status: 'warning', message: `${splits.length} potential splits` });
  }

  // Check 7: Company info complete
  const infoValid = validateCompanyInfo(info);
  if (infoValid.isValid) {
    passedChecks++;
    checks.push({ name: 'Company Info', status: 'pass', message: 'Complete' });
  } else {
    critical.push(...infoValid.errors);
    warnings.push(...infoValid.warnings);
    checks.push({ name: 'Company Info', status: 'fail', message: 'Incomplete or invalid' });
  }

  // Check 8: Assumptions valid
  const assumptionsValid = validateAssumptions(assumptions);
  if (assumptionsValid.isValid) {
    passedChecks++;
    checks.push({ name: 'Assumptions', status: 'pass', message: 'Valid' });
  } else {
    warnings.push(...assumptionsValid.warnings);
    checks.push({ name: 'Assumptions', status: 'warning', message: 'Some issues found' });
  }

  // Check 9: Current price valid
  if (isValidPrice(assumptions.currentPrice)) {
    passedChecks++;
    checks.push({ name: 'Current Price', status: 'pass', message: `$${assumptions.currentPrice?.toFixed(2)}` });
  } else {
    critical.push('Invalid or missing current price');
    checks.push({ name: 'Current Price', status: 'fail', message: 'Invalid' });
  }

  // Check 10: Positive book value
  const negativeBookValues = data.filter(d => d.bookValuePerShare <= 0).length;
  if (negativeBookValues === 0) {
    passedChecks++;
    checks.push({ name: 'Book Value', status: 'pass', message: 'All positive' });
  } else {
    warnings.push(`${negativeBookValues} years with negative book value`);
    checks.push({ name: 'Book Value', status: 'warning', message: `${negativeBookValues} negative` });
  }

  // Check 11: Positive cash flow
  const negativeCashFlow = data.filter(d => d.cashFlowPerShare <= 0).length;
  if (negativeCashFlow === 0) {
    passedChecks++;
    checks.push({ name: 'Cash Flow', status: 'pass', message: 'All positive' });
  } else {
    warnings.push(`${negativeCashFlow} years with negative cash flow`);
    checks.push({ name: 'Cash Flow', status: 'warning', message: `${negativeCashFlow} negative` });
  }

  // Check 12: Real FMP data
  if (isRealFMPData(data)) {
    passedChecks++;
    checks.push({ name: 'Data Source', status: 'pass', message: 'FMP verified' });
  } else {
    warnings.push('Data may not be from FMP or is incomplete');
    checks.push({ name: 'Data Source', status: 'warning', message: 'Not verified' });
  }

  const overallScore = Math.round((passedChecks / totalChecks) * 100);

  return {
    overallScore,
    issues: {
      critical,
      warnings,
      info: infoMessages
    },
    checks
  };
};
