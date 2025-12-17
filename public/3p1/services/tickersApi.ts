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
 * ✅ FIX: Fallback sur API publique si admin échoue
 * 
 * @returns Promise avec la liste des tickers et leur source
 */
export const loadAllTickersFromSupabase = async (): Promise<LoadTickersResult> => {
  try {
    // ✅ ESSAI 1: Utiliser l'API admin qui retourne tous les champs (incluant source)
    let response = await fetch('/api/admin/tickers?is_active=true&limit=1000');
    let result: any = null;

    if (response.ok) {
      result = await response.json();
      if (result.success && result.tickers && result.tickers.length > 0) {
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

        console.log(`✅ ${tickers.length} tickers chargés depuis /api/admin/tickers`);
        return {
          success: true,
          tickers
        };
      }
    }

    // ✅ ESSAI 2: Fallback sur API publique team-tickers
    console.warn('⚠️ API admin/tickers échouée, tentative avec /api/team-tickers');
    response = await fetch('/api/team-tickers?limit=1000');
    
    if (response.ok) {
      result = await response.json();
      if (result.success && result.tickers && result.tickers.length > 0) {
        // Normaliser pour cette API aussi
        const tickers = (result.tickers || []).map((ticker: any) => {
          const source = ticker.source || ticker.category || 
            (Array.isArray(ticker.categories) && ticker.categories.includes('team') ? 'team' : 'manual');
          return { ...ticker, source };
        });
        
        console.log(`✅ ${tickers.length} tickers chargés depuis /api/team-tickers (fallback)`);
        return {
          success: true,
          tickers
        };
      }
    }

    // ✅ ESSAI 3: Fallback sur tickers-config
    console.warn('⚠️ API team-tickers échouée, tentative avec /api/tickers-config');
    response = await fetch('/api/tickers-config');
    
    if (response.ok) {
      result = await response.json();
      if (result.success) {
        // Combiner team et watchlist
        const allTickers: SupabaseTicker[] = [];
        
        if (result.team_tickers && Array.isArray(result.team_tickers)) {
          result.team_tickers.forEach((ticker: string) => {
            allTickers.push({
              ticker: ticker.toUpperCase(),
              source: 'team',
              is_active: true
            });
          });
        }
        
        if (result.watchlist_tickers && Array.isArray(result.watchlist_tickers)) {
          result.watchlist_tickers.forEach((ticker: string) => {
            // Éviter les doublons
            if (!allTickers.find(t => t.ticker === ticker.toUpperCase())) {
              allTickers.push({
                ticker: ticker.toUpperCase(),
                source: 'watchlist',
                is_active: true
              });
            }
          });
        }
        
        if (allTickers.length > 0) {
          console.log(`✅ ${allTickers.length} tickers chargés depuis /api/tickers-config (fallback)`);
          return {
            success: true,
            tickers: allTickers
          };
        }
      }
    }

    // ❌ TOUS LES ESSAIS ONT ÉCHOUÉ
    throw new Error('Aucune API disponible pour charger les tickers');

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
 * @returns true si watchlist (icône œil), false si portefeuille (icône étoile), null si normal (pas d'icône)
 * 
 * ⚠️ IMPORTANT: 
 * - source='team' → false (⭐ Portefeuille)
 * - source='both' → false (⭐ Portefeuille) - car "both" = portefeuille ET watchlist, donc priorité portefeuille
 * - source='watchlist' → true (👁️ Watchlist)
 * - source='manual' ou null/undefined → null (tickers normaux, pas d'icône)
 */
export const mapSourceToIsWatchlist = (source: string | null | undefined): boolean | null => {
  if (!source || source === 'manual') return null; // Tickers normaux, pas d'icône
  if (source === 'team' || source === 'both') return false; // ⭐ Portefeuille (both = portefeuille + watchlist, priorité portefeuille)
  if (source === 'watchlist') return true; // 👁️ Watchlist
  return null; // Par défaut, tickers normaux
};

