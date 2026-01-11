/**
 * Utilitaire pour nettoyer les profils en localStorage qui ne sont plus dans Supabase
 * 
 * Cette fonction:
 * 1. Charge tous les tickers actifs depuis Supabase
 * 2. Compare avec les profils en localStorage
 * 3. Supprime les profils qui ne correspondent à aucun ticker actif dans Supabase
 */

import { loadAllTickersFromSupabase } from '../services/tickersApi';
import { storage } from './storage';

const STORAGE_KEY = 'finance_pro_profiles';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Nettoie les profils en localStorage qui ne sont plus dans Supabase
 * 
 * @returns {Promise<{removed: number, kept: number, errors: string[]}>}
 */
export async function cleanupProfilesNotInSupabase() {
  try {
    console.log('🧹 Nettoyage des profils obsolètes...');

    // 1. Charger tous les tickers actifs depuis Supabase
    const supabaseResult = await loadAllTickersFromSupabase();
    if (!supabaseResult.success || !supabaseResult.tickers) {
      console.error('❌ Impossible de charger les tickers depuis Supabase');
      return {
        removed: 0,
        kept: 0,
        errors: ['Impossible de charger les tickers depuis Supabase']
      };
    }

    // Créer un Set des tickers actifs (normalisés en majuscules)
    const activeTickers = new Set(
      supabaseResult.tickers.map(t => t.ticker.toUpperCase())
    );

    console.log(`📊 ${activeTickers.size} tickers actifs dans Supabase`);

    // 2. Charger les profils depuis localStorage
    const saved = await storage.getItem(STORAGE_KEY);
    if (!saved) {
      console.log('✅ Aucun profil en localStorage');
      return { removed: 0, kept: 0, errors: [] };
    }

    // Parser les profils (gérer l'ancien et le nouveau format)
    let profiles = {};
    if (typeof saved === 'object' && 'data' in saved && 'timestamp' in saved) {
      // Nouveau format avec cache
      profiles = saved.data || {};
    } else if (typeof saved === 'object') {
      // Format direct
      profiles = saved;
    } else {
      console.log('✅ Format de profil non reconnu, pas de nettoyage nécessaire');
      return { removed: 0, kept: 0, errors: [] };
    }

    const profileKeys = Object.keys(profiles);
    console.log(`📋 ${profileKeys.length} profils en localStorage`);

    // 3. Identifier les profils à supprimer
    const toRemove = [];
    const toKeep = {};

    profileKeys.forEach(key => {
      const tickerUpper = key.toUpperCase();
      if (activeTickers.has(tickerUpper)) {
        // Profil correspond à un ticker actif → garder
        toKeep[key] = profiles[key];
      } else {
        // Profil ne correspond à aucun ticker actif → supprimer
        toRemove.push(key);
      }
    });

    console.log(`🗑️  ${toRemove.length} profils à supprimer`);
    console.log(`✅ ${Object.keys(toKeep).length} profils à garder`);

    if (toRemove.length > 0) {
      // 4. Sauvegarder seulement les profils à garder
      const cacheEntry = {
        data: toKeep,
        timestamp: Date.now()
      };

      await storage.setItem(STORAGE_KEY, cacheEntry);

      console.log(`✅ Nettoyage terminé: ${toRemove.length} profils supprimés`);
      
      // Log des profils supprimés (limité à 20 pour éviter le spam)
      if (toRemove.length <= 20) {
        console.log(`   Profils supprimés: ${toRemove.join(', ')}`);
      } else {
        console.log(`   Profils supprimés: ${toRemove.slice(0, 20).join(', ')} ... et ${toRemove.length - 20} autres`);
      }
    } else {
      console.log('✅ Aucun profil obsolète trouvé');
    }

    return {
      removed: toRemove.length,
      kept: Object.keys(toKeep).length,
      errors: [],
      removedTickers: toRemove
    };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return {
      removed: 0,
      kept: 0,
      errors: [error.message || 'Erreur inconnue']
    };
  }
}

/**
 * Nettoie automatiquement les profils lors du chargement de l'application
 * Peut être appelé depuis App.tsx lors de l'initialisation
 */
export async function autoCleanupProfiles() {
  try {
    const result = await cleanupProfilesNotInSupabase();
    if (result.removed > 0) {
      console.log(`🧹 Nettoyage automatique: ${result.removed} profils obsolètes supprimés`);
    }
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage automatique:', error);
    return { removed: 0, kept: 0, errors: [error.message] };
  }
}
