/**
 * Utilitaire pour nettoyer les profils en localStorage qui ne sont plus dans Supabase
 * 
 * Cette fonction:
 * 1. Charge tous les tickers actifs depuis Supabase
 * 2. Compare avec les profils en localStorage
 * 3. Supprime les profils qui ne correspondent a aucun ticker actif dans Supabase
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
    console.log(' Nettoyage des profils obsoletes...');

    // 1. Charger tous les tickers actifs depuis Supabase
    const supabaseResult = await loadAllTickersFromSupabase();
    if (!supabaseResult.success || !supabaseResult.tickers) {
      console.error(' Impossible de charger les tickers depuis Supabase');
      return {
        removed: 0,
        kept: 0,
        errors: ['Impossible de charger les tickers depuis Supabase']
      };
    }

    // Creer un Set des tickers actifs (normalises en majuscules)
    const activeTickers = new Set(
      supabaseResult.tickers.map(t => t.ticker.toUpperCase())
    );

    console.log(` ${activeTickers.size} tickers actifs dans Supabase`);

    // 2. Charger les profils depuis localStorage
    const saved = await storage.getItem(STORAGE_KEY);
    if (!saved) {
      console.log(' Aucun profil en localStorage');
      return { removed: 0, kept: 0, errors: [] };
    }

    // Parser les profils (gerer l'ancien et le nouveau format)
    let profiles = {};
    if (typeof saved === 'object' && 'data' in saved && 'timestamp' in saved) {
      // Nouveau format avec cache
      profiles = saved.data || {};
    } else if (typeof saved === 'object') {
      // Format direct
      profiles = saved;
    } else {
      console.log(' Format de profil non reconnu, pas de nettoyage necessaire');
      return { removed: 0, kept: 0, errors: [] };
    }

    const profileKeys = Object.keys(profiles);
    console.log(` ${profileKeys.length} profils en localStorage`);

    // 3. Identifier les profils a supprimer
    const toRemove = [];
    const toKeep = {};

    profileKeys.forEach(key => {
      const tickerUpper = key.toUpperCase();
      if (activeTickers.has(tickerUpper)) {
        // Profil correspond a un ticker actif -> garder
        toKeep[key] = profiles[key];
      } else {
        // Profil ne correspond a aucun ticker actif -> supprimer
        toRemove.push(key);
      }
    });

    console.log(`  ${toRemove.length} profils a supprimer`);
    console.log(` ${Object.keys(toKeep).length} profils a garder`);

    if (toRemove.length > 0) {
      // 4. Sauvegarder seulement les profils a garder
      const cacheEntry = {
        data: toKeep,
        timestamp: Date.now()
      };

      await storage.setItem(STORAGE_KEY, cacheEntry);

      console.log(` Nettoyage termine: ${toRemove.length} profils supprimes`);
      
      // Log des profils supprimes (limite a 20 pour eviter le spam)
      if (toRemove.length <= 20) {
        console.log(`   Profils supprimes: ${toRemove.join(', ')}`);
      } else {
        console.log(`   Profils supprimes: ${toRemove.slice(0, 20).join(', ')} ... et ${toRemove.length - 20} autres`);
      }
    } else {
      console.log(' Aucun profil obsolete trouve');
    }

    return {
      removed: toRemove.length,
      kept: Object.keys(toKeep).length,
      errors: [],
      removedTickers: toRemove
    };

  } catch (error) {
    console.error(' Erreur lors du nettoyage:', error);
    return {
      removed: 0,
      kept: 0,
      errors: [error.message || 'Erreur inconnue']
    };
  }
}

/**
 * Nettoie automatiquement les profils lors du chargement de l'application
 * Peut etre appele depuis App.tsx lors de l'initialisation
 */
export async function autoCleanupProfiles() {
  try {
    const result = await cleanupProfilesNotInSupabase();
    if (result.removed > 0) {
      console.log(` Nettoyage automatique: ${result.removed} profils obsoletes supprimes`);
    }
    return result;
  } catch (error) {
    console.error(' Erreur lors du nettoyage automatique:', error);
    return { removed: 0, kept: 0, errors: [error.message] };
  }
}
