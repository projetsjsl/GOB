/**
 * Service pour charger les données depuis Supabase au lieu de FMP
 * Optimise le chargement initial en utilisant les snapshots existants
 * 
 * IMPORTANT: Toutes les assumptions chargées sont sanitisées pour éviter les valeurs aberrantes
 */

import { AnnualData, CompanyInfo, Assumptions, AnalysisProfile } from '../types';
import { fetchMarketData } from './marketDataCache';
import { sanitizeAssumptions } from '../utils/validation';

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
 * Retourne null si aucun snapshot trouvé
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
    }
    
    if (snapshots.length === 0) {
      return null;
    }

    // Prioriser is_current=true, sinon prendre le plus récent
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
    console.error(`❌ Erreur chargement snapshot Supabase pour ${ticker}:`, error);
    return null;
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

    // 3. Mettre à jour le prix dans les assumptions et SANITISER pour éviter aberrations
    const updatedAssumptions = sanitizeAssumptions({
      ...snapshot.assumptions,
      currentPrice: currentPrice > 0 ? currentPrice : snapshot.assumptions?.currentPrice || 0
    });

    console.log(`✅ ${upperTicker}: Chargé depuis Supabase (snapshot du ${snapshot.snapshot_date})`);

    return {
      data: snapshot.annual_data,
      info: snapshot.company_info,
      currentPrice,
      assumptions: updatedAssumptions,
      source: 'supabase'
    };
  }

  // 4. Fallback sur FMP si demandé
  if (fallbackToFMP) {
    console.log(`⚠️ ${upperTicker}: Pas de snapshot Supabase, fallback sur FMP`);
    // Importer dynamiquement pour éviter les dépendances circulaires
    const { fetchCompanyData } = await import('./financeApi');
    try {
      const fmpResult = await fetchCompanyData(upperTicker);
      return {
        ...fmpResult,
        source: 'fmp'
      };
    } catch (error) {
      console.error(`❌ ${upperTicker}: Erreur FMP fallback:`, error);
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
 * Optimisé pour charger tous les tickers rapidement
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

  // Charger les snapshots en parallèle (batch)
  const snapshotPromises = tickers.map(ticker => 
    loadCurrentSnapshotFromSupabase(ticker.toUpperCase())
  );

  const snapshots = await Promise.allSettled(snapshotPromises);

  // Charger les prix en batch
  const pricePromises = tickers.map(ticker => 
    fetchMarketData(ticker.toUpperCase())
  );
  const prices = await Promise.allSettled(pricePromises);

  // Combiner les résultats
  tickers.forEach((ticker, index) => {
    const upperTicker = ticker.toUpperCase();
    const snapshotResult = snapshots[index];
    const priceResult = prices[index];

    if (snapshotResult.status === 'fulfilled' && snapshotResult.value) {
      const snapshot = snapshotResult.value;
      const marketData = priceResult.status === 'fulfilled' ? priceResult.value : null;
      const currentPrice = (marketData?.currentPrice || 0) > 0
        ? marketData.currentPrice
        : (snapshot.assumptions?.currentPrice || 0);

      // ✅ SANITISER les assumptions pour éviter les valeurs aberrantes
      results[upperTicker] = {
        data: snapshot.annual_data || [],
        info: snapshot.company_info || {},
        currentPrice,
        assumptions: sanitizeAssumptions({
          ...snapshot.assumptions,
          currentPrice: currentPrice > 0 ? currentPrice : snapshot.assumptions?.currentPrice || 0
        }),
        source: 'supabase' as const
      };
    } else {
      // Pas de snapshot - marquer pour chargement FMP ultérieur
      results[upperTicker] = {
        data: [],
        info: {},
        currentPrice: priceResult.status === 'fulfilled' ? (priceResult.value?.currentPrice || 0) : 0,
        source: 'error' as const
      };
    }
  });

  return results;
}

