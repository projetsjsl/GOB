/**
 * Script pour analyser les données manquantes dans Supabase pour les tickers actifs
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
 * Analyse les données manquantes
 */
async function analyzeMissingData() {
  console.log('🔍 Analyse des données manquantes dans Supabase...\n');

  // Récupérer tous les tickers actifs
  let allTickers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: tickers, error } = await supabase
      .from('tickers')
      .select('ticker, company_name, country, exchange, sector, source, security_rank, earnings_predictability, price_growth_persistence, price_stability, beta, valueline_updated_at')
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

  console.log(`📊 Total tickers actifs analysés: ${allTickers.length}\n`);

  // Analyser les données manquantes
  const missingData = {
    sector: [],
    security_rank: [],
    earnings_predictability: [],
    price_growth_persistence: [],
    price_stability: [],
    beta: [],
    valueline_metrics: [], // Tous les métriques ValueLine manquantes
    all_valueLine: [] // Tickers avec toutes les métriques ValueLine
  };

  allTickers.forEach(ticker => {
    const issues = [];

    // Secteur
    if (!ticker.sector || ticker.sector.trim() === '') {
      missingData.sector.push(ticker.ticker);
      issues.push('sector');
    }

    // Métriques ValueLine
    const hasSecurityRank = ticker.security_rank && ticker.security_rank.trim() !== '';
    const hasEarningsPredictability = ticker.earnings_predictability && ticker.earnings_predictability.trim() !== '';
    const hasPriceGrowthPersistence = ticker.price_growth_persistence && ticker.price_growth_persistence.trim() !== '';
    const hasPriceStability = ticker.price_stability && ticker.price_stability.trim() !== '';

    if (!hasSecurityRank) {
      missingData.security_rank.push(ticker.ticker);
      issues.push('security_rank');
    }
    if (!hasEarningsPredictability) {
      missingData.earnings_predictability.push(ticker.ticker);
      issues.push('earnings_predictability');
    }
    if (!hasPriceGrowthPersistence) {
      missingData.price_growth_persistence.push(ticker.ticker);
      issues.push('price_growth_persistence');
    }
    if (!hasPriceStability) {
      missingData.price_stability.push(ticker.ticker);
      issues.push('price_stability');
    }

    // Beta
    if (ticker.beta === null || ticker.beta === undefined) {
      missingData.beta.push(ticker.ticker);
      issues.push('beta');
    }

    // Tickers avec au moins une métrique ValueLine manquante
    if (!hasSecurityRank || !hasEarningsPredictability || !hasPriceGrowthPersistence || !hasPriceStability) {
      missingData.valueline_metrics.push({
        ticker: ticker.ticker,
        company_name: ticker.company_name,
        source: ticker.source,
        missing: {
          security_rank: !hasSecurityRank,
          earnings_predictability: !hasEarningsPredictability,
          price_growth_persistence: !hasPriceGrowthPersistence,
          price_stability: !hasPriceStability
        }
      });
    }

    // Tickers avec toutes les métriques ValueLine
    if (hasSecurityRank && hasEarningsPredictability && hasPriceGrowthPersistence && hasPriceStability) {
      missingData.all_valueLine.push({
        ticker: ticker.ticker,
        company_name: ticker.company_name,
        source: ticker.source,
        security_rank: ticker.security_rank,
        earnings_predictability: ticker.earnings_predictability,
        price_growth_persistence: ticker.price_growth_persistence,
        price_stability: ticker.price_stability
      });
    }
  });

  // Statistiques
  const stats = {
    total: allTickers.length,
    missing_sector: missingData.sector.length,
    missing_security_rank: missingData.security_rank.length,
    missing_earnings_predictability: missingData.earnings_predictability.length,
    missing_price_growth_persistence: missingData.price_growth_persistence.length,
    missing_price_stability: missingData.price_stability.length,
    missing_beta: missingData.beta.length,
    missing_any_valueLine: missingData.valueline_metrics.length,
    has_all_valueLine: missingData.all_valueLine.length,
    percentage_missing_valueLine: ((missingData.valueline_metrics.length / allTickers.length) * 100).toFixed(1),
    percentage_has_valueLine: ((missingData.all_valueLine.length / allTickers.length) * 100).toFixed(1)
  };

  console.log('📊 Statistiques des données manquantes:\n');
  console.log(`   Total tickers: ${stats.total}`);
  console.log(`   Sans secteur: ${stats.missing_sector} (${((stats.missing_sector / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sans security_rank: ${stats.missing_security_rank} (${((stats.missing_security_rank / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sans earnings_predictability: ${stats.missing_earnings_predictability} (${((stats.missing_earnings_predictability / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sans price_growth_persistence: ${stats.missing_price_growth_persistence} (${((stats.missing_price_growth_persistence / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sans price_stability: ${stats.missing_price_stability} (${((stats.missing_price_stability / stats.total) * 100).toFixed(1)}%)`);
  console.log(`   Sans beta: ${stats.missing_beta} (${((stats.missing_beta / stats.total) * 100).toFixed(1)}%)`);
  console.log(`\n   ⚠️  Tickers avec au moins une métrique ValueLine manquante: ${stats.missing_any_valueLine} (${stats.percentage_missing_valueLine}%)`);
  console.log(`   ✅ Tickers avec toutes les métriques ValueLine: ${stats.has_all_valueLine} (${stats.percentage_has_valueLine}%)`);

  // Analyser par source
  const bySource = {};
  missingData.valueline_metrics.forEach(item => {
    const source = item.source || 'manual';
    if (!bySource[source]) {
      bySource[source] = { total: 0, missing: 0 };
    }
    bySource[source].missing++;
  });

  allTickers.forEach(t => {
    const source = t.source || 'manual';
    if (!bySource[source]) {
      bySource[source] = { total: 0, missing: 0 };
    }
    bySource[source].total++;
  });

  console.log(`\n📊 Répartition par source (métriques ValueLine manquantes):`);
  Object.keys(bySource).sort().forEach(source => {
    const data = bySource[source];
    const missing = data.missing || 0;
    const total = data.total || 0;
    const percentage = total > 0 ? ((missing / total) * 100).toFixed(1) : '0.0';
    console.log(`   ${source}: ${missing}/${total} (${percentage}%)`);
  });

  // Générer le rapport JSON
  const report = {
    generated_at: new Date().toISOString(),
    stats,
    missing_data: {
      sector: missingData.sector,
      security_rank: missingData.security_rank,
      earnings_predictability: missingData.earnings_predictability,
      price_growth_persistence: missingData.price_growth_persistence,
      price_stability: missingData.price_stability,
      beta: missingData.beta
    },
    valueline_metrics_missing: missingData.valueline_metrics.slice(0, 100), // Limiter à 100 pour le JSON
    valueline_metrics_complete: missingData.all_valueLine.slice(0, 50), // Limiter à 50
    by_source: bySource
  };

  const reportPath = path.join(__dirname, '../docs/ANALYSE_DONNEES_MANQUANTES.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport JSON sauvegardé: ${reportPath}`);

  // Générer le rapport Markdown
  const mdPath = path.join(__dirname, '../docs/ANALYSE_DONNEES_MANQUANTES.md');
  let mdContent = `# 📊 Analyse des Données Manquantes dans Supabase\n\n`;
  mdContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  mdContent += `## 📊 Résumé\n\n`;
  mdContent += `- **Total tickers actifs:** ${stats.total}\n`;
  mdContent += `- **Sans secteur:** ${stats.missing_sector} (${((stats.missing_sector / stats.total) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Sans security_rank:** ${stats.missing_security_rank} (${((stats.missing_security_rank / stats.total) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Sans earnings_predictability:** ${stats.missing_earnings_predictability} (${((stats.missing_earnings_predictability / stats.total) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Sans price_growth_persistence:** ${stats.missing_price_growth_persistence} (${((stats.missing_price_growth_persistence / stats.total) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Sans price_stability:** ${stats.missing_price_stability} (${((stats.missing_price_stability / stats.total) * 100).toFixed(1)}%)\n`;
  mdContent += `- **Sans beta:** ${stats.missing_beta} (${((stats.missing_beta / stats.total) * 100).toFixed(1)}%)\n\n`;
  mdContent += `### ⚠️ Métriques ValueLine\n\n`;
  mdContent += `- **Tickers avec au moins une métrique ValueLine manquante:** ${stats.missing_any_valueLine} (${stats.percentage_missing_valueLine}%)\n`;
  mdContent += `- **Tickers avec toutes les métriques ValueLine:** ${stats.has_all_valueLine} (${stats.percentage_has_valueLine}%)\n\n`;

  mdContent += `## 📊 Répartition par Source\n\n`;
  mdContent += `| Source | Tickers avec métriques ValueLine manquantes | Total | Pourcentage |\n`;
  mdContent += `|--------|----------------------------------------------|-------|-------------|\n`;
  Object.keys(bySource).sort().forEach(source => {
    const data = bySource[source];
    const missing = data.missing || 0;
    const total = data.total || 0;
    const percentage = total > 0 ? ((missing / total) * 100).toFixed(1) : '0.0';
    mdContent += `| ${source} | ${missing} | ${total} | ${percentage}% |\n`;
  });
  mdContent += `\n`;

  if (missingData.sector.length > 0) {
    mdContent += `## 🗑️ Tickers Sans Secteur (${missingData.sector.length})\n\n`;
    mdContent += `\`\`\`\n`;
    missingData.sector.forEach(t => mdContent += `${t}\n`);
    mdContent += `\`\`\`\n\n`;
  }

  if (missingData.valueline_metrics.length > 0) {
    mdContent += `## ⚠️ Tickers avec Métriques ValueLine Manquantes (${missingData.valueline_metrics.length})\n\n`;
    mdContent += `*Affichage des 50 premiers*\n\n`;
    mdContent += `| Ticker | Company Name | Source | Security Rank | Earnings Predictability | Price Growth | Price Stability |\n`;
    mdContent += `|--------|---------------|--------|---------------|------------------------|--------------|-----------------|\n`;
    missingData.valueline_metrics.slice(0, 50).forEach(item => {
      mdContent += `| ${item.ticker} | ${item.company_name || 'N/A'} | ${item.source || 'N/A'} | `;
      mdContent += `${item.missing.security_rank ? '❌' : '✅'} | `;
      mdContent += `${item.missing.earnings_predictability ? '❌' : '✅'} | `;
      mdContent += `${item.missing.price_growth_persistence ? '❌' : '✅'} | `;
      mdContent += `${item.missing.price_stability ? '❌' : '✅'} |\n`;
    });
    if (missingData.valueline_metrics.length > 50) {
      mdContent += `\n*... et ${missingData.valueline_metrics.length - 50} autres*\n`;
    }
    mdContent += `\n`;
  }

  if (missingData.beta.length > 0) {
    mdContent += `## ⚠️ Tickers Sans Beta (${missingData.beta.length})\n\n`;
    mdContent += `*Affichage des 50 premiers*\n\n`;
    mdContent += `\`\`\`\n`;
    missingData.beta.slice(0, 50).forEach(t => mdContent += `${t}\n`);
    if (missingData.beta.length > 50) {
      mdContent += `... et ${missingData.beta.length - 50} autres\n`;
    }
    mdContent += `\`\`\`\n\n`;
  }

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown sauvegardé: ${mdPath}`);

  return report;
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeMissingData()
    .then(() => {
      console.log('\n✅ Analyse terminée!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { analyzeMissingData };
