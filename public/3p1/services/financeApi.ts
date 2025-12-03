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
    // L'API backend essaiera automatiquement plusieurs variantes de symboles
    const response = await fetch(`/api/fmp-company-data?symbol=${encodeURIComponent(cleanSymbol)}`);

    if (!response.ok) {
      if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        const triedSymbols = errorData.tried || [cleanSymbol];
        throw new Error(
          `Symbole '${cleanSymbol}' introuvable. ` +
          `Variantes essayées: ${triedSymbols.join(', ')}. ` +
          `Vérifiez que le symbole est correct ou essayez un format différent.`
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