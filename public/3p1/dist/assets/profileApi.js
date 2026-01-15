const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./appConfigApi.js","./index.js","./index.css"])))=>i.map(i=>d[i]);
import { _ as __vitePreload, y as saveSnapshot } from "./index.js";
const API_BASE = typeof window !== "undefined" ? window.location.origin : "";
async function saveProfileToSupabase(profile, notes) {
  try {
    if (!profile.id || !profile.data || !profile.assumptions || !profile.info) {
      return { success: false, error: "Profil incomplet" };
    }
    const result = await saveSnapshot(
      profile.id,
      profile.data,
      profile.assumptions,
      profile.info,
      notes || `Profil sauvegarde automatiquement`,
      true,
      // is_current
      false,
      // auto_fetched
      0,
      // retryCount
      2,
      // maxRetries
      {
        source: "profile_save",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    );
    return result;
  } catch (error) {
    console.error(` Erreur sauvegarde profil ${profile.id} dans Supabase:`, error);
    return { success: false, error: error.message || "Erreur inconnue" };
  }
}
async function saveProfilesBatchToSupabase(profiles) {
  const tickers = Object.keys(profiles);
  let successCount = 0;
  let failedCount = 0;
  const errors = [];
  console.log(` Sauvegarde batch de ${tickers.length} profils dans Supabase...`);
  const { getConfigValue } = await __vitePreload(async () => {
    const { getConfigValue: getConfigValue2 } = await import("./appConfigApi.js");
    return { getConfigValue: getConfigValue2 };
  }, true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url);
  const configuredBatchSize = Number(await getConfigValue("profile_batch_size"));
  const configuredDelayMs = Number(await getConfigValue("delay_between_batches_ms"));
  const MAX_CONCURRENT_SAVES = 10;
  const batchSize = Number.isFinite(configuredBatchSize) && configuredBatchSize > 0 ? Math.max(1, Math.min(Math.floor(configuredBatchSize), MAX_CONCURRENT_SAVES)) : Math.min(5, MAX_CONCURRENT_SAVES);
  const batchDelayMs = Number.isFinite(configuredDelayMs) && configuredDelayMs >= 0 ? configuredDelayMs : 500;
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (ticker) => {
        const profile = profiles[ticker];
        if (!profile) return;
        const result = await saveProfileToSupabase(profile);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push(`${ticker}: ${result.error || "Erreur inconnue"}`);
        }
      })
    );
    if (i + batchSize < tickers.length && batchDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
    }
  }
  console.log(` Sauvegarde batch terminee: ${successCount} succes, ${failedCount} echecs`);
  return {
    success: successCount,
    failed: failedCount,
    errors
  };
}
async function loadAllProfilesFromSupabase() {
  try {
    const { getConfigValue } = await __vitePreload(async () => {
      const { getConfigValue: getConfigValue2 } = await import("./appConfigApi.js");
      return { getConfigValue: getConfigValue2 };
    }, true ? __vite__mapDeps([0,1,2]) : void 0, import.meta.url);
    const limit = await getConfigValue("snapshots_limit");
    const response = await fetch(`${API_BASE}/api/finance-snapshots?all=true&current=true&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.success || !result.data) {
      return { success: false, profiles: {}, error: "Format de reponse invalide" };
    }
    const profiles = {};
    result.data.forEach((snapshot) => {
      if (snapshot.ticker && snapshot.annual_data && snapshot.assumptions && snapshot.company_info) {
        profiles[snapshot.ticker.toUpperCase()] = {
          id: snapshot.ticker.toUpperCase(),
          lastModified: new Date(snapshot.snapshot_date).getTime(),
          data: snapshot.annual_data || [],
          assumptions: snapshot.assumptions || {},
          info: snapshot.company_info || {},
          notes: snapshot.notes || "",
          isWatchlist: null
          // Sera determine depuis tickers table
        };
      }
    });
    console.log(` ${Object.keys(profiles).length} profils charges depuis Supabase`);
    return {
      success: true,
      profiles
    };
  } catch (error) {
    console.error(" Erreur chargement profils depuis Supabase:", error);
    return {
      success: false,
      profiles: {},
      error: error.message || "Erreur inconnue"
    };
  }
}
export {
  loadAllProfilesFromSupabase,
  saveProfileToSupabase,
  saveProfilesBatchToSupabase
};
