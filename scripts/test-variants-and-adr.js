/**
 * Script pour tester des variantes et rechercher des ADR pour les tickers en échec FMP
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger .env
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

const FMP_API_KEY = process.env.FMP_API_KEY;
if (!FMP_API_KEY) {
  console.error('❌ FMP_API_KEY non définie');
  process.exit(1);
}

// Tickers en échec avec leurs variantes à tester
const FAILED_TICKERS = [
  {
    original: 'ATD.B',
    variants: ['ATD-B', 'ATD', 'ATD.TO', 'ANCTF'],
    company: 'Alimentation Couche-Tard Inc.',
    country: 'CA',
    exchange: 'TSX'
  },
  {
    original: 'BBD.B',
    variants: ['BBD-B', 'BBD', 'BBD-A.TO', 'BBD-B.TO', 'BOMBF'],
    company: 'Bombardier Inc.',
    country: 'CA',
    exchange: 'TSX'
  },
  {
    original: 'BRK.B',
    variants: ['BRK-B', 'BRK', 'BRK.A', 'BRK-A'],
    company: 'YieldMax BRK.B Option Income Strategy ETF',
    country: 'US',
    exchange: 'AMEX'
  },
  {
    original: 'BFB',
    variants: ['BF-B', 'BFB', 'BF.A', 'BF-A'],
    company: 'Brown Forman Corp (Class B)',
    country: 'US',
    exchange: 'NYS'
  },
  {
    original: 'MOGA',
    variants: ['MOG-A', 'MOG.A', 'MOGA', 'MOG'],
    company: 'Moog Inc (Class A)',
    country: 'US',
    exchange: 'NYS'
  },
  {
    original: 'CCLB.TO',
    variants: ['CCL', 'CCL.TO', 'CCL-B', 'CCLB'],
    company: 'CCL Industries',
    country: 'CANADA',
    exchange: 'TSE'
  },
  {
    original: 'CTCA.TO',
    variants: ['CTC', 'CTC-A', 'CTC.A', 'CTCA', 'CTC.TO'],
    company: 'Canadian Tire \'A\'',
    country: 'CANADA',
    exchange: 'TSE'
  },
  {
    original: 'EMPA.TO',
    variants: ['EMP', 'EMP-A', 'EMP.A', 'EMPA', 'EMP.TO'],
    company: 'Empire Company Limited (Class A)',
    country: 'CANADA',
    exchange: 'TSE'
  },
  {
    original: 'GIBA.TO',
    variants: ['GIB', 'GIB.TO', 'CGI', 'CGI.TO', 'CGI.L'],
    company: 'CGI Inc',
    country: 'CANADA',
    exchange: 'TSE',
    note: 'GIB existe sur NYSE (ADR)'
  },
  {
    original: 'RCIB.TO',
    variants: ['RCI', 'RCI-B', 'RCI.B', 'RCIB', 'RCI.TO', 'RCI.A', 'RCI-A'],
    company: 'Rogers Communications Inc (Class B)',
    country: 'CANADA',
    exchange: 'TSE'
  },
  {
    original: 'CCA',
    variants: ['CCA.TO', 'CCA-A', 'CCA.A'],
    company: 'Cogeco Communications Inc.',
    country: 'CA',
    exchange: 'TSX'
  },
  {
    original: 'GWO',
    variants: ['GWO.TO', 'GWO-A', 'GWO.A'],
    company: 'Great-West Lifeco Inc.',
    country: 'CA',
    exchange: 'TSX'
  },
  {
    original: 'IFC',
    variants: ['IFC.TO', 'IFC-A', 'IFC.A'],
    company: 'Intact Financial Corporation',
    country: 'CA',
    exchange: 'TSX'
  },
  {
    original: 'MRU',
    variants: ['MRU.TO', 'MRU-A', 'MRU.A'],
    company: 'Metro Inc.',
    country: 'CA',
    exchange: 'TSX'
  }
];

/**
 * Teste un ticker via FMP
 */
