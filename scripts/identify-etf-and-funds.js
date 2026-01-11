/**
 * Script pour identifier et supprimer tous les ETF et fonds
 * Garde uniquement les actions (stocks)
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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://boyuxgdplbpkknplxbxp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Détecte si un ticker est un ETF
 * Utilise des patterns plus stricts pour éviter les faux positifs
 */
function isETF(ticker, companyName) {
  const tickerUpper = (ticker || '').toUpperCase();
  const nameUpper = (companyName || '').toUpperCase();
  
  // Whitelist d'actions légitimes qui pourraient être confondues avec des ETF
  const knownStocksWhitelist = [
    'ARMK', 'BEN', 'BLK', 'CBOE', 'EQIX', 'HOOD', 'IDXX', 'IVZ', 'JHG', 
    'KMB', 'MKL', 'NBIX', 'NEU', 'NFLX', 'PH', 'SCHW', 'STT', 'TW',
    'VTSAX' // VTSAX est un fonds mutuel, pas un ETF
  ];
  
  if (knownStocksWhitelist.includes(tickerUpper)) {
    return false; // Actions légitimes
  }
  
  // Patterns d'ETF dans le nom (plus spécifiques)
  const etfPatterns = [
    'ETF',
    'EXCHANGE TRADED FUND',
    'INDEX ETF',
    'TRACKER',
    'YIELDMX',
    'YIELDMAX',
    'OPTION INCOME',
    'INCOME STRATEGY',
    'COVERED CALL',
    'BUY-WRITE',
    'ELECTRIFICATION SUPERCYCLE ETF', // POW
    'TRUE DEVELOPED INTERNATIONAL FUND' // DOL
  ];
  
  // Vérifier le nom de la compagnie
  for (const pattern of etfPatterns) {
    if (nameUpper.includes(pattern)) {
      return true;
    }
  }
  
  // Patterns de tickers ETF spécifiques
  // iShares: IVV, IWM, etc. (mais trop génériques, on ne les détecte pas automatiquement)
  // SPDR: SPY, etc. (trop génériques)
  
  return false;
}

/**
 * Détecte si un ticker est un fonds mutuel (utilise la logique existante)
 */
function isMutualFund(ticker, companyName) {
  const tickerUpper = (ticker || '').toUpperCase();
  const nameUpper = (companyName || '').toUpperCase();
  
  // Whitelist d'actions légitimes
  const knownStocksWhitelist = [
    'CGNX', 'EQIX', 'GATX', 'HOLX', 'LRCX', 'NBIX', 'NFLX', 'OTEX', 'PAYX', 
    'IDXX', 'VRTX', 'TXN', 'XOM', 'XEL', 'XPO', 'XRAY', 'XYL', 'XEC', 'XENE',
    'AMZN', 'CMNX', 'CNX', 'DEX', 'FLEX', 'HEX', 'JXN', 'KEX', 'LEX', 'MEX',
    'NEX', 'PEX', 'QEX', 'REX', 'SEX', 'TEX', 'UEX', 'VEX', 'WEX', 'YEX', 'ZEX',
    'POW', 'TROW', 'T', 'AT', 'V', 'MA', 'BLK'
  ];
  
  if (knownStocksWhitelist.includes(tickerUpper)) {
    return false;
  }
  
  // Patterns de fonds mutuels dans le nom
  if (nameUpper.includes('MUTUAL FUND') || 
      nameUpper.includes('FUND TRUST') ||
      nameUpper.includes('INVESTMENT FUND') ||
      nameUpper.includes('INDEX FUND') ||
      (nameUpper.includes('FUND') && nameUpper.includes('SERIES')) ||
      nameUpper.includes('VANGUARD FUNDS') ||
      nameUpper.includes('FIDELITY FUNDS')) {
    return true;
  }
  
  // Patterns Vanguard
  const vanguardPattern = /^V[A-Z]{3}X$/;
  if (vanguardPattern.test(tickerUpper) && tickerUpper.length === 5) {
    return true;
  }
  
  // Patterns Fidelity
  const fidelityPattern = /^F[D|I][A-Z]{2}X$/;
  if (fidelityPattern.test(tickerUpper) && tickerUpper.length === 5) {
    return true;
  }
  
  // Fonds avec suffixe XX
  if (tickerUpper.endsWith('XX') && tickerUpper.length >= 5) {
    return true;
  }
  
  if (tickerUpper.includes('.') || tickerUpper.length < 5) {
    return false;
  }
  
  return false;
}

