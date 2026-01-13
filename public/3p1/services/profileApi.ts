/**
 * Service pour sauvegarder et charger les profils depuis Supabase
 * Remplace progressivement localStorage/IndexedDB par Supabase comme source de vérité
 */

import { AnalysisProfile } from '../types';
import { saveSnapshot } from './snapshotApi';

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

/**
 * Sauvegarde un profil complet dans Supabase (via snapshot)
 * Utilise saveSnapshot avec is_current=true pour marquer comme version actuelle
 */
export async function saveProfileToSupabase(
  profile: AnalysisProfile,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!profile.id || !profile.data || !profile.assumptions || !profile.info) {
      return { success: false, error: 'Profil incomplet' };
    }

    // Sauvegarder comme snapshot actuel
    const result = await saveSnapshot(
      profile.id,
      profile.data,
      profile.assumptions,
      profile.info,
      notes || `Profil sauvegardé automatiquement`,
      true, // is_current
      false, // auto_fetched
      0, // retryCount
      2, // maxRetries
      {
        source: 'profile_save',
        timestamp: new Date().toISOString()
      }
    );

    return result;
  } catch (error: any) {
    console.error(`❌ Erreur sauvegarde profil ${profile.id} dans Supabase:`, error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Sauvegarde plusieurs profils en batch dans Supabase
 * Optimisé pour sauvegarder tous les profils d'un coup
 */
export async function saveProfilesBatchToSupabase(
  profiles: Record<string, AnalysisProfile>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const tickers = Object.keys(profiles);
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  console.log(`💾 Sauvegarde batch de ${tickers.length} profils dans Supabase...`);

  // ✅ Charger la taille du batch depuis Supabase (pas de hardcoding)
  const { getConfigValue } = await import('./appConfigApi');
  const configuredBatchSize = Number(await getConfigValue('profile_batch_size'));
  const configuredDelayMs = Number(await getConfigValue('delay_between_batches_ms'));
  const MAX_CONCURRENT_SAVES = 10;
  const batchSize = Number.isFinite(configuredBatchSize) && configuredBatchSize > 0
    ? Math.max(1, Math.min(Math.floor(configuredBatchSize), MAX_CONCURRENT_SAVES))
    : Math.min(5, MAX_CONCURRENT_SAVES);
  const batchDelayMs = Number.isFinite(configuredDelayMs) && configuredDelayMs >= 0
    ? configuredDelayMs
    : 500;

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
          errors.push(`${ticker}: ${result.error || 'Erreur inconnue'}`);
        }
      })
    );

    // Petit délai entre batches pour éviter rate limiting
    if (i + batchSize < tickers.length && batchDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, batchDelayMs));
    }
  }

  console.log(`✅ Sauvegarde batch terminée: ${successCount} succès, ${failedCount} échecs`);

  return {
    success: successCount,
    failed: failedCount,
    errors
  };
}

/**
 * Charge tous les profils depuis Supabase (via snapshots actuels)
 * Utilise l'endpoint existant pour charger tous les snapshots is_current=true
 */
export async function loadAllProfilesFromSupabase(): Promise<{
  success: boolean;
  profiles: Record<string, AnalysisProfile>;
  error?: string;
}> {
  try {
    // ✅ Limite depuis Supabase (pas de hardcoding)
    const { getConfigValue } = await import('./appConfigApi');
    const limit = await getConfigValue('snapshots_limit');
    const response = await fetch(`${API_BASE}/api/finance-snapshots?all=true&current=true&limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return { success: false, profiles: {}, error: 'Format de réponse invalide' };
    }

    const profiles: Record<string, AnalysisProfile> = {};

    // Convertir les snapshots en profils
    result.data.forEach((snapshot: any) => {
      if (snapshot.ticker && snapshot.annual_data && snapshot.assumptions && snapshot.company_info) {
        profiles[snapshot.ticker.toUpperCase()] = {
          id: snapshot.ticker.toUpperCase(),
          lastModified: new Date(snapshot.snapshot_date).getTime(),
          data: snapshot.annual_data || [],
          assumptions: snapshot.assumptions || {},
          info: snapshot.company_info || {},
          notes: snapshot.notes || '',
          isWatchlist: null // Sera déterminé depuis tickers table
        };
      }
    });

    console.log(`✅ ${Object.keys(profiles).length} profils chargés depuis Supabase`);

    return {
      success: true,
      profiles
    };
  } catch (error: any) {
    console.error('❌ Erreur chargement profils depuis Supabase:', error);
    return {
      success: false,
      profiles: {},
      error: error.message || 'Erreur inconnue'
    };
  }
}
