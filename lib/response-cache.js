// =====================================================
// EMMA IA - MODULE CACHE INTELLIGENT (2 HEURES)
// =====================================================
// Objectif: Réduire coûts SMS et améliorer temps de réponse
// Durée cache: 2 heures
// Économie estimée: 10-15% coûts SMS
// =====================================================

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;

// Initialiser le client Supabase
function getSupabaseClient() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// =====================================================
// FONCTION 1: Générer clé de cache unique
// =====================================================
/**
 * Génère une clé de cache unique basée sur ticker, type d'analyse et canal
 * @param {string} ticker - Ticker analysé (ex: 'AAPL')
 * @param {string} analysisType - Type d'analyse (ex: 'ticker_analysis')
 * @param {string} channel - Canal (ex: 'sms', 'web', 'email')
 * @returns {string} Clé de cache (hash SHA256)
 */
export function generateCacheKey(ticker, analysisType, channel) {
  const normalizedTicker = (ticker || '').toUpperCase().trim();
  const normalizedType = (analysisType || 'general').toLowerCase().trim();
  const normalizedChannel = (channel || 'web').toLowerCase().trim();
  
  const rawKey = `${normalizedTicker}:${normalizedType}:${normalizedChannel}`;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  
  console.log(`[Cache] Clé générée: ${rawKey} → ${hash.substring(0, 16)}...`);
  return hash;
}

// =====================================================
// FONCTION 2: Récupérer réponse du cache
// =====================================================
/**
 * Récupère une réponse du cache si elle existe et n'est pas expirée
 * @param {string} cacheKey - Clé de cache
 * @returns {Object|null} Réponse cachée ou null
 */
export async function getCachedResponse(cacheKey) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.log('[Cache] ⚠️ Supabase non configuré - cache désactivé');
    return null;
  }

  try {
    console.log(`[Cache] 🔍 Recherche cache: ${cacheKey.substring(0, 16)}...`);
    
    const { data, error } = await client
      .from('response_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[Cache] ❌ MISS - Aucune entrée trouvée');
        return null;
      }
      console.error('[Cache] Erreur lecture:', error);
      return null;
    }

    if (data) {
      // Incrémenter le compteur de hits
      await client
        .from('response_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('id', data.id);

      const age = Math.round((Date.now() - new Date(data.created_at).getTime()) / 1000 / 60);
      console.log(`[Cache] ✅ HIT - Âge: ${age} min, Hits: ${data.hit_count + 1}`);
      
      return {
        response: data.response,
        created_at: new Date(data.created_at).getTime(),
        hit_count: data.hit_count + 1,
        ticker: data.ticker,
        analysis_type: data.analysis_type,
        channel: data.channel,
        metadata: data.metadata
      };
    }

    console.log('[Cache] ❌ MISS - Entrée expirée ou inexistante');
    return null;

  } catch (error) {
    console.error('[Cache] Erreur getCachedResponse:', error);
    return null;
  }
}

// =====================================================
// FONCTION 3: Sauvegarder réponse dans le cache
// =====================================================
/**
 * Sauvegarde une réponse dans le cache avec expiration 2h
 * @param {string} cacheKey - Clé de cache
 * @param {string} response - Réponse complète d'Emma
 * @param {Object} metadata - Métadonnées additionnelles
 * @returns {boolean} Succès ou échec
 */
export async function setCachedResponse(cacheKey, response, metadata = {}) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.log('[Cache] ⚠️ Supabase non configuré - cache désactivé');
    return false;
  }

  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 heures

    const cacheEntry = {
      cache_key: cacheKey,
      ticker: metadata.ticker || null,
      analysis_type: metadata.analysis_type || null,
      channel: metadata.channel || 'web',
      response: response,
      metadata: metadata,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      hit_count: 0
    };

    console.log(`[Cache] 💾 Sauvegarde: ${cacheKey.substring(0, 16)}... (expire: ${expiresAt.toLocaleTimeString('fr-CA')})`);

    const { error } = await client
      .from('response_cache')
      .upsert(cacheEntry, { onConflict: 'cache_key' });

    if (error) {
      console.error('[Cache] Erreur sauvegarde:', error);
      return false;
    }

    console.log('[Cache] ✅ Sauvegarde réussie');
    return true;

  } catch (error) {
    console.error('[Cache] Erreur setCachedResponse:', error);
    return false;
  }
}

