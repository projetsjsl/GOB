
import { AnnualData, CompanyInfo } from '../types';

/**
 * Fetch company data via backend API proxy
 * No API keys needed on client side
 */
export const fetchCompanyData = async (symbol: string): Promise<any> => {
    if (!symbol || symbol.trim() === '') {
        console.warn(' fetchCompanyData called with empty symbol');
        // Return empty structure instead of throwing 500
        return {
            data: [],
            info: { symbol: '', name: 'Invalid Symbol' },
            currentPrice: 0,
            financials: [],
            analysisData: null
        };
    }
  const cleanSymbol = symbol.toUpperCase();

  try {
    // Use backend API proxy instead of direct FMP calls
    // L'API backend essaiera automatiquement plusieurs variantes de symboles
    const response = await fetch(`/api/fmp-company-data?symbol=${encodeURIComponent(cleanSymbol)}`);

    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        const triedSymbols = errorData.tried || [cleanSymbol];
        throw new Error(
          `Symbole '${cleanSymbol}' introuvable. ` +
          `Variantes essayees: ${triedSymbols.join(', ')}. ` +
          `Verifiez que le symbole est correct ou essayez un format different.`
        );
      }
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Mark all data as auto-fetched for visual indicator
    const dataWithFlag = (result.data || []).map((item: AnnualData) => ({
      ...item,
      autoFetched: true
    }));


    // --- POST-PROCESSING ROBUSTENESS ---
    // Fallback for currentPrice if 0 or invalid
    let finalCurrentPrice = result.currentPrice;
    if (!finalCurrentPrice || finalCurrentPrice === 0) {
        // ERROR FIX: 'priceData' is not available here, it's a backend variable.
        // We must use 'result.data' which contains AnnualData (year, priceHigh, priceLow, etc.)
        if (result.data && result.data.length > 0) {
            // Sort by year just in case
            const sortedData = [...result.data].sort((a: AnnualData, b: AnnualData) => b.year - a.year);
            const latest = sortedData[0];
            
            // Use average of high/low as a proxy for price if realtime missing
            if (latest.priceHigh > 0 && latest.priceLow > 0) {
                finalCurrentPrice = (latest.priceHigh + latest.priceLow) / 2;
                console.log(` currentPrice was 0, used latest annual average: ${finalCurrentPrice}`);
            }
        }
    }

    return {
      data: dataWithFlag,
      info: result.info || {},
      currentPrice: finalCurrentPrice, // Use validated/fallback price
      currentDividend: result.currentDividend || 0, //  NOUVEAU: Dividende actuel depuis l'API
      financials: result.financials,
      analysisData: result.analysisData
    };

  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};