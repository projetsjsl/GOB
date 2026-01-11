/**
 * Script pour lister tous les tickers finissant par .* sauf .TO
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveXV4Z2RwbGJwa2tucGx4YnhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzU5MTQsImV4cCI6MjA3NTkxMTkxNH0.-M-QdpBFlDtg1CeA00VepQCNzGzvU-tISyVA0yCLBdw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listTickersWithSuffix() {
  console.log('🔍 Recherche des tickers finissant par .* (sauf .TO)...\n');
  
  try {
    // Charger tous les tickers avec suffixe (sauf .TO)
    let allTickers = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data: tickers, error } = await supabase
        .from('tickers')
        .select('ticker, company_name, country, exchange, sector, is_active, source')
        .like('ticker', '%.%')
        .not('ticker', 'like', '%.TO')
        .eq('is_active', true)
        .order('ticker')
        .range(from, from + pageSize - 1);
      
      if (error) {
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
    
    console.log(`📊 Total tickers trouvés: ${allTickers.length}\n`);
    
    // Grouper par suffixe
    const bySuffix = {};
    allTickers.forEach(t => {
      const match = t.ticker.match(/\.([^.]+)$/);
      const suffix = match ? match[1] : 'UNKNOWN';
      if (!bySuffix[suffix]) {
        bySuffix[suffix] = [];
      }
      bySuffix[suffix].push(t);
    });
    
    // Afficher les statistiques
    console.log('='.repeat(80));
    console.log('📊 STATISTIQUES PAR SUFFIXE');
    console.log('='.repeat(80));
    
    Object.entries(bySuffix)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([suffix, tickers]) => {
        const countries = [...new Set(tickers.map(t => t.country).filter(Boolean))];
        const exchanges = [...new Set(tickers.map(t => t.exchange).filter(Boolean))];
        console.log(`\n.${suffix}: ${tickers.length} tickers`);
        console.log(`  Pays: ${countries.slice(0, 5).join(', ')}${countries.length > 5 ? '...' : ''}`);
        console.log(`  Bourses: ${exchanges.slice(0, 5).join(', ')}${exchanges.length > 5 ? '...' : ''}`);
        console.log(`  Exemples: ${tickers.slice(0, 5).map(t => t.ticker).join(', ')}${tickers.length > 5 ? '...' : ''}`);
      });
    
    // Liste complète
    console.log('\n\n' + '='.repeat(80));
    console.log('📝 LISTE COMPLÈTE DES TICKERS');
    console.log('='.repeat(80));
    
    allTickers.forEach(t => {
      const suffix = t.ticker.match(/\.([^.]+)$/)?.[1] || 'UNKNOWN';
      console.log(`${t.ticker.padEnd(15)} | .${suffix.padEnd(8)} | ${(t.country || 'N/A').padEnd(15)} | ${(t.exchange || 'N/A').padEnd(15)} | ${t.company_name || 'N/A'}`);
    });
    
    // Export JSON
    const exportData = {
      summary: {
        total: allTickers.length,
        suffixes: Object.keys(bySuffix).length,
        generatedAt: new Date().toISOString()
      },
      bySuffix: Object.fromEntries(
        Object.entries(bySuffix).map(([suffix, tickers]) => [
          suffix,
          {
            count: tickers.length,
            countries: [...new Set(tickers.map(t => t.country).filter(Boolean))],
            exchanges: [...new Set(tickers.map(t => t.exchange).filter(Boolean))],
            tickers: tickers.map(t => ({
              ticker: t.ticker,
              company_name: t.company_name,
              country: t.country,
              exchange: t.exchange,
              sector: t.sector,
              source: t.source
            }))
          }
        ])
      ),
      allTickers: allTickers.map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        country: t.country,
        exchange: t.exchange,
        sector: t.sector,
        source: t.source,
        suffix: t.ticker.match(/\.([^.]+)$/)?.[1] || 'UNKNOWN'
      }))
    };
    
    const outputPath = path.join(__dirname, '../docs/TICKERS_WITH_SUFFIX.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n\n💾 Données exportées dans: ${outputPath}`);
    
    // Export CSV
    const csvPath = path.join(__dirname, '../docs/TICKERS_WITH_SUFFIX.csv');
    const csvHeader = 'Ticker,Suffix,Company Name,Country,Exchange,Sector,Source\n';
    const csvRows = allTickers.map(t => {
      const suffix = t.ticker.match(/\.([^.]+)$/)?.[1] || 'UNKNOWN';
      return [
        t.ticker,
        suffix,
        `"${(t.company_name || '').replace(/"/g, '""')}"`,
        t.country || '',
        t.exchange || '',
        t.sector || '',
        t.source || ''
      ].join(',');
    }).join('\n');
    fs.writeFileSync(csvPath, csvHeader + csvRows);
    console.log(`💾 CSV exporté dans: ${csvPath}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  listTickersWithSuffix()
    .then(() => {
      console.log('\n✅ Analyse terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { listTickersWithSuffix };
