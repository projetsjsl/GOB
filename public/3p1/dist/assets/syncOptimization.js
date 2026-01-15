import { z as loadCurrentSnapshotFromSupabase } from "./index.js";
async function analyzeSyncNeeds(ticker, existingData, existingCurrentPrice, existingInfo, options) {
  const upperTicker = ticker.toUpperCase();
  let supabaseSnapshot = null;
  try {
    supabaseSnapshot = await loadCurrentSnapshotFromSupabase(upperTicker);
  } catch (error) {
    console.warn(` Erreur lors du chargement Supabase pour ${upperTicker}:`, error);
  }
  const hasSupabaseData = supabaseSnapshot && supabaseSnapshot.annual_data && supabaseSnapshot.annual_data.length > 0;
  const existingYears = new Set(existingData.map((d) => d.year));
  const latestYear = existingData.length > 0 ? Math.max(...existingData.map((d) => d.year)) : null;
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const missingYears = [];
  if (options.syncOnlyNewYears && latestYear) {
    for (let year = latestYear + 1; year <= currentYear; year++) {
      if (!existingYears.has(year)) {
        missingYears.push(year);
      }
    }
  } else if (options.syncData && existingData.length === 0) ;
  const hasMissingMetrics = options.syncOnlyMissingMetrics && existingData.length > 0 ? existingData.some(
    (row) => !row.earningsPerShare || row.earningsPerShare === 0 || (!row.cashFlowPerShare || row.cashFlowPerShare === 0) || (!row.bookValuePerShare || row.bookValuePerShare === 0) || (!row.dividendPerShare || row.dividendPerShare === 0) || (!row.priceHigh || row.priceHigh === 0) || (!row.priceLow || row.priceLow === 0)
  ) : false;
  const needsHistoricalData = options.syncData && (existingData.length === 0 || // Aucune donnee
  missingYears.length > 0 || // Annees manquantes
  hasMissingMetrics || // Metriques manquantes
  !hasSupabaseData);
  const needsCurrentPrice = options.updateCurrentPrice && (!existingCurrentPrice || existingCurrentPrice === 0 || !hasSupabaseData);
  const needsInfo = options.syncInfo && (!existingInfo || !existingInfo.name || !existingInfo.sector || !hasSupabaseData);
  const needsKeyMetrics = options.syncInfo && (!(existingInfo == null ? void 0 : existingInfo.beta) || existingInfo.beta === null || existingInfo.beta === void 0);
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
async function shouldFetchFromFMP(ticker, existingData, existingCurrentPrice, existingInfo, options) {
  const needs = await analyzeSyncNeeds(
    ticker,
    existingData,
    existingCurrentPrice,
    existingInfo,
    options
  );
  if (!options.syncData && !options.syncInfo && !options.updateCurrentPrice) {
    return false;
  }
  return needs.needsHistoricalData || needs.needsCurrentPrice || needs.needsInfo;
}
function filterFMPDataForSync(fmpData, existingData, options) {
  if (!options.syncOnlyNewYears && !options.syncOnlyMissingMetrics) {
    return fmpData;
  }
  const existingYears = new Set(existingData.map((d) => d.year));
  const existingDataByYear = new Map(existingData.map((d) => [d.year, d]));
  if (options.syncOnlyNewYears) {
    return fmpData.filter((fmpRow) => !existingYears.has(fmpRow.year));
  }
  if (options.syncOnlyMissingMetrics) {
    return fmpData.filter((fmpRow) => {
      const existingRow = existingDataByYear.get(fmpRow.year);
      if (!existingRow) {
        return true;
      }
      const hasMissingMetrics = !existingRow.earningsPerShare || existingRow.earningsPerShare === 0 || (!existingRow.cashFlowPerShare || existingRow.cashFlowPerShare === 0) || (!existingRow.bookValuePerShare || existingRow.bookValuePerShare === 0) || (!existingRow.dividendPerShare || existingRow.dividendPerShare === 0) || (!existingRow.priceHigh || existingRow.priceHigh === 0) || (!existingRow.priceLow || existingRow.priceLow === 0);
      return hasMissingMetrics;
    });
  }
  return fmpData;
}
export {
  analyzeSyncNeeds,
  filterFMPDataForSync,
  shouldFetchFromFMP
};
