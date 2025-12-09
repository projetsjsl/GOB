/**
 * Service pour charger les tickers depuis Supabase
 * Retourne tous les tickers actifs avec leur champ source pour mapper vers isWatchlist
 */

export interface SupabaseTicker {
  ticker: string;
  company_name?: string;
  sector?: string;
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

    // Valider que les tickers ont le champ source
    const tickers = (result.tickers || []).map((ticker: any) => {
      if (!ticker.source) {
        // Utiliser debug au lieu de warn pour réduire le bruit dans la console
        // La valeur par défaut 'manual' est appliquée automatiquement
        // console.debug(`Ticker ${ticker.ticker} n'a pas de champ source, utilisation de 'manual' par défaut`);
        return { ...ticker, source: 'manual' as const };
      }
      return ticker;
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

