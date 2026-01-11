/**
 * Script pour valider que tous les tickers actifs répondent via l'API FMP
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env manuellement
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

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXV4Z2RwbGJwa2tucGx4YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU5MTQsImV4cCI6MjA3NTkxMTkxNH0.-M-QdpBFlDtg1CeA00VepQCNzGzvU-tISyVA0yCLBdw';

// Configuration FMP
const FMP_API_KEY = process.env.FMP_API_KEY || process.env.VITE_FMP_API_KEY;
if (!FMP_API_KEY) {
  console.error('❌ FMP_API_KEY non définie. Définissez-la dans les variables d\'environnement ou dans .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Limite de taux FMP (éviter de dépasser les limites)
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES = 1000; // 1 seconde entre les batches

/**
 * Teste un ticker via l'API FMP
 */
async function testTickerFMP(ticker) {
  const startTime = Date.now();
  
  try {
    // Test 1: Profile de l'entreprise
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const profileResponse = await fetch(profileUrl, {
      timeout: 10000 // 10 secondes timeout
    });
    
    if (!profileResponse.ok) {
      return {
        ticker,
        success: false,
        error: `HTTP ${profileResponse.status}: ${profileResponse.statusText}`,
        timeMs: Date.now() - startTime
      };
    }
    
    const profileData = await profileResponse.json();
    
    if (!Array.isArray(profileData) || profileData.length === 0) {
      return {
        ticker,
        success: false,
        error: 'Aucune donnée retournée (tableau vide)',
        timeMs: Date.now() - startTime
      };
    }
    
    const company = profileData[0];
    
    // Test 2: Données financières (optionnel, pour vérifier que les données sont complètes)
    const keyMetricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${ticker}?period=annual&limit=1&apikey=${FMP_API_KEY}`;
    let hasFinancialData = false;
    try {
      const metricsResponse = await fetch(keyMetricsUrl, { timeout: 10000 });
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        hasFinancialData = Array.isArray(metricsData) && metricsData.length > 0;
      }
    } catch (e) {
      // Ignorer les erreurs de key-metrics, ce n'est pas critique
    }
    
    return {
      ticker,
      success: true,
      companyName: company.companyName || company.name || 'N/A',
      exchange: company.exchangeShortName || company.exchange || 'N/A',
      currency: company.currency || 'N/A',
      marketCap: company.mktCap || 0,
      hasFinancialData,
      timeMs: Date.now() - startTime
    };
    
  } catch (error) {
    return {
      ticker,
      success: false,
      error: error.message || 'Erreur inconnue',
      timeMs: Date.now() - startTime
    };
  }
}

/**
 * Valide tous les tickers actifs
 */
async function validateAllTickers() {
  console.log('🔍 Validation de tous les tickers actifs via FMP API...\n');
  
  try {
    // Charger tous les tickers actifs
    let allTickers = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    console.log('📥 Chargement des tickers depuis Supabase...');
    
    while (hasMore) {
      const { data: tickers, error } = await supabase
        .from('tickers')
        .select('ticker, company_name, country, exchange, sector')
        .eq('is_active', true)
        .order('ticker')
        .range(from, from + pageSize - 1);
      
      if (error) {
        throw error;
      }
      
      if (tickers && tickers.length > 0) {
        allTickers.push(...tickers);
        console.log(`  ✅ Chargé ${allTickers.length} tickers...`);
        from += pageSize;
        hasMore = tickers.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`\n📊 Total tickers actifs à valider: ${allTickers.length}\n`);
    console.log('🧪 Test de chaque ticker via FMP API...\n');
    console.log(`⚠️  Limite de taux: ${BATCH_SIZE} tickers par batch, ${DELAY_BETWEEN_BATCHES}ms entre batches\n`);
    
    const results = [];
    const successful = [];
    const failed = [];
    
    // Traiter par batches pour éviter de dépasser les limites de taux
    for (let i = 0; i < allTickers.length; i += BATCH_SIZE) {
      const batch = allTickers.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allTickers.length / BATCH_SIZE);
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} tickers)...`);
      
      // Tester tous les tickers du batch en parallèle
      const batchPromises = batch.map(t => testTickerFMP(t.ticker));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, idx) => {
        const tickerInfo = batch[idx];
        const fullResult = {
          ...result,
          supabaseCompanyName: tickerInfo.company_name,
          supabaseCountry: tickerInfo.country,
          supabaseExchange: tickerInfo.exchange,
          supabaseSector: tickerInfo.sector
        };
        
        results.push(fullResult);
        
        if (result.success) {
          successful.push(fullResult);
          console.log(`  ✅ ${result.ticker.padEnd(12)} - ${result.companyName || 'N/A'} (${result.timeMs}ms)`);
        } else {
          failed.push(fullResult);
          console.log(`  ❌ ${result.ticker.padEnd(12)} - ${result.error} (${result.timeMs}ms)`);
        }
      });
      
      // Délai entre batches (sauf pour le dernier)
      if (i + BATCH_SIZE < allTickers.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    // Statistiques
    const totalTime = results.reduce((sum, r) => sum + r.timeMs, 0);
    const avgTime = totalTime / results.length;
    const successRate = (successful.length / results.length) * 100;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RÉSULTATS DE VALIDATION');
    console.log('='.repeat(80));
    console.log(`\n✅ Réussis: ${successful.length} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Échoués: ${failed.length} (${(100 - successRate).toFixed(1)}%)`);
    console.log(`⏱️  Temps moyen: ${avgTime.toFixed(0)}ms`);
    console.log(`⏱️  Temps total: ${(totalTime / 1000).toFixed(1)}s\n`);
    
    // Détails des échecs
    if (failed.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ TICKERS EN ÉCHEC');
      console.log('='.repeat(80));
      failed.forEach(f => {
        console.log(`\n${f.ticker}:`);
        console.log(`  Erreur: ${f.error}`);
        console.log(`  Temps: ${f.timeMs}ms`);
        console.log(`  Supabase: ${f.supabaseCompanyName || 'N/A'} (${f.supabaseCountry || 'N/A'}, ${f.supabaseExchange || 'N/A'})`);
      });
    }
    
    // Export JSON
    const exportData = {
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: successRate.toFixed(1) + '%',
        avgTimeMs: avgTime.toFixed(0),
        totalTimeMs: totalTime,
        generatedAt: new Date().toISOString()
      },
      successful: successful.map(r => ({
        ticker: r.ticker,
        companyName: r.companyName,
        exchange: r.exchange,
        currency: r.currency,
        marketCap: r.marketCap,
        hasFinancialData: r.hasFinancialData,
        timeMs: r.timeMs,
        supabaseCompanyName: r.supabaseCompanyName,
        supabaseCountry: r.supabaseCountry,
        supabaseExchange: r.supabaseExchange
      })),
      failed: failed.map(r => ({
        ticker: r.ticker,
        error: r.error,
        timeMs: r.timeMs,
        supabaseCompanyName: r.supabaseCompanyName,
        supabaseCountry: r.supabaseCountry,
        supabaseExchange: r.supabaseExchange,
        supabaseSector: r.supabaseSector
      })),
      allResults: results
    };
    
    const outputPath = path.join(__dirname, '../docs/VALIDATION_FMP_TICKERS.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Données exportées dans: ${outputPath}`);
    
    // Export CSV des échecs
    if (failed.length > 0) {
      const csvPath = path.join(__dirname, '../docs/TICKERS_FMP_ECHEC.csv');
      const csvHeader = 'Ticker,Erreur,Temps (ms),Company Name (Supabase),Country,Exchange,Sector\n';
      const csvRows = failed.map(f => [
        f.ticker,
        `"${(f.error || '').replace(/"/g, '""')}"`,
        f.timeMs,
        `"${(f.supabaseCompanyName || '').replace(/"/g, '""')}"`,
        f.supabaseCountry || '',
        f.supabaseExchange || '',
        f.supabaseSector || ''
      ].join(',')).join('\n');
      fs.writeFileSync(csvPath, csvHeader + csvRows);
      console.log(`💾 CSV des échecs exporté dans: ${csvPath}`);
    }
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  validateAllTickers()
    .then((data) => {
      console.log(`\n✅ Validation terminée: ${data.summary.successful}/${data.summary.total} réussis`);
      process.exit(data.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { validateAllTickers, testTickerFMP };
