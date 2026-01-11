/**
 * Script optimisé pour valider que tous les tickers actifs sont disponibles dans FMP
 * Traite par batch et peut reprendre après interruption
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
const FMP_API_KEY = process.env.FMP_API_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  process.exit(1);
}

if (!FMP_API_KEY) {
  console.error('❌ FMP_API_KEY non définie');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const STATE_FILE = path.join(__dirname, '../docs/FMP_VALIDATION_STATE.json');

/**
 * Vérifie plusieurs tickers en batch via l'API batch existante
 */
async function checkFMPAvailabilityBatch(tickers) {
  try {
    // Utiliser l'endpoint batch existant (profile endpoint de FMP)
    // FMP supporte jusqu'à 10-20 symboles par batch selon le plan
    const BATCH_SIZE = 10;
    const results = {};

    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE);
      const symbolString = batch.join(',');
      
      const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbolString}?apikey=${FMP_API_KEY}`;
      const response = await fetch(profileUrl);
      
      if (!response.ok) {
        // Si erreur HTTP, marquer tous les tickers du batch comme non disponibles
        batch.forEach(ticker => {
          results[ticker] = { available: false, reason: `HTTP ${response.status}` };
        });
        continue;
      }

      const data = await response.json();
      
      // Créer un map des résultats par symbole
      const dataMap = new Map();
      if (Array.isArray(data)) {
        data.forEach(item => {
          const symbol = (item.symbol || item.ticker || '').toUpperCase();
          if (symbol) {
            dataMap.set(symbol, item);
          }
        });
      }

      // Vérifier chaque ticker du batch
      batch.forEach(ticker => {
        const tickerUpper = ticker.toUpperCase();
        const item = dataMap.get(tickerUpper);
        
        if (!item) {
          results[ticker] = { available: false, reason: 'Aucune donnée retournée' };
        } else if (item.symbol && item.symbol.toUpperCase() !== tickerUpper) {
          results[ticker] = { available: false, reason: `Symbole différent: ${item.symbol}` };
        } else {
          results[ticker] = { 
            available: true, 
            companyName: item.companyName,
            exchange: item.exchangeShortName,
            sector: item.sector
          };
        }
      });

      // Pause entre batches pour respecter le rate limiting (300ms)
      if (i + BATCH_SIZE < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return results;
  } catch (error) {
    // En cas d'erreur globale, marquer tous comme non disponibles
    const results = {};
    tickers.forEach(ticker => {
      results[ticker] = { available: false, reason: error.message };
    });
    return results;
  }
}

/**
 * Valide tous les tickers actifs avec FMP (version batch)
 */
async function validateFMPAvailabilityBatch() {
  console.log('🔍 Validation de la disponibilité FMP pour tous les tickers actifs...\n');

  // Charger l'état précédent si existe
  let state = { processed: [], available: [], unavailable: [] };
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    console.log(`📂 État précédent chargé: ${state.processed.length} tickers déjà traités\n`);
  }

  // Récupérer tous les tickers actifs
  let allTickers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: tickers, error } = await supabase
      .from('tickers')
      .select('ticker, company_name, source')
      .eq('is_active', true)
      .order('ticker')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('❌ Erreur:', error);
      throw error;
    }

    if (tickers && tickers.length > 0) {
      allTickers.push(...tickers);
      from += pageSize;
      hasMore = tickers.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  // Filtrer les tickers déjà traités
  const processedSet = new Set(state.processed);
  const tickersToProcess = allTickers.filter(t => !processedSet.has(t.ticker));

  console.log(`📊 ${allTickers.length} tickers actifs au total`);
  console.log(`   ${state.processed.length} déjà traités`);
  console.log(`   ${tickersToProcess.length} à traiter\n`);

  if (tickersToProcess.length === 0) {
    console.log('✅ Tous les tickers ont déjà été traités!');
    return {
      available: state.available,
      unavailable: state.unavailable
    };
  }

  // Traiter par batch de 50 tickers (qui seront vérifiés en sous-batches de 10 via FMP)
  const batchSize = 50;
  for (let i = 0; i < tickersToProcess.length; i += batchSize) {
    const batch = tickersToProcess.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(tickersToProcess.length / batchSize);

    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} tickers)...`);

    // Extraire les symboles pour le batch FMP
    const tickerSymbols = batch.map(t => t.ticker);
    
    // Vérifier tous les tickers du batch en une seule fois (utilise le batch FMP interne)
    const batchResults = await checkFMPAvailabilityBatch(tickerSymbols);

    // Traiter les résultats
    batch.forEach(ticker => {
      const check = batchResults[ticker.ticker];
      
      if (check && check.available) {
        state.available.push({
          ticker: ticker.ticker,
          company_name: ticker.company_name,
          source: ticker.source
        });
        process.stdout.write(`   ✅ ${ticker.ticker} `);
      } else {
        state.unavailable.push({
          ticker: ticker.ticker,
          company_name: ticker.company_name,
          source: ticker.source,
          reason: check ? check.reason : 'Erreur inconnue'
        });
        process.stdout.write(`   ❌ ${ticker.ticker} `);
      }

      state.processed.push(ticker.ticker);
    });

    // Sauvegarder l'état après chaque batch
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    console.log(`\n   Progression: ${state.processed.length}/${allTickers.length} (${((state.processed.length / allTickers.length) * 100).toFixed(1)}%)\n`);

    // Pause entre batches (500ms)
    if (i + batchSize < tickersToProcess.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n📊 Résultats finaux:`);
  console.log(`   ✅ Disponibles dans FMP: ${state.available.length}`);
  console.log(`   ❌ Non disponibles dans FMP: ${state.unavailable.length}`);

  // Générer le rapport final
  const report = {
    generated_at: new Date().toISOString(),
    total_tickers: allTickers.length,
    available: state.available.length,
    unavailable: state.unavailable.length,
    unavailable_tickers: state.unavailable
  };

  const reportPath = path.join(__dirname, '../docs/VALIDATION_FMP_DISPONIBILITE.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport sauvegardé: ${reportPath}`);

  // Générer le rapport Markdown
  const mdPath = path.join(__dirname, '../docs/VALIDATION_FMP_DISPONIBILITE.md');
  let mdContent = `# 🔍 Validation Disponibilité FMP\n\n`;
  mdContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  mdContent += `## 📊 Résumé\n\n`;
  mdContent += `- **Total tickers actifs:** ${allTickers.length}\n`;
  mdContent += `- **Disponibles dans FMP:** ${state.available.length} (${((state.available.length / allTickers.length) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Non disponibles dans FMP:** ${state.unavailable.length} (${((state.unavailable.length / allTickers.length) * 100).toFixed(1)}%)\n\n`;

  if (state.unavailable.length > 0) {
    mdContent += `## ❌ Tickers Non Disponibles dans FMP (${state.unavailable.length})\n\n`;
    mdContent += `Ces tickers seront supprimés car ils ne peuvent pas être récupérés depuis FMP:\n\n`;
    mdContent += `| Ticker | Company Name | Source | Raison |\n`;
    mdContent += `|--------|--------------|--------|--------|\n`;
    state.unavailable.forEach(item => {
      mdContent += `| ${item.ticker} | ${item.company_name || 'N/A'} | ${item.source || 'N/A'} | ${item.reason} |\n`;
    });
    mdContent += `\n`;
  }

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown sauvegardé: ${mdPath}`);

  return {
    available: state.available,
    unavailable: state.unavailable
  };
}

/**
 * Supprime les tickers non disponibles dans FMP
 */
async function deleteUnavailableTickers(unavailableTickers) {
  if (unavailableTickers.length === 0) {
    console.log('\n✅ Aucun ticker à supprimer');
    return { deleted: 0, errors: [] };
  }

  console.log(`\n🗑️  Suppression de ${unavailableTickers.length} tickers non disponibles dans FMP...\n`);

  const tickersToDelete = unavailableTickers.map(t => t.ticker);
  let deleted = 0;
  const errors = [];

  // Supprimer par batch de 50
  for (let i = 0; i < tickersToDelete.length; i += 50) {
    const batch = tickersToDelete.slice(i, i + 50);
    const batchNum = Math.floor(i / 50) + 1;
    const totalBatches = Math.ceil(tickersToDelete.length / 50);

    console.log(`   📦 Batch ${batchNum}/${totalBatches}: Suppression de ${batch.length} tickers...`);

    for (const ticker of batch) {
      const { error } = await supabase
        .from('tickers')
        .delete()
        .eq('ticker', ticker);

      if (error) {
        console.error(`      ❌ ${ticker}: ${error.message}`);
        errors.push({ ticker, error: error.message });
      } else {
        deleted++;
      }
    }
  }

  console.log(`\n✅ Suppression terminée:`);
  console.log(`   - Supprimés: ${deleted}/${tickersToDelete.length}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
  }

  return { deleted, errors };
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateFMPAvailabilityBatch()
    .then(async (results) => {
      if (results.unavailable.length > 0) {
        console.log(`\n⚠️  ${results.unavailable.length} tickers non disponibles dans FMP détectés.`);
        console.log(`   Tickers à supprimer: ${results.unavailable.map(t => t.ticker).join(', ')}\n`);
        
        // Supprimer les tickers non disponibles
        const deleteResult = await deleteUnavailableTickers(results.unavailable);
        
        // Vérifier le résultat final
        const { count } = await supabase
          .from('tickers')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        
        console.log(`\n📊 Total tickers actifs restants: ${count}`);
        console.log(`   (Devrait être: ${results.available.length})`);

        // Supprimer le fichier d'état après succès
        if (fs.existsSync(STATE_FILE)) {
          fs.unlinkSync(STATE_FILE);
          console.log(`\n✅ Fichier d'état supprimé`);
        }
      } else {
        console.log('\n✅ Tous les tickers sont disponibles dans FMP!');
        
        // Supprimer le fichier d'état
        if (fs.existsSync(STATE_FILE)) {
          fs.unlinkSync(STATE_FILE);
        }
      }
      
      console.log('\n✅ Validation terminée!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      console.log(`\n💾 État sauvegardé dans ${STATE_FILE}`);
      console.log(`   Vous pouvez relancer le script pour continuer`);
      process.exit(1);
    });
}

export { validateFMPAvailabilityBatch, deleteUnavailableTickers };