// =====================================================
// FONCTION 4: Invalider cache pour un ticker
// =====================================================
/**
 * Invalide toutes les entrées de cache pour un ticker donné
 * Utile en cas d'événement majeur (earnings, news importantes)
 * @param {string} ticker - Ticker à invalider
 * @returns {number} Nombre d'entrées supprimées
 */
export async function invalidateCache(ticker) {
  const client = getSupabaseClient();
  
  if (!client) {
    console.log('[Cache] ⚠️ Supabase non configuré - cache désactivé');
    return 0;
  }

  try {
    const normalizedTicker = ticker.toUpperCase().trim();
    console.log(`[Cache] 🗑️ Invalidation cache pour: ${normalizedTicker}`);

    const { data, error } = await client
      .from('response_cache')
      .delete()
      .eq('ticker', normalizedTicker)
      .select();

    if (error) {
      console.error('[Cache] Erreur invalidation:', error);
      return 0;
    }

    const count = data ? data.length : 0;
    console.log(`[Cache] ✅ ${count} entrée(s) invalidée(s)`);
    return count;

  } catch (error) {
    console.error('[Cache] Erreur invalidateCache:', error);
    return 0;
  }
}

// =====================================================
// FONCTION 5: Nettoyer entrées expirées
// =====================================================
/**
 * Nettoie toutes les entrées de cache expirées
 * À appeler périodiquement (ex: cron job)
 * @returns {number} Nombre d'entrées supprimées
 */
export async function cleanExpiredCache() {
  const client = getSupabaseClient();
  
  if (!client) {
    console.log('[Cache] ⚠️ Supabase non configuré - cache désactivé');
    return 0;
  }

  try {
    console.log('[Cache] 🧹 Nettoyage des entrées expirées...');

    const { data, error } = await client
      .from('response_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      console.error('[Cache] Erreur nettoyage:', error);
      return 0;
    }

    const count = data ? data.length : 0;
    console.log(`[Cache] ✅ ${count} entrée(s) expirée(s) supprimée(s)`);
    return count;

  } catch (error) {
    console.error('[Cache] Erreur cleanExpiredCache:', error);
    return 0;
  }
}

// =====================================================
// FONCTION 6: Statistiques du cache
// =====================================================
/**
 * Récupère les statistiques du cache
 * @returns {Object} Statistiques (total, hits, hit_rate, etc.)
 */
export async function getCacheStats() {
  const client = getSupabaseClient();
  
  if (!client) {
    return { enabled: false };
  }

  try {
    const { data, error } = await client
      .from('response_cache')
      .select('hit_count, created_at, expires_at, channel');

    if (error) {
      console.error('[Cache] Erreur stats:', error);
      return { enabled: true, error: true };
    }

    const now = Date.now();
    const active = data.filter(entry => new Date(entry.expires_at).getTime() > now);
    const totalHits = active.reduce((sum, entry) => sum + entry.hit_count, 0);
    const avgHits = active.length > 0 ? totalHits / active.length : 0;

    const byChannel = active.reduce((acc, entry) => {
      acc[entry.channel] = (acc[entry.channel] || 0) + 1;
      return acc;
    }, {});

    return {
      enabled: true,
      total_entries: data.length,
      active_entries: active.length,
      expired_entries: data.length - active.length,
      total_hits: totalHits,
      avg_hits_per_entry: Math.round(avgHits * 10) / 10,
      by_channel: byChannel
    };

  } catch (error) {
    console.error('[Cache] Erreur getCacheStats:', error);
    return { enabled: true, error: true };
  }
}

// =====================================================
// EXPORT PAR DÉFAUT
// =====================================================
export default {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  cleanExpiredCache,
  getCacheStats
};

