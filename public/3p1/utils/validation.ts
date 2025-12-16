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
