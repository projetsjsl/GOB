import { AnnualData, CompanyInfo } from '../types';

/**
 * Fetch company data via backend API proxy
 * No API keys needed on client side
 */
export const fetchCompanyData = async (symbol: string): Promise<{
  data: AnnualData[];
  info: Partial<CompanyInfo>;
  currentPrice: number;
}> => {
  const cleanSymbol = symbol.toUpperCase();

  try {
    // Use backend API proxy instead of direct FMP calls
    const response = await fetch(`/api/fmp-company-data?symbol=${encodeURIComponent(cleanSymbol)}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Symbole '${cleanSymbol}' introuvable.`);
      }
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Mark all data as auto-fetched for visual indicator
    const dataWithFlag = (result.data || []).map((item: AnnualData) => ({
      ...item,
      autoFetched: true
    }));

    return {
      data: dataWithFlag,
      info: result.info || {},
      currentPrice: result.currentPrice || 0
    };

  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
};