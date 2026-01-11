/**
 * Script pour exécuter le nettoyage des tickers inutiles dans Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Supprime les tickers inutiles
 */
async function executeCleanup() {
  console.log('🧹 Exécution du nettoyage des tickers inutiles...\n');

  // Charger le rapport JSON
  const reportPath = path.join(__dirname, '../docs/RAPPORT_NETTOYAGE_TICKERS.json');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Rapport non trouvé. Exécutez d\'abord validate-and-cleanup-tickers.js');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const toDelete = report.toDelete || [];

  if (toDelete.length === 0) {
    console.log('✅ Aucun ticker à supprimer');
    return;
  }

  console.log(`📋 ${toDelete.length} tickers à supprimer\n`);

  // Supprimer par batch de 50 pour éviter les limites
  const batchSize = 50;
  let deleted = 0;
  let errors = [];

  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toDelete.length / batchSize);

    console.log(`🗑️  Batch ${batchNum}/${totalBatches}: Suppression de ${batch.length} tickers...`);

    // Supprimer chaque ticker individuellement pour avoir un meilleur contrôle
    for (const ticker of batch) {
      const { error } = await supabase
        .from('tickers')
        .delete()
        .eq('ticker', ticker);

      if (error) {
        console.error(`   ❌ Erreur pour ${ticker}:`, error.message);
        errors.push({ ticker, error: error.message });
      } else {
        deleted++;
      }
    }

    // Petite pause entre les batches
    if (i + batchSize < toDelete.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n✅ Nettoyage terminé!`);
  console.log(`   - Supprimés: ${deleted}/${toDelete.length}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
    console.log(`\n❌ Tickers avec erreurs:`);
    errors.forEach(e => {
      console.log(`   - ${e.ticker}: ${e.error}`);
    });
  }

  // Vérifier le résultat
  const { count } = await supabase
    .from('tickers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total tickers restants: ${count}`);
  console.log(`   (Devrait être: ${1118 - toDelete.length})`);

  // Sauvegarder le rapport d'exécution
  const executionReport = {
    executedAt: new Date().toISOString(),
    totalToDelete: toDelete.length,
    deleted: deleted,
    errors: errors,
    remainingTickers: count
  };

  const executionReportPath = path.join(__dirname, '../docs/EXECUTION_NETTOYAGE_TICKERS.json');
  fs.writeFileSync(executionReportPath, JSON.stringify(executionReport, null, 2));
  console.log(`\n✅ Rapport d'exécution sauvegardé: ${executionReportPath}`);
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  executeCleanup()
    .then(() => {
      console.log('\n✅ Script terminé!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { executeCleanup };