async function testTickerFMP(ticker) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return { success: false, error: 'Aucune donnée' };
    }
    
    const company = data[0];
    return {
      success: true,
      companyName: company.companyName || company.name || 'N/A',
      exchange: company.exchangeShortName || company.exchange || 'N/A',
      currency: company.currency || 'N/A',
      marketCap: company.mktCap || 0
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Recherche des ADR pour une entreprise
 */
async function searchADR(companyName, country) {
  // Recherche par nom d'entreprise dans FMP
  try {
    const searchUrl = `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(companyName)}&limit=10&apikey=${FMP_API_KEY}`;
    const response = await fetch(searchUrl, { timeout: 10000 });
    
    if (!response.ok) {
      return [];
    }
    
    const results = await response.json();
    
    // Filtrer pour trouver des ADR (NYSE, NASDAQ, OTC) pour entreprises non-US
    const adrCandidates = results.filter(r => {
      const exchange = (r.exchangeShortName || r.exchange || '').toUpperCase();
      const isUSExchange = ['NYSE', 'NASDAQ', 'AMEX', 'OTC', 'OTCQB', 'OTCQX', 'PINK'].includes(exchange);
      const isNotUS = country && country !== 'US' && country !== 'UNITED STATES';
      return isUSExchange && (isNotUS || exchange === 'OTC');
    });
    
    return adrCandidates.map(r => ({
      ticker: r.symbol,
      name: r.name,
      exchange: r.exchangeShortName || r.exchange,
      currency: r.currency
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Teste toutes les variantes et recherche des ADR
 */
async function testVariantsAndADR() {
  console.log('🔍 Test des variantes et recherche d\'ADR pour les tickers en échec...\n');
  
  const results = [];
  
  for (const tickerInfo of FAILED_TICKERS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 ${tickerInfo.original} - ${tickerInfo.company}`);
    console.log(`${'='.repeat(80)}`);
    
    const result = {
      original: tickerInfo.original,
      company: tickerInfo.company,
      country: tickerInfo.country,
      exchange: tickerInfo.exchange,
      variants: [],
      adrFound: [],
      bestMatch: null
    };
    
    // Tester toutes les variantes
    console.log(`\n🧪 Test de ${tickerInfo.variants.length} variantes...`);
    for (const variant of tickerInfo.variants) {
      process.stdout.write(`  Testing ${variant.padEnd(12)}... `);
      const testResult = await testTickerFMP(variant);
      
      if (testResult.success) {
        console.log(`✅ ${testResult.companyName} (${testResult.exchange})`);
        result.variants.push({
          ticker: variant,
          success: true,
          ...testResult
        });
        
        if (!result.bestMatch) {
          result.bestMatch = {
            ticker: variant,
            ...testResult
          };
        }
      } else {
        console.log(`❌ ${testResult.error}`);
        result.variants.push({
          ticker: variant,
          success: false,
          error: testResult.error
        });
      }
      
      // Petit délai pour éviter rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Rechercher des ADR si entreprise non-US
    if (tickerInfo.country && tickerInfo.country !== 'US' && tickerInfo.country !== 'UNITED STATES') {
      console.log(`\n🔍 Recherche d'ADR pour ${tickerInfo.company}...`);
      const adrCandidates = await searchADR(tickerInfo.company, tickerInfo.country);
      
      if (adrCandidates.length > 0) {
        console.log(`  ✅ ${adrCandidates.length} ADR trouvé(s):`);
        adrCandidates.forEach(adr => {
          console.log(`     - ${adr.ticker} (${adr.exchange}): ${adr.name}`);
        });
        result.adrFound = adrCandidates;
      } else {
        console.log(`  ❌ Aucun ADR trouvé`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    results.push(result);
  }
  
  // Résumé
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(80));
  
  const withVariants = results.filter(r => r.bestMatch);
  const withADR = results.filter(r => r.adrFound.length > 0);
  
  console.log(`\n✅ Variantes fonctionnelles trouvées: ${withVariants.length}/${results.length}`);
  console.log(`✅ ADR trouvés: ${withADR.length}/${results.length}`);
  
  // Export JSON
  const exportData = {
    summary: {
      total: results.length,
      withVariants: withVariants.length,
      withADR: withADR.length,
      generatedAt: new Date().toISOString()
    },
    results
  };
  
  const outputPath = path.join(__dirname, '../docs/VARIANTES_ET_ADR_TICKERS_ECHEC.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`\n💾 Données exportées dans: ${outputPath}`);
  
  // Export CSV
  const csvPath = path.join(__dirname, '../docs/VARIANTES_ET_ADR_TICKERS_ECHEC.csv');
  const csvHeader = 'Ticker Original,Variante Fonctionnelle,ADR Disponible,Company Name,Exchange,Currency,Market Cap\n';
  const csvRows = results.map(r => {
    const variant = r.bestMatch ? r.bestMatch.ticker : '';
    const adr = r.adrFound.length > 0 ? r.adrFound.map(a => a.ticker).join('; ') : '';
    const company = r.bestMatch ? r.bestMatch.companyName : r.company;
    const exchange = r.bestMatch ? r.bestMatch.exchange : '';
    const currency = r.bestMatch ? r.bestMatch.currency : '';
    const marketCap = r.bestMatch ? (r.bestMatch.marketCap || 0) : 0;
    
    return [
      r.original,
      variant,
      adr,
      `"${company.replace(/"/g, '""')}"`,
      exchange,
      currency,
      marketCap
    ].join(',');
  }).join('\n');
  
  fs.writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`💾 CSV exporté dans: ${csvPath}`);
  
  return exportData;
}

// Exécuter
if (import.meta.url === `file://${process.argv[1]}`) {
  testVariantsAndADR()
    .then(() => {
      console.log('\n✅ Analyse terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { testVariantsAndADR };
