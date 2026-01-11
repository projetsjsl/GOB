/**
 * Script pour valider que tous les tickers actifs sont disponibles dans FMP
 * Supprime les tickers qui ne peuvent pas être récupérés depuis FMP
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

/**
 * Vérifie si un ticker est disponible dans FMP
 */
async function checkFMPAvailability(ticker) {
  try {
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const response = await fetch(profileUrl);
    
    if (!response.ok) {
      return { available: false, reason: `HTTP ${response.status}` };
    }

    const data = await response.json();
    
    if (!data || data.length === 0 || !data[0] || !data[0].symbol) {
      return { available: false, reason: 'Aucune donnée retournée' };
    }

    // Vérifier que c'est bien le bon ticker
    if (data[0].symbol.toUpperCase() !== ticker.toUpperCase()) {
      return { available: false, reason: `Symbole différent: ${data[0].symbol}` };
    }

    return { 
      available: true, 
      companyName: data[0].companyName,
      exchange: data[0].exchangeShortName,
      sector: data[0].sector
    };
  } catch (error) {
    return { available: false, reason: error.message };
  }
}

/**
 * Valide tous les tickers actifs avec FMP
 */
async function validateFMPAvailability() {
  console.log('🔍 Validation de la disponibilité FMP pour tous les tickers actifs...\n');

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

  console.log(`📊 ${allTickers.length} tickers actifs à valider\n`);

  const results = {
    available: [],
    unavailable: [],
    errors: []
  };

  // Valider chaque ticker
  for (let i = 0; i < allTickers.length; i++) {
    const ticker = allTickers[i];
    const progress = `[${i + 1}/${allTickers.length}]`;
    
    process.stdout.write(`   ${progress} ${ticker.ticker}... `);
    
    const check = await checkFMPAvailability(ticker.ticker);
    
    if (check.available) {
      console.log('✅');
      results.available.push({
        ticker: ticker.ticker,
        company_name: ticker.company_name,
        source: ticker.source,
        fmp_company: check.companyName,
        fmp_exchange: check.exchange,
        fmp_sector: check.sector
      });
    } else {
      console.log(`❌ (${check.reason})`);
      results.unavailable.push({
        ticker: ticker.ticker,
        company_name: ticker.company_name,
        source: ticker.source,
        reason: check.reason
      });
    }

    // Pause pour éviter le rate limiting (300ms entre chaque requête)
    if (i < allTickers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log(`\n📊 Résultats:`);
  console.log(`   ✅ Disponibles dans FMP: ${results.available.length}`);
  console.log(`   ❌ Non disponibles dans FMP: ${results.unavailable.length}`);

  // Sauvegarder le rapport
  const report = {
    generated_at: new Date().toISOString(),
    total_tickers: allTickers.length,
    available: results.available.length,
    unavailable: results.unavailable.length,
    unavailable_tickers: results.unavailable
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
  mdContent += `- **Disponibles dans FMP:** ${results.available.length} (${((results.available.length / allTickers.length) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Non disponibles dans FMP:** ${results.unavailable.length} (${((results.unavailable.length / allTickers.length) * 100).toFixed(1)}%)\n\n`;

  if (results.unavailable.length > 0) {
    mdContent += `## ❌ Tickers Non Disponibles dans FMP (${results.unavailable.length})\n\n`;
    mdContent += `Ces tickers seront supprimés car ils ne peuvent pas être récupérés depuis FMP:\n\n`;
    mdContent += `| Ticker | Company Name | Source | Raison |\n`;
    mdContent += `|--------|--------------|--------|--------|\n`;
    results.unavailable.forEach(item => {
      mdContent += `| ${item.ticker} | ${item.company_name || 'N/A'} | ${item.source || 'N/A'} | ${item.reason} |\n`;
    });
    mdContent += `\n`;
  }

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown sauvegardé: ${mdPath}`);

  return results;
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
  validateFMPAvailability()
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
      } else {
        console.log('\n✅ Tous les tickers sont disponibles dans FMP!');
      }
      
      console.log('\n✅ Validation terminée!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { validateFMPAvailability, deleteUnavailableTickers };
