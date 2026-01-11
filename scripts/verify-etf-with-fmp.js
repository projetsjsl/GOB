/**
 * Script pour vérifier les ETF via l'API FMP (flag isEtf)
 */

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

// Tickers suspects à vérifier
const SUSPECT_TICKERS = [
  'BRK.B', 'DOL', 'POW', 'VTSAX',
  // Vérifier aussi quelques actions pour s'assurer qu'elles ne sont pas des ETF
  'NFLX', 'BLK', 'SCHW'
];

/**
 * Vérifie si un ticker est un ETF via FMP
 */
async function checkETF(ticker) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url, { timeout: 10000 });
    
    if (!response.ok) {
      return { ticker, isEtf: null, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return { ticker, isEtf: null, error: 'Aucune donnée' };
    }
    
    const company = data[0];
    return {
      ticker,
      isEtf: company.isEtf === true,
      companyName: company.companyName || company.name,
      exchange: company.exchangeShortName || company.exchange,
      mktCap: company.mktCap || 0
    };
  } catch (error) {
    return { ticker, isEtf: null, error: error.message };
  }
}

async function verifyETFs() {
  console.log('🔍 Vérification des ETF via FMP API...\n');
  
  const results = [];
  
  for (const ticker of SUSPECT_TICKERS) {
    console.log(`Testing ${ticker}...`);
    const result = await checkETF(ticker);
    results.push(result);
    
    if (result.isEtf === true) {
      console.log(`  ✅ ${ticker} est un ETF`);
    } else if (result.isEtf === false) {
      console.log(`  ❌ ${ticker} n'est PAS un ETF (action)`);
    } else {
      console.log(`  ⚠️  ${ticker}: ${result.error || 'Inconnu'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  const etfs = results.filter(r => r.isEtf === true);
  const stocks = results.filter(r => r.isEtf === false);
  const unknown = results.filter(r => r.isEtf === null);
  
  console.log(`\n📊 Résultats:`);
  console.log(`  ✅ ETF confirmés: ${etfs.length}`);
  console.log(`  ❌ Actions (non-ETF): ${stocks.length}`);
  console.log(`  ⚠️  Inconnus: ${unknown.length}`);
  
  return results;
}

// Exécuter
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyETFs()
    .then(() => {
      console.log('\n✅ Vérification terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { verifyETFs, checkETF };
