/**
 * Utilitaires pour optimiser la synchronisation FMP
 * Identifie les données manquantes ou obsolètes avant de récupérer depuis FMP
 */

import { AnnualData } from '../types';
import { loadCurrentSnapshotFromSupabase } from '../services/supabaseDataLoader';

export interface SyncNeeds {
  needsHistoricalData: boolean; // Besoin de données historiques complètes
  needsCurrentPrice: boolean; // Besoin du prix actuel
  needsInfo: boolean; // Besoin des infos (nom, secteur, etc.)
  needsKeyMetrics: boolean; // Besoin des key metrics (beta, etc.)
  missingYears: number[]; // Années manquantes dans les données existantes
  latestYearInSupabase: number | null; // Dernière année disponible dans Supabase
  hasAnyData: boolean; // A-t-on au moins quelques données?
}

/**
 * Analyse les besoins de synchronisation pour un ticker
 * Compare les données existantes avec ce qui pourrait être disponible depuis FMP
 */
export async function analyzeSyncNeeds(
  ticker: string,
  existingData: AnnualData[],
  existingCurrentPrice: number,
  existingInfo: any,
  options: {
    syncData?: boolean;
    syncInfo?: boolean;
    updateCurrentPrice?: boolean;
    syncOnlyNewYears?: boolean;
    syncOnlyMissingMetrics?: boolean;
  }
): Promise<SyncNeeds> {
  const upperTicker = ticker.toUpperCase();
  
  // 1. Vérifier si on a des données dans Supabase
  let supabaseSnapshot = null;
  try {
    supabaseSnapshot = await loadCurrentSnapshotFromSupabase(upperTicker);
  } catch (error) {
    console.warn(`⚠️ Erreur lors du chargement Supabase pour ${upperTicker}:`, error);
  }

  const hasSupabaseData = supabaseSnapshot && 
                          supabaseSnapshot.annual_data && 
                          supabaseSnapshot.annual_data.length > 0;

  // 2. Déterminer les années existantes
  const existingYears = new Set(existingData.map(d => d.year));
  const latestYear = existingData.length > 0 
    ? Math.max(...existingData.map(d => d.year))
    : null;

  // 3. Identifier les années manquantes (on suppose que FMP peut avoir jusqu'à l'année actuelle)
  const currentYear = new Date().getFullYear();
  const missingYears: number[] = [];
  
  if (options.syncOnlyNewYears && latestYear) {
    // Seulement les années après la dernière année existante
    for (let year = latestYear + 1; year <= currentYear; year++) {
      if (!existingYears.has(year)) {
        missingYears.push(year);
      }
    }
  } else if (options.syncData && existingData.length === 0) {
    // Aucune donnée existante - besoin de tout
    // On ne peut pas déterminer les années exactes sans appeler FMP
    // Mais on marque qu'on a besoin de données
  }

  // 4. Vérifier les métriques manquantes
  const hasMissingMetrics = options.syncOnlyMissingMetrics && existingData.length > 0
    ? existingData.some(row => 
        (!row.earningsPerShare || row.earningsPerShare === 0) ||
        (!row.cashFlowPerShare || row.cashFlowPerShare === 0) ||
        (!row.bookValuePerShare || row.bookValuePerShare === 0) ||
        (!row.dividendPerShare || row.dividendPerShare === 0) ||
        (!row.priceHigh || row.priceHigh === 0) ||
        (!row.priceLow || row.priceLow === 0)
      )
    : false;

  // 5. Déterminer les besoins
  const needsHistoricalData = options.syncData && (
    existingData.length === 0 || // Aucune donnée
    missingYears.length > 0 || // Années manquantes
    hasMissingMetrics || // Métriques manquantes
    !hasSupabaseData // Pas de snapshot Supabase (besoin de récupérer depuis FMP)
  );

  const needsCurrentPrice = options.updateCurrentPrice && (
    !existingCurrentPrice || 
    existingCurrentPrice === 0 ||
    !hasSupabaseData // Si pas de snapshot, récupérer le prix
  );

  const needsInfo = options.syncInfo && (
    !existingInfo || 
    !existingInfo.name || 
    !existingInfo.sector ||
    !hasSupabaseData // Si pas de snapshot, récupérer les infos
  );

  const needsKeyMetrics = options.syncInfo && (
    !existingInfo?.beta ||
    existingInfo.beta === null ||
    existingInfo.beta === undefined
  );

  return {
    needsHistoricalData,
    needsCurrentPrice,
    needsInfo,
    needsKeyMetrics,
    missingYears,
    latestYearInSupabase: latestYear,
    hasAnyData: existingData.length > 0 || hasSupabaseData
  };
}

/**
 * Détermine si on doit appeler FMP pour un ticker donné
 * Retourne false si toutes les données nécessaires sont déjà disponibles
 */
export async function shouldFetchFromFMP(
  ticker: string,
  existingData: AnnualData[],
  existingCurrentPrice: number,
  existingInfo: any,
  options: {
    syncData?: boolean;
    syncInfo?: boolean;
    updateCurrentPrice?: boolean;
    syncOnlyNewYears?: boolean;
    syncOnlyMissingMetrics?: boolean;
  }
): Promise<boolean> {
  const needs = await analyzeSyncNeeds(
    ticker,
    existingData,
    existingCurrentPrice,
    existingInfo,
    options
  );

  // Si aucune option de sync n'est activée, ne pas appeler FMP
  if (!options.syncData && !options.syncInfo && !options.updateCurrentPrice) {
    return false;
  }

  // Si on a besoin de données historiques, prix actuel, ou infos → appeler FMP
  return needs.needsHistoricalData || needs.needsCurrentPrice || needs.needsInfo;
}

/**
 * Filtre les données FMP pour ne garder que ce qui est nécessaire
 * Utile après avoir récupéré les données FMP pour éviter de traiter des données inutiles
 */
export function filterFMPDataForSync(
  fmpData: AnnualData[],
  existingData: AnnualData[],
  options: {
    syncOnlyNewYears?: boolean;
    syncOnlyMissingMetrics?: boolean;
  }
): AnnualData[] {
  if (!options.syncOnlyNewYears && !options.syncOnlyMissingMetrics) {
    // Pas de filtre - retourner toutes les données FMP
    return fmpData;
  }

  const existingYears = new Set(existingData.map(d => d.year));
  const existingDataByYear = new Map(existingData.map(d => [d.year, d]));

  if (options.syncOnlyNewYears) {
    // Seulement les nouvelles années
    return fmpData.filter(fmpRow => !existingYears.has(fmpRow.year));
  }

  if (options.syncOnlyMissingMetrics) {
    // Seulement les années avec métriques manquantes
    return fmpData.filter(fmpRow => {
      const existingRow = existingDataByYear.get(fmpRow.year);
      if (!existingRow) {
        // Nouvelle année - inclure
        return true;
      }
      
      // Vérifier si des métriques manquent
      const hasMissingMetrics = 
        (!existingRow.earningsPerShare || existingRow.earningsPerShare === 0) ||
        (!existingRow.cashFlowPerShare || existingRow.cashFlowPerShare === 0) ||
        (!existingRow.bookValuePerShare || existingRow.bookValuePerShare === 0) ||
        (!existingRow.dividendPerShare || existingRow.dividendPerShare === 0) ||
        (!existingRow.priceHigh || existingRow.priceHigh === 0) ||
        (!existingRow.priceLow || existingRow.priceLow === 0);

      return hasMissingMetrics;
    });
  }

  return fmpData;
}
