/**
 * Script pour lister les 200 plus petites capitalisations avec formatage
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
 * Formate une capitalisation en millions ou milliards
 */
function formatMarketCap(value) {
  if (!value) return 'N/A';
  
  // Si c'est déjà une string formatée, essayer de la parser
  let numValue;
  if (typeof value === 'string') {
    // Enlever les virgules et espaces
    const cleaned = value.replace(/[, ]/g, '');
    
    // Vérifier si c'est déjà formaté (ex: "2.5B", "500M")
    const match = cleaned.toUpperCase().match(/^([\d.]+)([BMKT]?)$/);
    if (match) {
      numValue = parseFloat(match[1]);
      const suffix = match[2];
      switch (suffix) {
        case 'T': numValue *= 1000000000000; break;
        case 'B': numValue *= 1000000000; break;
        case 'M': numValue *= 1000000; break;
        case 'K': numValue *= 1000; break;
      }
    } else {
      // Essayer de parser comme nombre
      numValue = parseFloat(cleaned);
    }
  } else {
    numValue = typeof value === 'number' ? value : parseFloat(value);
  }
  
  if (isNaN(numValue) || numValue === 0) return 'N/A';
  
  // Formater en milliards si >= 1B, sinon en millions
  if (numValue >= 1000000000) {
    const billions = numValue / 1000000000;
    return `${billions.toFixed(2)}B`;
  } else {
    const millions = numValue / 1000000;
    return `${millions.toFixed(2)}M`;
  }
}

/**
 * Parse market cap to number for sorting
 */
function parseMarketCapToNumber(value) {
  if (!value) return 0;
  
  if (typeof value === 'number') {
    return value;
  }
  
  const cleaned = String(value).replace(/[, ]/g, '');
  const match = cleaned.toUpperCase().match(/^([\d.]+)([BMKT]?)$/);
  
  if (!match) {
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  const numValue = parseFloat(match[1]);
  const suffix = match[2];
  
  switch (suffix) {
    case 'T': return numValue * 1000000000000;
    case 'B': return numValue * 1000000000;
    case 'M': return numValue * 1000000;
    case 'K': return numValue * 1000;
    default: return numValue;
  }
}

/**
 * Liste les 200 plus petites capitalisations
 */
async function listSmallestMarketCaps() {
  console.log('🔍 Récupération des 200 plus petites capitalisations...\n');

  // Récupérer tous les tickers actifs avec market_cap
  let allTickers = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: tickers, error } = await supabase
      .from('tickers')
      .select('ticker, company_name, market_cap, country, exchange, sector')
      .eq('is_active', true)
      .not('market_cap', 'is', null)
      .neq('market_cap', '')
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

  console.log(`📊 ${allTickers.length} tickers avec market_cap trouvés\n`);

  // Trier par market_cap (numérique)
  const sorted = allTickers
    .map(t => ({
      ...t,
      marketCapNum: parseMarketCapToNumber(t.market_cap)
    }))
    .filter(t => t.marketCapNum > 0)
    .sort((a, b) => a.marketCapNum - b.marketCapNum)
    .slice(0, 200);

  console.log(`📋 Top 200 plus petites capitalisations:\n`);

  // Afficher les résultats
  console.log('| Rang | Ticker | Company Name | Market Cap | Country | Exchange | Sector |');
  console.log('|------|--------|---------------|------------|---------|----------|--------|');

  sorted.forEach((ticker, index) => {
    const rank = index + 1;
    const formatted = formatMarketCap(ticker.market_cap);
    const company = (ticker.company_name || 'N/A').substring(0, 30);
    const country = ticker.country || 'N/A';
    const exchange = ticker.exchange || 'N/A';
    const sector = (ticker.sector || 'N/A').substring(0, 20);
    
    console.log(`| ${rank} | ${ticker.ticker.padEnd(6)} | ${company.padEnd(30)} | ${formatted.padEnd(10)} | ${country.padEnd(7)} | ${exchange.padEnd(8)} | ${sector.padEnd(20)} |`);
  });

  // Générer le rapport JSON
  const report = {
    generated_at: new Date().toISOString(),
    total_tickers: allTickers.length,
    smallest_200: sorted.map((t, index) => ({
      rank: index + 1,
      ticker: t.ticker,
      company_name: t.company_name,
      market_cap_raw: t.market_cap,
      market_cap_formatted: formatMarketCap(t.market_cap),
      market_cap_millions: (t.marketCapNum / 1000000).toFixed(2),
      market_cap_billions: (t.marketCapNum / 1000000000).toFixed(2),
      country: t.country,
      exchange: t.exchange,
      sector: t.sector
    }))
  };

  const reportPath = path.join(__dirname, '../docs/TOP_200_PLUS_PETITES_CAPITALISATIONS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Rapport JSON sauvegardé: ${reportPath}`);

  // Générer le rapport Markdown
  const mdPath = path.join(__dirname, '../docs/TOP_200_PLUS_PETITES_CAPITALISATIONS.md');
  let mdContent = `# 📊 Top 200 Plus Petites Capitalisations\n\n`;
  mdContent += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  mdContent += `## 📋 Résumé\n\n`;
  mdContent += `- **Total tickers avec market_cap:** ${allTickers.length}\n`;
  mdContent += `- **Top 200 plus petites capitalisations:**\n\n`;

  mdContent += `| Rang | Ticker | Company Name | Market Cap | Millions | Billions | Country | Exchange | Sector |\n`;
  mdContent += `|------|--------|---------------|------------|----------|----------|---------|----------|--------|\n`;

  sorted.forEach((ticker, index) => {
    const rank = index + 1;
    const formatted = formatMarketCap(ticker.market_cap);
    const millions = (ticker.marketCapNum / 1000000).toFixed(2);
    const billions = (ticker.marketCapNum / 1000000000).toFixed(2);
    const company = ticker.company_name || 'N/A';
    const country = ticker.country || 'N/A';
    const exchange = ticker.exchange || 'N/A';
    const sector = ticker.sector || 'N/A';
    
    mdContent += `| ${rank} | ${ticker.ticker} | ${company} | ${formatted} | ${millions}M | ${billions}B | ${country} | ${exchange} | ${sector} |\n`;
  });

  fs.writeFileSync(mdPath, mdContent);
  console.log(`✅ Rapport Markdown sauvegardé: ${mdPath}`);

  // Statistiques
  const min = sorted[0]?.marketCapNum || 0;
  const max = sorted[sorted.length - 1]?.marketCapNum || 0;
  const avg = sorted.reduce((sum, t) => sum + t.marketCapNum, 0) / sorted.length;

  console.log(`\n📊 Statistiques:`);
  console.log(`   - Plus petite: ${formatMarketCap(min)} (${(min / 1000000).toFixed(2)}M)`);
  console.log(`   - Plus grande (200ème): ${formatMarketCap(max)} (${(max / 1000000).toFixed(2)}M)`);
  console.log(`   - Moyenne: ${formatMarketCap(avg)} (${(avg / 1000000).toFixed(2)}M)`);

  return report;
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  listSmallestMarketCaps()
    .then(() => {
      console.log('\n✅ Liste générée!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

export { listSmallestMarketCaps };
