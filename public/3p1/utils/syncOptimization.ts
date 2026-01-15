/**
 * Utilitaires pour optimiser la synchronisation FMP
 * Identifie les donnees manquantes ou obsoletes avant de recuperer depuis FMP
 */

import { AnnualData } from '../types';
import { loadCurrentSnapshotFromSupabase } from '../services/supabaseDataLoader';

export interface SyncNeeds {
  needsHistoricalData: boolean; // Besoin de donnees historiques completes
  needsCurrentPrice: boolean; // Besoin du prix actuel
  needsInfo: boolean; // Besoin des infos (nom, secteur, etc.)
  needsKeyMetrics: boolean; // Besoin des key metrics (beta, etc.)
  missingYears: number[]; // Annees manquantes dans les donnees existantes
  latestYearInSupabase: number | null; // Derniere annee disponible dans Supabase
  hasAnyData: boolean; // A-t-on au moins quelques donnees?
}

/**
 * Analyse les besoins de synchronisation pour un ticker
 * Compare les donnees existantes avec ce qui pourrait etre disponible depuis FMP
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
  
  // 1. Verifier si on a des donnees dans Supabase
  let supabaseSnapshot = null;
  try {
    supabaseSnapshot = await loadCurrentSnapshotFromSupabase(upperTicker);
  } catch (error) {
    console.warn(` Erreur lors du chargement Supabase pour ${upperTicker}:`, error);
  }

  const hasSupabaseData = supabaseSnapshot && 
                          supabaseSnapshot.annual_data && 
                          supabaseSnapshot.annual_data.length > 0;

  // 2. Determiner les annees existantes
  const existingYears = new Set(existingData.map(d => d.year));
  const latestYear = existingData.length > 0 
    ? Math.max(...existingData.map(d => d.year))
    : null;

  // 3. Identifier les annees manquantes (on suppose que FMP peut avoir jusqu'a l'annee actuelle)
  const currentYear = new Date().getFullYear();
  const missingYears: number[] = [];
  
  if (options.syncOnlyNewYears && latestYear) {
    // Seulement les annees apres la derniere annee existante
    for (let year = latestYear + 1; year <= currentYear; year++) {
      if (!existingYears.has(year)) {
        missingYears.push(year);
      }
    }
  } else if (options.syncData && existingData.length === 0) {
    // Aucune donnee existante - besoin de tout
    // On ne peut pas determiner les annees exactes sans appeler FMP
    // Mais on marque qu'on a besoin de donnees
  }

  // 4. Verifier les metriques manquantes
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

  // 5. Determiner les besoins
  const needsHistoricalData = options.syncData && (
    existingData.length === 0 || // Aucune donnee
    missingYears.length > 0 || // Annees manquantes
    hasMissingMetrics || // Metriques manquantes
    !hasSupabaseData // Pas de snapshot Supabase (besoin de recuperer depuis FMP)
  );

  const needsCurrentPrice = options.updateCurrentPrice && (
    !existingCurrentPrice || 
    existingCurrentPrice === 0 ||
    !hasSupabaseData // Si pas de snapshot, recuperer le prix
  );

  const needsInfo = options.syncInfo && (
    !existingInfo || 
    !existingInfo.name || 
    !existingInfo.sector ||
    !hasSupabaseData // Si pas de snapshot, recuperer les infos
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
 * Determine si on doit appeler FMP pour un ticker donne
 * Retourne false si toutes les donnees necessaires sont deja disponibles
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

  // Si aucune option de sync n'est activee, ne pas appeler FMP
  if (!options.syncData && !options.syncInfo && !options.updateCurrentPrice) {
    return false;
  }

  // Si on a besoin de donnees historiques, prix actuel, ou infos -> appeler FMP
  return needs.needsHistoricalData || needs.needsCurrentPrice || needs.needsInfo;
}

/**
 * Filtre les donnees FMP pour ne garder que ce qui est necessaire
 * Utile apres avoir recupere les donnees FMP pour eviter de traiter des donnees inutiles
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
    // Pas de filtre - retourner toutes les donnees FMP
    return fmpData;
  }

  const existingYears = new Set(existingData.map(d => d.year));
  const existingDataByYear = new Map(existingData.map(d => [d.year, d]));

  if (options.syncOnlyNewYears) {
    // Seulement les nouvelles annees
    return fmpData.filter(fmpRow => !existingYears.has(fmpRow.year));
  }

  if (options.syncOnlyMissingMetrics) {
    // Seulement les annees avec metriques manquantes
    return fmpData.filter(fmpRow => {
      const existingRow = existingDataByYear.get(fmpRow.year);
      if (!existingRow) {
        // Nouvelle annee - inclure
        return true;
      }
      
      // Verifier si des metriques manquent
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
