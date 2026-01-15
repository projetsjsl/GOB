/**
 * Service pour charger les donnees depuis Supabase au lieu de FMP
 * Optimise le chargement initial en utilisant les snapshots existants
 * 
 * IMPORTANT: Toutes les assumptions chargees sont sanitisees pour eviter les valeurs aberrantes
 */

import { AnnualData, CompanyInfo, Assumptions, AnalysisProfile } from '../types';
import { fetchMarketData, fetchMarketDataBatch } from './marketDataCache';
import { sanitizeAssumptionsSync } from '../utils/validation';

export interface SupabaseSnapshotData {
  annual_data: AnnualData[];
  assumptions: Assumptions;
  company_info: CompanyInfo;
  snapshot_date: string;
  is_current: boolean;
  auto_fetched: boolean;
}

/**
 * Charge le snapshot actuel depuis Supabase pour un ticker
 * Retourne null si aucun snapshot trouve
 */
export async function loadCurrentSnapshotFromSupabase(
  ticker: string
): Promise<SupabaseSnapshotData | null> {
  try {
    const response = await fetch(
      `/api/finance-snapshots?ticker=${encodeURIComponent(ticker.toUpperCase())}&limit=1`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Pas de snapshot
      }
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // L'API retourne soit { snapshots: [...] } soit directement un array
    let snapshots: any[] = [];
    if (Array.isArray(result)) {
      snapshots = result;
    } else if (result.snapshots && Array.isArray(result.snapshots)) {
      snapshots = result.snapshots;
    } else if (result.ticker && result.snapshots) {
      // Format { ticker: 'AAPL', snapshots: [...] }
      snapshots = result.snapshots;
    } else if (result.data && Array.isArray(result.data)) {
      // Format { success: true, data: [...] }
      snapshots = result.data;
    }
    
    if (snapshots.length === 0) {
      return null;
    }

    // Prioriser is_current=true, sinon prendre le plus recent
    const currentSnapshot = snapshots.find((s: any) => s.is_current === true) || snapshots[0];

    return {
      annual_data: currentSnapshot.annual_data || [],
      assumptions: currentSnapshot.assumptions || {},
      company_info: currentSnapshot.company_info || {},
      snapshot_date: currentSnapshot.snapshot_date,
      is_current: currentSnapshot.is_current,
      auto_fetched: currentSnapshot.auto_fetched
    };
  } catch (error) {
    console.error(` Erreur chargement snapshot Supabase pour ${ticker}:`, error);
    return null;
  }
}

//  CACHE GLOBAL: Store all snapshots in memory after first load
let allSnapshotsCache: Map<string, SupabaseSnapshotData> | null = null;
let allSnapshotsCacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Charge TOUS les snapshots actuels depuis Supabase en UN SEUL appel API
 * Utilise ?all=true&current=true pour recuperer tous les snapshots is_current=true
 *
 * Cette fonction est le cur de l'optimisation - au lieu de 1000+ appels API,
 * on fait UN SEUL appel qui charge tout en memoire
 */
