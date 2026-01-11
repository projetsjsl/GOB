/**
 * Script de validation et nettoyage des tickers dans Supabase
 * 
 * Objectifs:
 * 1. Identifier les tickers inactifs qui devraient être supprimés
 * 2. Identifier les doublons (même symbole avec différentes variations)
 * 3. Identifier les tickers sans données utiles
 * 4. Générer un rapport et des scripts SQL pour nettoyage
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Normalise un symbole ticker pour comparaison (enlève les suffixes, majuscules)
 */
function normalizeTicker(ticker) {
  if (!ticker) return '';
  return ticker.toUpperCase().replace(/[.\-]/g, '');
}

/**
 * Vérifie si un ticker est un doublon potentiel
 */
function isDuplicateTicker(ticker, allTickers) {
  const normalized = normalizeTicker(ticker);
  const duplicates = allTickers.filter(t => 
    t.ticker !== ticker && normalizeTicker(t.ticker) === normalized
  );
  return duplicates.length > 0 ? duplicates : null;
}

/**
 * Identifie les tickers inutiles
 */
async function identifyUselessTickers() {
  console.log('🔍 Analyse des tickers dans Supabase...\n');

  // Récupérer tous les tickers (actifs et inactifs)
  let allTickers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: tickers, error } = await supabase
      .from('tickers')
      .select('ticker, company_name, country, exchange, sector, source, is_active, created_at, updated_at')
      .order('ticker')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('❌ Erreur lors de la récupération des tickers:', error);
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

  console.log(`📊 Total tickers trouvés: ${allTickers.length}`);
  console.log(`   - Actifs: ${allTickers.filter(t => t.is_active).length}`);
  console.log(`   - Inactifs: ${allTickers.filter(t => !t.is_active).length}\n`);

  // 1. Tickers inactifs (à supprimer complètement)
  const inactiveTickers = allTickers.filter(t => !t.is_active);
  console.log(`🗑️  Tickers inactifs à supprimer: ${inactiveTickers.length}`);

  // 2. Doublons (même symbole normalisé)
  const duplicates = new Map();
  const duplicateGroups = [];

  allTickers.forEach(ticker => {
    const normalized = normalizeTicker(ticker.ticker);
    if (!duplicates.has(normalized)) {
      duplicates.set(normalized, []);
    }
    duplicates.get(normalized).push(ticker);
  });

  duplicates.forEach((group, normalized) => {
    if (group.length > 1) {
      // Garder le plus récent ou celui qui est actif
      const active = group.filter(t => t.is_active);
      const inactive = group.filter(t => !t.is_active);
      
      if (active.length > 1) {
        // Plusieurs actifs avec le même symbole normalisé
        duplicateGroups.push({
          normalized,
          tickers: group,
          toKeep: active.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0],
          toDelete: [...active.slice(1), ...inactive]
        });
      } else if (active.length === 1 && inactive.length > 0) {
        // Un actif, supprimer les inactifs
        duplicateGroups.push({
          normalized,
          tickers: group,
          toKeep: active[0],
          toDelete: inactive
        });
      } else if (active.length === 0 && inactive.length > 1) {
        // Tous inactifs, garder le plus récent
        const sorted = inactive.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
        duplicateGroups.push({
          normalized,
          tickers: group,
          toKeep: sorted[0],
          toDelete: sorted.slice(1)
        });
      }
    }
  });

  console.log(`🔄 Groupes de doublons trouvés: ${duplicateGroups.length}`);

  // 3. Tickers sans nom de compagnie
  const noCompanyName = allTickers.filter(t => !t.company_name || t.company_name.trim() === '');
  console.log(`⚠️  Tickers sans nom de compagnie: ${noCompanyName.length}`);

  // 4. Tickers avec source invalide
  const validSources = ['team', 'watchlist', 'both', 'manual', 'SP500', 'NASDAQ100', 'TSX', 'DOWJONES'];
  const invalidSource = allTickers.filter(t => 
    t.source && !validSources.some(vs => t.source.includes(vs))
  );
  console.log(`⚠️  Tickers avec source invalide: ${invalidSource.length}`);

  // Compiler les tickers à supprimer
  const toDelete = new Set();
  
  // Ajouter tous les inactifs
  inactiveTickers.forEach(t => toDelete.add(t.ticker));
  
  // Ajouter les doublons à supprimer
  duplicateGroups.forEach(group => {
    group.toDelete.forEach(t => toDelete.add(t.ticker));
  });

  // Ajouter les tickers sans nom (sauf s'ils sont team/watchlist)
  noCompanyName.forEach(t => {
    if (t.source !== 'team' && t.source !== 'watchlist' && t.source !== 'both') {
      toDelete.add(t.ticker);
    }
  });

  const toDeleteArray = Array.from(toDelete);

  // Générer les rapports
  const report = {
    summary: {
      totalTickers: allTickers.length,
      activeTickers: allTickers.filter(t => t.is_active).length,
      inactiveTickers: inactiveTickers.length,
      duplicatesFound: duplicateGroups.length,
      noCompanyName: noCompanyName.length,
      invalidSource: invalidSource.length,
      toDelete: toDeleteArray.length
    },
    inactive: inactiveTickers.map(t => ({
      ticker: t.ticker,
      company_name: t.company_name,
      country: t.country,
      exchange: t.exchange,
      source: t.source
    })),
    duplicates: duplicateGroups.map(group => ({
      normalized: group.normalized,
      toKeep: {
        ticker: group.toKeep.ticker,
        company_name: group.toKeep.company_name,
        is_active: group.toKeep.is_active
      },
      toDelete: group.toDelete.map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        is_active: t.is_active
      }))
    })),
    noCompanyName: noCompanyName.map(t => ({
      ticker: t.ticker,
      source: t.source,
      is_active: t.is_active
    })),
    invalidSource: invalidSource.map(t => ({
      ticker: t.ticker,
      company_name: t.company_name,
      source: t.source,
      is_active: t.is_active
    })),
    toDelete: toDeleteArray
  };

  // Sauvegarder le rapport JSON
  const reportPath = path.join(__dirname, '../docs/RAPPORT_NETTOYAGE_TICKERS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport sauvegardé: ${reportPath}`);

  // Générer le script SQL de suppression
  const sqlPath = path.join(__dirname, '../docs/SUPPRESSION_TICKERS_INUTILES.sql');
  let sqlContent = `-- Script de suppression des tickers inutiles\n`;
  sqlContent += `-- Généré le: ${new Date().toISOString()}\n\n`;
  sqlContent += `-- Suppression de ${toDeleteArray.length} tickers inutiles\n\n`;

  // Supprimer par batch de 100 pour éviter les limites SQL
  for (let i = 0; i < toDeleteArray.length; i += 100) {
    const batch = toDeleteArray.slice(i, i + 100);
    const tickersList = batch.map(t => `'${t.replace(/'/g, "''")}'`).join(', ');
    sqlContent += `-- Batch ${Math.floor(i / 100) + 1}\n`;
    sqlContent += `DELETE FROM tickers WHERE ticker IN (${tickersList});\n\n`;
  }

  fs.writeFileSync(sqlPath, sqlContent);
  console.log(`✅ Script SQL généré: ${sqlPath}`);

  // Générer un rapport Markdown
  const mdPath = path.join(__dirname, '../docs/RAPPORT_NETTOYAGE_TICKERS.md');
  let mdContent = `# 🧹 Rapport de Nettoyage des Tickers\n\n`;
  mdContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  mdContent += `## 📊 Résumé\n\n`;
  mdContent += `- **Total tickers:** ${report.summary.totalTickers}\n`;
  mdContent += `- **Tickers actifs:** ${report.summary.activeTickers}\n`;
  mdContent += `- **Tickers inactifs:** ${report.summary.inactiveTickers}\n`;
  mdContent += `- **Groupes de doublons:** ${report.summary.duplicatesFound}\n`;
  mdContent += `- **Sans nom de compagnie:** ${report.summary.noCompanyName}\n`;
  mdContent += `- **Source invalide:** ${report.summary.invalidSource}\n`;
  mdContent += `- **Total à supprimer:** ${report.summary.toDelete}\n\n`;

  if (report.inactive.length > 0) {
    mdContent += `## 🗑️ Tickers Inactifs (${report.inactive.length})\n\n`;
    mdContent += `Ces tickers sont inactifs et seront supprimés:\n\n`;
    mdContent += `| Ticker | Company Name | Country | Exchange | Source |\n`;
    mdContent += `|--------|--------------|--------|----------|--------|\n`;
    report.inactive.slice(0, 50).forEach(t => {
      mdContent += `| ${t.ticker} | ${t.company_name || 'N/A'} | ${t.country || 'N/A'} | ${t.exchange || 'N/A'} | ${t.source || 'N/A'} |\n`;
    });
    if (report.inactive.length > 50) {
      mdContent += `\n*... et ${report.inactive.length - 50} autres*\n`;
    }
    mdContent += `\n`;
  }

  if (report.duplicates.length > 0) {
    mdContent += `## 🔄 Doublons (${report.duplicates.length})\n\n`;
    report.duplicates.slice(0, 20).forEach(group => {
      mdContent += `### ${group.normalized}\n\n`;
      mdContent += `**À garder:** ${group.toKeep.ticker} (${group.toKeep.company_name || 'N/A'}) - Actif: ${group.toKeep.is_active}\n\n`;
      mdContent += `**À supprimer:**\n`;
      group.toDelete.forEach(t => {
        mdContent += `- ${t.ticker} (${t.company_name || 'N/A'}) - Actif: ${t.is_active}\n`;
      });
      mdContent += `\n`;
    });
    if (report.duplicates.length > 20) {
      mdContent += `\n*... et ${report.duplicates.length - 20} autres groupes de doublons*\n`;
    }
  }

  if (report.toDelete.length > 0) {
    mdContent += `## 🗑️ Liste Complète des Tickers à Supprimer (${report.toDelete.length})\n\n`;
    mdContent += `\`\`\`\n`;
    report.toDelete.forEach(ticker => {
      mdContent += `${ticker}\n`;
    });
    mdContent += `\`\`\`\n`;
  }

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown généré: ${mdPath}`);

  console.log(`\n📋 Résumé:`);
  console.log(`   - Tickers inactifs: ${inactiveTickers.length}`);
  console.log(`   - Doublons à supprimer: ${duplicateGroups.reduce((sum, g) => sum + g.toDelete.length, 0)}`);
  console.log(`   - Total à supprimer: ${toDeleteArray.length}`);

  return {
    report,
    toDelete: toDeleteArray
  };
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  identifyUselessTickers()
    .then(() => {
      console.log('\n✅ Analyse terminée!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { identifyUselessTickers };
