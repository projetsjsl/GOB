/**
 * Service pour charger les tickers depuis Supabase
 * Retourne tous les tickers actifs avec leur champ source pour mapper vers isWatchlist
 */

export interface SupabaseTicker {
  ticker: string;
  company_name?: string;
  sector?: string;
  // Nouveaux champs possibles cote DB/API (migration source -> category)
  category?: 'team' | 'watchlist' | 'both' | 'manual';
  categories?: string[];
  source: 'team' | 'watchlist' | 'both' | 'manual';
  is_active: boolean;
  priority?: number;
  // Metriques ValueLine (Source: ValueLine au 3 decembre 2025)
  security_rank?: string; // Financial Strength (Cote de securite)
  earnings_predictability?: string;
  price_growth_persistence?: string; // Price Growth Persistence (note numerique 5-100)
  price_stability?: string;
  beta?: number; // Beta (volatilite relative au marche) - Source: API FMP
  valueline_updated_at?: string; // Date de mise a jour ValueLine
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
 *  FIX: Fallback sur API publique si admin echoue
 * 
 * @returns Promise avec la liste des tickers et leur source
 */
export const loadAllTickersFromSupabase = async (): Promise<LoadTickersResult> => {
  try {
    //  DETECTION LOCALHOST: Si on est en localhost et que les APIs echouent, utiliser Supabase directement
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0'
    );

    //  ESSAI 1: Charger TOUS les team tickers explicitement (sans limite de priority)
    // Cela garantit que les 25 team tickers sont toujours charges, meme avec priority basse
    let teamTickersResponse = await fetch('/api/admin/tickers?is_active=true&source=team&limit=1000&order_by=ticker&order_direction=asc');
    let bothTickersResponse = await fetch('/api/admin/tickers?is_active=true&source=both&limit=1000&order_by=ticker&order_direction=asc');
    
    const allTeamTickers: any[] = [];
    
    if (teamTickersResponse.ok) {
      const teamResult = await teamTickersResponse.json();
      if (teamResult.success && teamResult.tickers) {
        allTeamTickers.push(...teamResult.tickers);
      }
    }
    
    if (bothTickersResponse.ok) {
      const bothResult = await bothTickersResponse.json();
      if (bothResult.success && bothResult.tickers) {
        allTeamTickers.push(...bothResult.tickers);
      }
    }
    
    //  ESSAI 2: Charger tous les autres tickers (limit 1000 pour eviter surcharge)
    let response = await fetch('/api/admin/tickers?is_active=true&limit=1000');
    let result: any = null;

    if (response.ok) {
      result = await response.json();
      if (result.success && result.tickers && result.tickers.length > 0) {
        // Normaliser `source` (compatibilite source vs category/categories)
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

        //  FUSIONNER: Ajouter les team tickers (eviter doublons)
        const tickerSymbols = new Set(tickers.map((t: any) => t.ticker.toUpperCase()));
        const normalizedTeamTickers = allTeamTickers.map((ticker: any) => {
          if (ticker.source) return ticker;
          if (ticker.category) return { ...ticker, source: ticker.category };
          if (Array.isArray(ticker.categories)) {
            const hasTeam = ticker.categories.includes('team');
            const hasWatchlist = ticker.categories.includes('watchlist');
            const derived = hasTeam && hasWatchlist ? 'both' : hasWatchlist ? 'watchlist' : hasTeam ? 'team' : 'manual';
            return { ...ticker, source: derived };
          }
          return { ...ticker, source: 'manual' };
        });
        
        // Ajouter les team tickers qui ne sont pas deja dans la liste
        normalizedTeamTickers.forEach((teamTicker: any) => {
          const symbol = teamTicker.ticker.toUpperCase();
          if (!tickerSymbols.has(symbol)) {
            tickers.push(teamTicker);
            tickerSymbols.add(symbol);
          } else {
            // Remplacer par la version team si elle existe (pour garantir source correct)
            const index = tickers.findIndex((t: any) => t.ticker.toUpperCase() === symbol);
            if (index >= 0 && (teamTicker.source === 'team' || teamTicker.source === 'both')) {
              tickers[index] = teamTicker; // Remplacer pour garantir source correct
            }
          }
        });

        //  Compter uniquement les team tickers uniques (source='team' ou 'both')
        const uniqueTeamTickers = new Set<string>();
        tickers.forEach((t: any) => {
          if (t.source === 'team' || t.source === 'both') {
            uniqueTeamTickers.add(t.ticker.toUpperCase());
          }
        });
        
        console.log(` ${tickers.length} tickers charges depuis /api/admin/tickers (dont ${uniqueTeamTickers.size} team tickers uniques)`);
        return {
          success: true,
          tickers
        };
      }
    }

    //  ESSAI 2: Fallback sur API publique team-tickers
    console.warn(' API admin/tickers echouee, tentative avec /api/team-tickers');
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
        
        console.log(` ${tickers.length} tickers charges depuis /api/team-tickers (fallback)`);
        return {
          success: true,
          tickers
        };
      }
    }

    //  ESSAI 3: Fallback sur tickers-config
    console.warn(' API team-tickers echouee, tentative avec /api/tickers-config');
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
            // Eviter les doublons
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
          console.log(` ${allTickers.length} tickers charges depuis /api/tickers-config (fallback)`);
          return {
            success: true,
            tickers: allTickers
          };
        }
      }
    }

    //  ESSAI 4: Si on est en localhost et que toutes les APIs ont echoue, essayer Supabase directement
    if (isLocalhost) {
      console.log(' Localhost detecte - Tentative chargement direct depuis Supabase...');
      try {
        const { getSupabaseClient } = await import('./supabase');
        const supabase = getSupabaseClient();
        
        if (supabase) {
          const { data: tickers, error: supabaseError } = await supabase
            .from('tickers')
            .select('ticker, company_name, sector, source, is_active, security_rank, earnings_predictability, price_growth_persistence, price_stability, beta')
            .eq('is_active', true)
            .limit(1000);
          
          if (!supabaseError && tickers && tickers.length > 0) {
            const normalizedTickers = tickers.map((t: any) => ({
              ticker: t.ticker,
              company_name: t.company_name,
              sector: t.sector,
              source: t.source || 'manual',
              is_active: t.is_active,
              security_rank: t.security_rank,
              earnings_predictability: t.earnings_predictability,
              price_growth_persistence: t.price_growth_persistence,
              price_stability: t.price_stability,
              beta: t.beta
            }));
            
            console.log(` ${normalizedTickers.length} tickers charges directement depuis Supabase (localhost)`);
            return {
              success: true,
              tickers: normalizedTickers
            };
          }
        }
      } catch (supabaseDirectError) {
        console.warn(' Erreur chargement direct Supabase:', supabaseDirectError);
      }
    }

    //  TOUS LES ESSAIS ONT ECHOUE
    throw new Error('Aucune API disponible pour charger les tickers');

  } catch (error: any) {
    console.error(' Erreur chargement tickers Supabase:', error);
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
 * @returns true si watchlist (icone il), false si portefeuille (icone etoile), null si normal (pas d'icone)
 * 
 *  IMPORTANT: 
 * - source='team' -> false ( Portefeuille)
 * - source='both' -> false ( Portefeuille) - car "both" = portefeuille ET watchlist, donc priorite portefeuille
 * - source='watchlist' -> true ( Watchlist)
 * - source='manual' ou null/undefined -> null (tickers normaux, pas d'icone)
 */
export const mapSourceToIsWatchlist = (source: string | null | undefined): boolean | null => {
  if (!source || source === 'manual') return null; // Tickers normaux, pas d'icone
  if (source === 'team' || source === 'both') return false; //  Portefeuille (both = portefeuille + watchlist, priorite portefeuille)
  if (source === 'watchlist') return true; //  Watchlist
  return null; // Par defaut, tickers normaux
};

