/**
 * Service pour charger les tickers depuis Supabase
 * Retourne tous les tickers actifs avec leur champ source pour mapper vers isWatchlist
 */

export interface SupabaseTicker {
  ticker: string;
  company_name?: string;
  sector?: string;
  // Nouveaux champs possibles côté DB/API (migration source -> category)
  category?: 'team' | 'watchlist' | 'both' | 'manual';
  categories?: string[];
  source: 'team' | 'watchlist' | 'both' | 'manual';
  is_active: boolean;
  priority?: number;
  // Métriques ValueLine (Source: ValueLine au 3 décembre 2025)
  security_rank?: string; // Financial Strength (Cote de sécurité)
  earnings_predictability?: string;
  price_growth_persistence?: string; // Price Growth Persistence (note numérique 5-100)
  price_stability?: string;
  beta?: number; // Beta (volatilité relative au marché) - Source: API FMP
  valueline_updated_at?: string; // Date de mise à jour ValueLine
  // Corridor ValueLine (pour Phase 3 - Validation)
  valueline_proj_low_return?: number; // Proj Low TTL Return
  valueline_proj_high_return?: number; // Proj High TTL Return
  valueline_proj_low_price_gain?: number; // Proj Price Low Gain (optionnel)
  valueline_proj_high_price_gain?: number; // Proj Price High Gain (optionnel)
  [key: string]: any; // Pour les autres champs potentiels
}

export interface LoadTickersResult {
  success: boolean;
  tickers: SupabaseTicker[];
  error?: string;
}

/**
 * Charge tous les tickers actifs depuis Supabase
 * Utilise l'API admin qui retourne tous les champs incluant 'source'
 * 
 * @returns Promise avec la liste des tickers et leur source
 */
export const loadAllTickersFromSupabase = async (): Promise<LoadTickersResult> => {
  try {
    // Utiliser l'API admin qui retourne tous les champs (incluant source)
    const response = await fetch('/api/admin/tickers?is_active=true&limit=1000');

    if (!response.ok) {
      throw new Error(`API Supabase error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erreur lors du chargement des tickers');
    }

    // Normaliser `source` (compatibilité source vs category/categories)
    const tickers = (result.tickers || []).map((ticker: any) => {
      if (ticker.source) return ticker;

      // Fallback 1: `category`
      if (ticker.category) {
        return { ...ticker, source: ticker.category as any };
      }

      // Fallback 2: `categories`
      if (Array.isArray(ticker.categories)) {
        const hasTeam = ticker.categories.includes('team');
        const hasWatchlist = ticker.categories.includes('watchlist');
        const derived =
          hasTeam && hasWatchlist ? 'both' :
          hasWatchlist ? 'watchlist' :
          hasTeam ? 'team' :
          'manual';
        return { ...ticker, source: derived as const };
      }

      // Fallback final
      return { ...ticker, source: 'manual' as const };
    });

    return {
      success: true,
      tickers
    };

  } catch (error: any) {
    console.error('❌ Erreur chargement tickers Supabase:', error);
    return {
      success: false,
      tickers: [],
      error: error.message || 'Impossible de charger les tickers depuis Supabase'
    };
  }
};

/**
 * Mappe le champ source de Supabase vers isWatchlist pour Finance Pro
 * 
 * @param source - Le champ source depuis Supabase ('team', 'watchlist', 'both', 'manual')
 * @returns true si watchlist (icône œil), false si portefeuille (icône étoile)
 */
export const mapSourceToIsWatchlist = (source: string): boolean => {
  // source='watchlist' ou 'both' → isWatchlist: true → Icône œil (EyeIcon, bleu)
  // source='team' → isWatchlist: false → Icône étoile (StarIcon, jaune)
  return source === 'watchlist' || source === 'both';
};

