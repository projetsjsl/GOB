#!/usr/bin/env node
/**
 * Script de vidage automatique du cache après déploiement
 * 
 * Utilisation:
 * - Appelé automatiquement par GitHub Actions après chaque push
 * - Peut être appelé manuellement: node scripts/clear-cache-post-deploy.js
 * 
 * Objectif:
 * - Vider le cache response_cache après chaque déploiement
 * - Garantir que les nouvelles optimisations sont appliquées immédiatement
 * - Éviter de servir des réponses avec l'ancien format
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

async function clearCache() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        🗑️  VIDAGE CACHE POST-DÉPLOIEMENT                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
    console.error('   SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_KEY:', supabaseKey ? '✅' : '❌');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Compter les entrées avant suppression
    const { count: beforeCount, error: countError } = await supabase
      .from('response_cache')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    console.log(`📊 Entrées dans le cache: ${beforeCount || 0}`);

    if (!beforeCount || beforeCount === 0) {
      console.log('✅ Cache déjà vide - Rien à faire\n');
      return;
    }

    // 2. Supprimer toutes les entrées
    console.log('🗑️  Suppression de toutes les entrées...');
    
    const { data, error } = await supabase
      .from('response_cache')
      .delete()
      .neq('id', 0) // Supprimer toutes les lignes (condition toujours vraie)
      .select();

    if (error) {
      throw error;
    }

    const deletedCount = data ? data.length : 0;
    console.log(`✅ ${deletedCount} entrée(s) supprimée(s)`);

    // 3. Vérifier que le cache est vide
    const { count: afterCount } = await supabase
      .from('response_cache')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Entrées restantes: ${afterCount || 0}`);

    if (afterCount === 0) {
      console.log('\n✅ Cache vidé avec succès!\n');
      console.log('📝 Les prochaines requêtes généreront de nouvelles réponses');
      console.log('   avec les dernières optimisations déployées.\n');
    } else {
      console.warn(`\n⚠️  Attention: ${afterCount} entrée(s) n'ont pas été supprimées\n`);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors du vidage du cache:', error.message);
    console.error('   Détails:', error);
    process.exit(1);
  }
}

// Exécuter le script
clearCache();