/**
 * Identifie tous les ETF et fonds
 */
async function identifyETFAndFunds() {
  console.log('🔍 Identification des ETF et fonds...\n');
  
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
        .select('ticker, company_name, country, exchange, sector, source')
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
    
    console.log(`\n📊 Total tickers actifs: ${allTickers.length}\n`);
    console.log('🔍 Analyse de chaque ticker...\n');
    
    const etfs = [];
    const mutualFunds = [];
    const others = [];
    
    allTickers.forEach(t => {
      const ticker = t.ticker || '';
      const companyName = t.company_name || '';
      
      if (isETF(ticker, companyName)) {
        etfs.push(t);
      } else if (isMutualFund(ticker, companyName)) {
        mutualFunds.push(t);
      } else {
        others.push(t);
      }
    });
    
    // Statistiques
    console.log('='.repeat(80));
    console.log('📊 RÉSULTATS DE L\'ANALYSE');
    console.log('='.repeat(80));
    console.log(`\n✅ Actions (à conserver): ${others.length}`);
    console.log(`📊 ETF (à supprimer): ${etfs.length}`);
    console.log(`💼 Fonds mutuels (à supprimer): ${mutualFunds.length}`);
    console.log(`\n❌ Total à supprimer: ${etfs.length + mutualFunds.length}`);
    
    // Détails des ETF
    if (etfs.length > 0) {
      console.log('\n\n' + '='.repeat(80));
      console.log('📊 LISTE DES ETF');
      console.log('='.repeat(80));
      etfs.forEach(etf => {
        console.log(`${etf.ticker.padEnd(15)} | ${(etf.exchange || 'N/A').padEnd(15)} | ${etf.company_name || 'N/A'}`);
      });
    }
    
    // Détails des fonds mutuels
    if (mutualFunds.length > 0) {
      console.log('\n\n' + '='.repeat(80));
      console.log('💼 LISTE DES FONDS MUTUELS');
      console.log('='.repeat(80));
      mutualFunds.forEach(fund => {
        console.log(`${fund.ticker.padEnd(15)} | ${(fund.exchange || 'N/A').padEnd(15)} | ${fund.company_name || 'N/A'}`);
      });
    }
    
    // Export JSON
    const exportData = {
      summary: {
        total: allTickers.length,
        stocks: others.length,
        etfs: etfs.length,
        mutualFunds: mutualFunds.length,
        toDelete: etfs.length + mutualFunds.length,
        generatedAt: new Date().toISOString()
      },
      etfs: etfs.map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        country: t.country,
        exchange: t.exchange,
        sector: t.sector,
        source: t.source
      })),
      mutualFunds: mutualFunds.map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        country: t.country,
        exchange: t.exchange,
        sector: t.sector,
        source: t.source
      })),
      allToDelete: [...etfs, ...mutualFunds].map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        country: t.country,
        exchange: t.exchange,
        sector: t.sector,
        source: t.source,
        type: isETF(t.ticker, t.company_name) ? 'ETF' : 'Mutual Fund'
      }))
    };
    
    const outputPath = path.join(__dirname, '../docs/ETF_ET_FONDS_IDENTIFIES.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Données exportées dans: ${outputPath}`);
    
    // Export SQL
    const sqlPath = path.join(__dirname, '../docs/SUPPRESSION_ETF_ET_FONDS.sql');
    const sqlStatements = exportData.allToDelete.map(t => 
      `-- ${t.company_name || 'N/A'} (${t.type})\nUPDATE tickers SET is_active = false WHERE ticker = '${t.ticker}';`
    ).join('\n\n');
    
    fs.writeFileSync(sqlPath, `-- Script de suppression de ${exportData.allToDelete.length} ETF et fonds\n-- Généré le ${new Date().toISOString()}\n\n${sqlStatements}`);
    console.log(`💾 SQL de suppression généré dans: ${sqlPath}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter
if (import.meta.url === `file://${process.argv[1]}`) {
  identifyETFAndFunds()
    .then(() => {
      console.log('\n✅ Analyse terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { identifyETFAndFunds, isETF, isMutualFund };