export async function loadAllCurrentSnapshotsFromSupabase(): Promise<Map<string, SupabaseSnapshotData>> {
  // Check cache first
  const now = Date.now();
  if (allSnapshotsCache && (now - allSnapshotsCacheTimestamp) < CACHE_TTL_MS) {
    console.log(` Using cached snapshots (${allSnapshotsCache.size} tickers, age: ${Math.round((now - allSnapshotsCacheTimestamp) / 1000)}s)`);
    return allSnapshotsCache;
  }

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  try {
    console.log(' Loading ALL current snapshots from Supabase...');
    const startTime = Date.now();

    let snapshots: any[] = [];

    //  ESSAI 1: API route (production)
    try {
      const { getConfigValue } = await import('./appConfigApi');
      const limit = await getConfigValue('snapshots_limit');
      const response = await fetch(`/api/finance-snapshots?all=true&current=true&limit=${limit}`);

      if (response.ok) {
        const result = await response.json();
        snapshots = result.data || result.snapshots || result || [];
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (apiError) {
      console.warn(' API route failed:', apiError);

      //  ESSAI 2: Localhost - chargement direct depuis Supabase (contourne HTTP 431)
      if (isLocalhost) {
        console.log(' Localhost detecte - Chargement direct snapshots depuis Supabase...');
        const { getSupabaseClient } = await import('./supabase');
        const supabase = getSupabaseClient();

        if (supabase) {
          const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('ticker, annual_data, assumptions, company_info, snapshot_date, is_current, auto_fetched')
            .eq('is_current', true)
            .limit(1500);

          if (!error && data) {
            snapshots = data;
            console.log(` ${snapshots.length} snapshots charges directement depuis Supabase (localhost)`);
          } else {
            console.error(' Erreur Supabase direct:', error);
          }
        }
      }
    }

    const snapshotMap = new Map<string, SupabaseSnapshotData>();

    if (Array.isArray(snapshots)) {
      snapshots.forEach((snapshot: any) => {
        if (snapshot.ticker) {
          snapshotMap.set(snapshot.ticker.toUpperCase(), {
            annual_data: snapshot.annual_data || [],
            assumptions: snapshot.assumptions || {},
            company_info: snapshot.company_info || {},
            snapshot_date: snapshot.snapshot_date,
            is_current: snapshot.is_current,
            auto_fetched: snapshot.auto_fetched
          });
        }
      });
    }

    const loadTime = Date.now() - startTime;
    console.log(` Loaded ${snapshotMap.size} current snapshots in ${loadTime}ms`);

    // Update cache
    allSnapshotsCache = snapshotMap;
    allSnapshotsCacheTimestamp = now;

    return snapshotMap;
  } catch (error) {
    console.error(' Error loading all snapshots from Supabase:', error);
    return new Map();
  }
}

/**
 * Charge un profil complet depuis Supabase (snapshot + prix actuel)
 * Fallback sur FMP si snapshot non disponible
 */
export async function loadProfileFromSupabase(
  ticker: string,
  fallbackToFMP: boolean = true
): Promise<{
  data: AnnualData[];
  info: Partial<CompanyInfo>;
  currentPrice: number;
  assumptions?: Assumptions;
  source: 'supabase' | 'fmp' | 'error';
} | null> {
  const upperTicker = ticker.toUpperCase();

  // 1. Essayer de charger le snapshot depuis Supabase
  const snapshot = await loadCurrentSnapshotFromSupabase(upperTicker);

  if (snapshot && snapshot.annual_data && snapshot.annual_data.length > 0) {
    // 2. Charger le prix actuel depuis le cache de prix
    const marketData = await fetchMarketData(upperTicker);
    const currentPrice = (marketData?.currentPrice || 0) > 0 
      ? marketData.currentPrice 
      : (snapshot.assumptions?.currentPrice || 0);

    // 3. Mettre a jour le prix dans les assumptions et SANITISER pour eviter aberrations
    const updatedAssumptions = sanitizeAssumptionsSync({
      ...snapshot.assumptions,
      currentPrice: currentPrice > 0 ? currentPrice : snapshot.assumptions?.currentPrice || 0
    });

    console.log(` ${upperTicker}: Charge depuis Supabase (snapshot du ${snapshot.snapshot_date})`);

    return {
      data: snapshot.annual_data,
      info: snapshot.company_info,
      currentPrice,
      assumptions: updatedAssumptions,
      source: 'supabase'
    };
  }

  // 4. Fallback sur FMP si demande
  if (fallbackToFMP) {
    console.log(` ${upperTicker}: Pas de snapshot Supabase, fallback sur FMP`);
    // Importer dynamiquement pour eviter les dependances circulaires
    const { fetchCompanyData } = await import('./financeApi');
    try {
      const fmpResult = await fetchCompanyData(upperTicker);
      return {
        ...fmpResult,
        source: 'fmp'
      };
    } catch (error) {
      console.error(` ${upperTicker}: Erreur FMP fallback:`, error);
      return {
        data: [],
        info: {},
        currentPrice: 0,
        source: 'error'
      };
    }
  }

  return null;
}

/**
 * Charge plusieurs profils depuis Supabase en batch
 *  OPTIMISE: Utilise loadAllCurrentSnapshotsFromSupabase pour charger tous les snapshots en UN SEUL appel
 */
export async function loadProfilesBatchFromSupabase(
  tickers: string[]
): Promise<Record<string, {
  data: AnnualData[];
  info: Partial<CompanyInfo>;
  currentPrice: number;
  assumptions?: Assumptions;
  source: 'supabase' | 'fmp' | 'error';
}>> {
  const results: Record<string, any> = {};

  //  OPTIMISATION MAJEURE: Charger TOUS les snapshots en UN SEUL appel API
  // Au lieu de 50+ appels individuels, on utilise le cache global
  const allSnapshots = await loadAllCurrentSnapshotsFromSupabase();

  //  OPTIMISATION: Charger tous les prix en UN SEUL appel batch
  let priceMap: Map<string, number> = new Map();
  try {
    // Limiter a 100 tickers max par requete (limite API)
    const tickersToFetch = tickers.slice(0, 100).map(t => t.toUpperCase());
    if (tickersToFetch.length > 0) {
      const batchResult = await fetchMarketDataBatch(tickersToFetch);
      if (batchResult.success && batchResult.data) {
        batchResult.data.forEach(md => {
          if (md.currentPrice > 0) {
            priceMap.set(md.ticker.toUpperCase(), md.currentPrice);
          }
        });
      }
    }
  } catch (e) {
    console.warn(' fetchMarketDataBatch failed, using snapshot prices:', e);
  }

  // Combiner les resultats
  tickers.forEach((ticker) => {
    const upperTicker = ticker.toUpperCase();
    const snapshot = allSnapshots.get(upperTicker);

    if (snapshot && snapshot.annual_data && snapshot.annual_data.length > 0) {
      // Use batch price if available, otherwise fallback to snapshot price
      const batchPrice = priceMap.get(upperTicker) || 0;
      const snapshotPrice = snapshot.assumptions?.currentPrice || 0;
      const currentPrice = batchPrice > 0 ? batchPrice : snapshotPrice;

      //  SANITISER les assumptions pour eviter les valeurs aberrantes
      results[upperTicker] = {
        data: snapshot.annual_data || [],
        info: snapshot.company_info || {},
        currentPrice,
        assumptions: sanitizeAssumptionsSync({
          ...snapshot.assumptions,
          currentPrice: currentPrice > 0 ? currentPrice : snapshotPrice
        }),
        source: 'supabase' as const
      };
    } else {
      // Pas de snapshot - marquer pour chargement FMP ulterieur
      const batchPrice = priceMap.get(upperTicker) || 0;
      results[upperTicker] = {
        data: [],
        info: {},
        currentPrice: batchPrice,
        source: 'error' as const
      };
    }
  });

  return results;
}


