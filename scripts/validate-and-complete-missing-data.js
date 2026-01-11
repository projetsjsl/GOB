/**
 * Script pour valider et compléter toutes les données manquantes dans Supabase
 * Récupère les données depuis FMP et met à jour Supabase
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
 * Récupère les données depuis FMP pour un ticker
 */
async function fetchFMPData(ticker) {
  try {
    // Récupérer le profil
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const profileResponse = await fetch(profileUrl);
    
    if (!profileResponse.ok) {
      return null;
    }

    const profileData = await profileResponse.json();
    if (!profileData || profileData.length === 0) {
      return null;
    }

    const profile = profileData[0];

    // Récupérer les key metrics pour le beta
    const metricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=1&apikey=${FMP_API_KEY}`;
    const metricsResponse = await fetch(metricsUrl);
    
    let beta = null;
    if (metricsResponse.ok) {
      const metricsData = await metricsResponse.json();
      if (metricsData && metricsData.length > 0 && metricsData[0].beta) {
        beta = parseFloat(metricsData[0].beta);
      }
    }

    return {
      sector: profile.sector || null,
      industry: profile.industry || null,
      beta: beta || (profile.beta ? parseFloat(profile.beta) : null),
      companyName: profile.companyName || null,
      exchange: profile.exchangeShortName || null,
      country: profile.country || null,
      currency: profile.currency || null
    };
  } catch (error) {
    console.error(`   ⚠️ Erreur FMP pour ${ticker}:`, error.message);
    return null;
  }
}

/**
 * Valide et complète les données manquantes
 */
async function validateAndCompleteData() {
  console.log('🔍 Validation et complétion des données manquantes...\n');

  // Charger le rapport d'analyse
  const reportPath = path.join(__dirname, '../docs/ANALYSE_DONNEES_MANQUANTES.json');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Rapport d\'analyse non trouvé. Exécutez d\'abord analyze-missing-data.js');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  const missingData = report.missing_data;

  const results = {
    sector: { updated: 0, failed: 0, errors: [] },
    beta: { updated: 0, failed: 0, errors: [] },
    validated: { total: 0, errors: [] }
  };

  // 1. Compléter les secteurs manquants
  if (missingData.sector && missingData.sector.length > 0) {
    console.log(`📊 Complétion des secteurs manquants (${missingData.sector.length} tickers)...\n`);
    
    for (const ticker of missingData.sector) {
      try {
        console.log(`   🔄 ${ticker}...`);
        const fmpData = await fetchFMPData(ticker);
        
        if (fmpData && fmpData.sector) {
          const { error } = await supabase
            .from('tickers')
            .update({ 
              sector: fmpData.sector,
              updated_at: new Date().toISOString()
            })
            .eq('ticker', ticker);

          if (error) {
            console.error(`      ❌ Erreur Supabase: ${error.message}`);
            results.sector.failed++;
            results.sector.errors.push({ ticker, error: error.message });
          } else {
            console.log(`      ✅ Secteur mis à jour: ${fmpData.sector}`);
            results.sector.updated++;
          }
        } else {
          console.log(`      ⚠️ Données FMP non disponibles`);
          results.sector.failed++;
        }

        // Pause pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`      ❌ Erreur: ${error.message}`);
        results.sector.failed++;
        results.sector.errors.push({ ticker, error: error.message });
      }
    }
  }

  // 2. Compléter les beta manquants
  if (missingData.beta && missingData.beta.length > 0) {
    console.log(`\n📊 Complétion des beta manquants (${missingData.beta.length} tickers)...\n`);
    
    // Traiter par batch de 10 pour éviter le rate limiting
    const batchSize = 10;
    for (let i = 0; i < missingData.beta.length; i += batchSize) {
      const batch = missingData.beta.slice(i, i + batchSize);
      console.log(`   📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingData.beta.length / batchSize)} (${batch.length} tickers)...`);

      for (const ticker of batch) {
        try {
          const fmpData = await fetchFMPData(ticker);
          
          if (fmpData && fmpData.beta !== null && fmpData.beta !== undefined) {
            const { error } = await supabase
              .from('tickers')
              .update({ 
                beta: fmpData.beta,
                updated_at: new Date().toISOString()
              })
              .eq('ticker', ticker);

            if (error) {
              console.error(`      ❌ ${ticker}: Erreur Supabase: ${error.message}`);
              results.beta.failed++;
              results.beta.errors.push({ ticker, error: error.message });
            } else {
              console.log(`      ✅ ${ticker}: Beta = ${fmpData.beta.toFixed(2)}`);
              results.beta.updated++;
            }
          } else {
              results.beta.failed++;
          }

          // Pause pour éviter le rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`      ❌ ${ticker}: Erreur: ${error.message}`);
          results.beta.failed++;
          results.beta.errors.push({ ticker, error: error.message });
        }
      }

      // Pause plus longue entre les batches
      if (i + batchSize < missingData.beta.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // 3. Valider les données existantes
  console.log(`\n✅ Validation des données existantes...\n`);
  
  // Récupérer tous les tickers actifs
  let allTickers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: tickers, error } = await supabase
      .from('tickers')
      .select('ticker, company_name, sector, country, exchange, beta')
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

  console.log(`   📊 ${allTickers.length} tickers à valider\n`);

  // Valider les données critiques
  const validationIssues = [];
  allTickers.forEach(ticker => {
    const issues = [];

    if (!ticker.company_name || ticker.company_name.trim() === '') {
      issues.push('company_name manquant');
    }
    if (!ticker.sector || ticker.sector.trim() === '') {
      issues.push('sector manquant');
    }
    if (!ticker.country || ticker.country.trim() === '') {
      issues.push('country manquant');
    }
    if (!ticker.exchange || ticker.exchange.trim() === '') {
      issues.push('exchange manquant');
    }

    if (issues.length > 0) {
      validationIssues.push({
        ticker: ticker.ticker,
        issues
      });
    }
  });

  results.validated.total = allTickers.length;
  results.validated.issues = validationIssues;

  if (validationIssues.length > 0) {
    console.log(`   ⚠️ ${validationIssues.length} tickers avec problèmes de validation:`);
    validationIssues.slice(0, 10).forEach(item => {
      console.log(`      - ${item.ticker}: ${item.issues.join(', ')}`);
    });
    if (validationIssues.length > 10) {
      console.log(`      ... et ${validationIssues.length - 10} autres`);
    }
  } else {
    console.log(`   ✅ Tous les tickers ont les données critiques complètes`);
  }

  // Générer le rapport final
  const finalReport = {
    executed_at: new Date().toISOString(),
    results,
    summary: {
      sector_updated: results.sector.updated,
      sector_failed: results.sector.failed,
      beta_updated: results.beta.updated,
      beta_failed: results.beta.failed,
      validated_total: results.validated.total,
      validation_issues: validationIssues.length
    }
  };

  const finalReportPath = path.join(__dirname, '../docs/VALIDATION_ET_COMPLETION_DONNEES.json');
  fs.writeFileSync(finalReportPath, JSON.stringify(finalReport, null, 2));
  console.log(`\n✅ Rapport final sauvegardé: ${finalReportPath}`);

  // Générer le rapport Markdown
  const mdPath = path.join(__dirname, '../docs/VALIDATION_ET_COMPLETION_DONNEES.md');
  let mdContent = `# ✅ Validation et Complétion des Données\n\n`;
  mdContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  mdContent += `## 📊 Résumé\n\n`;
  mdContent += `### Secteurs\n`;
  mdContent += `- **Mis à jour:** ${results.sector.updated}\n`;
  mdContent += `- **Échecs:** ${results.sector.failed}\n\n`;
  mdContent += `### Beta\n`;
  mdContent += `- **Mis à jour:** ${results.beta.updated}\n`;
  mdContent += `- **Échecs:** ${results.beta.failed}\n\n`;
  mdContent += `### Validation\n`;
  mdContent += `- **Total tickers validés:** ${results.validated.total}\n`;
  mdContent += `- **Problèmes détectés:** ${validationIssues.length}\n\n`;

  if (results.sector.errors.length > 0) {
    mdContent += `## ❌ Erreurs Secteurs\n\n`;
    results.sector.errors.forEach(e => {
      mdContent += `- ${e.ticker}: ${e.error}\n`;
    });
    mdContent += `\n`;
  }

  if (results.beta.errors.length > 0) {
    mdContent += `## ❌ Erreurs Beta\n\n`;
    results.beta.errors.slice(0, 50).forEach(e => {
      mdContent += `- ${e.ticker}: ${e.error}\n`;
    });
    if (results.beta.errors.length > 50) {
      mdContent += `\n*... et ${results.beta.errors.length - 50} autres erreurs*\n`;
    }
    mdContent += `\n`;
  }

  if (validationIssues.length > 0) {
    mdContent += `## ⚠️ Problèmes de Validation\n\n`;
    mdContent += `| Ticker | Problèmes |\n`;
    mdContent += `|--------|-----------|\n`;
    validationIssues.forEach(item => {
      mdContent += `| ${item.ticker} | ${item.issues.join(', ')} |\n`;
    });
  }

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown sauvegardé: ${mdPath}`);

  console.log(`\n📋 Résumé final:`);
  console.log(`   ✅ Secteurs mis à jour: ${results.sector.updated}`);
  console.log(`   ✅ Beta mis à jour: ${results.beta.updated}`);
  console.log(`   ✅ Tickers validés: ${results.validated.total}`);
  console.log(`   ⚠️ Problèmes détectés: ${validationIssues.length}`);

  return finalReport;
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAndCompleteData()
    .then(() => {
      console.log('\n✅ Validation et complétion terminées!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { validateAndCompleteData };
