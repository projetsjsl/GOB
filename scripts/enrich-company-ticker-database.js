/**
 * ENRICH COMPANY-TICKER DATABASE
 * 
 * Script pour enrichir massivement la base de données compagnies → tickers
 * Utilise FMP API et listes publiques pour créer un mapping exhaustif
 * 
 * Usage:
 *   node scripts/enrich-company-ticker-database.js
 *   node scripts/enrich-company-ticker-database.js --update-file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FMP_API_KEY = process.env.FMP_API_KEY;
const TICKER_EXTRACTOR_PATH = path.join(__dirname, '../lib/utils/ticker-extractor.js');

/**
 * Liste des indices majeurs à scraper
 */
const MAJOR_INDICES = {
  'SP500': 'https://financialmodelingprep.com/api/v3/sp500_constituent?apikey=',
  'NASDAQ100': 'https://financialmodelingprep.com/api/v3/nasdaq_constituent?apikey=',
  'DOW30': 'https://financialmodelingprep.com/api/v3/dowjones_constituent?apikey=',
  'TSX': 'https://financialmodelingprep.com/api/v3/tsx_constituent?apikey=',
  'FTSE100': 'https://financialmodelingprep.com/api/v3/ftse100_constituent?apikey=',
  'CAC40': 'https://financialmodelingprep.com/api/v3/cac40_constituent?apikey=',
  'DAX': 'https://financialmodelingprep.com/api/v3/dax_constituent?apikey=',
  'NIKKEI225': 'https://financialmodelingprep.com/api/v3/nikkei225_constituent?apikey='
};

/**
 * Compagnies canadiennes majeures (hardcodées pour TSX)
 */
const CANADIAN_COMPANIES = [
  // Banques
  { name: 'Royal Bank of Canada', ticker: 'RY.TO', aliases: ['RBC', 'Royal Bank', 'Banque Royale'] },
  { name: 'Toronto-Dominion Bank', ticker: 'TD.TO', aliases: ['TD Bank', 'TD', 'Toronto Dominion'] },
  { name: 'Bank of Nova Scotia', ticker: 'BNS.TO', aliases: ['Scotiabank', 'Scotiabank', 'BNS'] },
  { name: 'Bank of Montreal', ticker: 'BMO.TO', aliases: ['BMO', 'Bank of Montreal'] },
  { name: 'Canadian Imperial Bank', ticker: 'CM.TO', aliases: ['CIBC', 'Canadian Imperial Bank of Commerce'] },
  { name: 'National Bank of Canada', ticker: 'NA.TO', aliases: ['National Bank', 'Banque Nationale'] },
  
  // Télécoms
  { name: 'TELUS Corporation', ticker: 'T.TO', aliases: ['Telus', 'TELUS', 'Telus Corp'] },
  { name: 'BCE Inc.', ticker: 'BCE.TO', aliases: ['BCE', 'Bell Canada', 'Bell'] },
  { name: 'Rogers Communications', ticker: 'RCI.B.TO', aliases: ['Rogers', 'RCI'] },
  { name: 'Quebecor Inc.', ticker: 'QBR.B.TO', aliases: ['Quebecor', 'QBR'] },
  
  // Énergie
  { name: 'Canadian Natural Resources', ticker: 'CNQ.TO', aliases: ['CNRL', 'Canadian Natural'] },
  { name: 'Suncor Energy', ticker: 'SU.TO', aliases: ['Suncor', 'SU'] },
  { name: 'Imperial Oil', ticker: 'IMO.TO', aliases: ['Imperial Oil', 'IMO'] },
  { name: 'Cenovus Energy', ticker: 'CVE.TO', aliases: ['Cenovus', 'CVE'] },
  { name: 'Enbridge Inc.', ticker: 'ENB.TO', aliases: ['Enbridge', 'ENB'] },
  { name: 'TC Energy', ticker: 'TRP.TO', aliases: ['TC Energy', 'TransCanada', 'TRP'] },
  { name: 'Pembina Pipeline', ticker: 'PPL.TO', aliases: ['Pembina', 'PPL'] },
  
  // Services publics
  { name: 'Emera Inc.', ticker: 'EMA.TO', aliases: ['Emera', 'EMA'] },
  { name: 'Fortis Inc.', ticker: 'FTS.TO', aliases: ['Fortis', 'FTS'] },
  { name: 'Hydro One', ticker: 'H.TO', aliases: ['Hydro One', 'H'] },
  { name: 'Canadian Utilities', ticker: 'CU.TO', aliases: ['Canadian Utilities', 'CU'] },
  
  // Technologie
  { name: 'Shopify Inc.', ticker: 'SHOP', aliases: ['Shopify', 'SHOP'] },
  { name: 'BlackBerry Limited', ticker: 'BB.TO', aliases: ['BlackBerry', 'BB', 'Research In Motion', 'RIM'] },
  { name: 'OpenText Corporation', ticker: 'OTEX.TO', aliases: ['OpenText', 'OTEX'] },
  { name: 'Lightspeed Commerce', ticker: 'LSPD.TO', aliases: ['Lightspeed', 'LSPD'] },
  { name: 'Constellation Software', ticker: 'CSU.TO', aliases: ['Constellation Software', 'CSU'] },
  
  // Finance & Assurance
  { name: 'Manulife Financial', ticker: 'MFC.TO', aliases: ['Manulife', 'MFC'] },
  { name: 'Sun Life Financial', ticker: 'SLF.TO', aliases: ['Sun Life', 'SLF'] },
  { name: 'Great-West Lifeco', ticker: 'GWO.TO', aliases: ['Great-West Lifeco', 'GWO'] },
  { name: 'Power Corporation', ticker: 'POW.TO', aliases: ['Power Corp', 'Power Corporation of Canada', 'POW'] },
  { name: 'Fairfax Financial', ticker: 'FFH.TO', aliases: ['Fairfax', 'FFH'] },
  
  // Transport
  { name: 'Canadian National Railway', ticker: 'CNR.TO', aliases: ['CN', 'Canadian National', 'CNR'] },
  { name: 'Canadian Pacific Kansas City', ticker: 'CP.TO', aliases: ['CP', 'Canadian Pacific', 'CPKC'] },
  { name: 'Air Canada', ticker: 'AC.TO', aliases: ['Air Canada', 'AC'] },
  { name: 'WestJet', ticker: 'WJA.TO', aliases: ['WestJet', 'WJA'] },
  
  // Consommation
  { name: 'Loblaw Companies', ticker: 'L.TO', aliases: ['Loblaw', 'L', 'Loblaws'] },
  { name: 'Metro Inc.', ticker: 'MRU.TO', aliases: ['Metro', 'MRU'] },
  { name: 'Canadian Tire', ticker: 'CTC.A.TO', aliases: ['Canadian Tire', 'CTC'] },
  { name: 'Restaurant Brands International', ticker: 'QSR.TO', aliases: ['RBI', 'Restaurant Brands', 'QSR'] },
  
  // Ressources
  { name: 'Barrick Gold', ticker: 'ABX.TO', aliases: ['Barrick', 'ABX'] },
  { name: 'Franco-Nevada', ticker: 'FNV.TO', aliases: ['Franco-Nevada', 'FNV'] },
  { name: 'Wheaton Precious Metals', ticker: 'WPM.TO', aliases: ['Wheaton', 'WPM'] },
  { name: 'Nutrien', ticker: 'NTR.TO', aliases: ['Nutrien', 'NTR', 'PotashCorp'] }
];

/**
 * Récupère les constituants d'un indice depuis FMP
 */
async function fetchIndexConstituents(indexName, url) {
  if (!FMP_API_KEY) {
    console.warn(`⚠️ FMP_API_KEY non configuré, skip ${indexName}`);
    return [];
  }

  try {
    const fullUrl = url + FMP_API_KEY;
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      console.warn(`⚠️ Erreur ${response.status} pour ${indexName}`);
      return [];
    }

    const data = await response.json();
    console.log(`✅ ${indexName}: ${data.length} constituants récupérés`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de ${indexName}:`, error.message);
    return [];
  }
}

/**
 * Normalise un nom d'entreprise pour le mapping
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Espaces multiples → un seul
    .replace(/[.,!?;:()]/g, '')  // Supprimer ponctuation
    .replace(/\b(inc|corp|corporation|ltd|limited|llc|plc|sa|nv|ag|co|company)\b/gi, '')  // Supprimer suffixes légaux
    .trim();
}

/**
 * Génère toutes les variations d'un nom d'entreprise
 */
function generateNameVariations(companyName, ticker) {
  const variations = new Set();
  const normalized = normalizeCompanyName(companyName);
  
  // Nom complet normalisé
  variations.add(normalized);
  
  // Mots individuels (si nom composé)
  const words = normalized.split(/\s+/).filter(w => w.length >= 3);
  if (words.length > 1) {
    // Premier mot (ex: "Apple" depuis "Apple Inc")
    variations.add(words[0]);
    
    // Deux premiers mots (ex: "Bank of" depuis "Bank of America")
    if (words.length >= 2) {
      variations.add(words.slice(0, 2).join(' '));
    }
  }
  
  // Acronymes communs
  if (ticker && ticker.length <= 5 && !ticker.includes('.')) {
    // Ne pas ajouter si c'est un ticker ambigu (ex: "T")
    const ambiguousTickers = ['T', 'POW', 'RY', 'TD', 'BNS', 'BMO', 'CM', 'MFC', 'SLF', 'ENB', 'TRP'];
    if (!ambiguousTickers.includes(ticker)) {
      variations.add(ticker.toLowerCase());
    }
  }
  
  return Array.from(variations);
}

/**
 * Construit le mapping enrichi
 */
async function buildEnrichedMapping() {
  console.log('🚀 Début enrichissement base de données compagnies → tickers\n');
  
  const mapping = new Map();
  const stats = {
    total: 0,
    fromIndices: 0,
    fromCanadian: 0,
    duplicates: 0
  };

  // 1. Ajouter compagnies canadiennes hardcodées
  console.log('📋 Ajout compagnies canadiennes...');
  for (const company of CANADIAN_COMPANIES) {
    const normalizedName = normalizeCompanyName(company.name);
    const variations = generateNameVariations(company.name, company.ticker);
    
    // Ajouter nom principal
    if (!mapping.has(normalizedName)) {
      mapping.set(normalizedName, company.ticker);
      stats.total++;
      stats.fromCanadian++;
    }
    
    // Ajouter variations
    for (const variation of variations) {
      if (variation && !mapping.has(variation)) {
        mapping.set(variation, company.ticker);
        stats.total++;
      } else if (variation && mapping.has(variation)) {
        stats.duplicates++;
      }
    }
    
    // Ajouter aliases
    for (const alias of company.aliases || []) {
      const normalizedAlias = normalizeCompanyName(alias);
      if (normalizedAlias && !mapping.has(normalizedAlias)) {
        mapping.set(normalizedAlias, company.ticker);
        stats.total++;
      }
    }
  }
  console.log(`✅ ${CANADIAN_COMPANIES.length} compagnies canadiennes ajoutées\n`);

  // 2. Récupérer constituants des indices majeurs depuis FMP
  console.log('📊 Récupération indices majeurs depuis FMP...');
  for (const [indexName, url] of Object.entries(MAJOR_INDICES)) {
    const constituents = await fetchIndexConstituents(indexName, url);
    
    for (const constituent of constituents) {
      const symbol = constituent.symbol || constituent.ticker;
      const name = constituent.name || constituent.companyName;
      
      if (!symbol || !name) continue;
      
      const normalizedName = normalizeCompanyName(name);
      const variations = generateNameVariations(name, symbol);
      
      // Ajouter nom principal
      if (!mapping.has(normalizedName)) {
        mapping.set(normalizedName, symbol);
        stats.total++;
        stats.fromIndices++;
      }
      
      // Ajouter variations
      for (const variation of variations) {
        if (variation && !mapping.has(variation)) {
          mapping.set(variation, symbol);
          stats.total++;
        }
      }
    }
    
    // Petite pause pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log(`✅ Indices majeurs traités\n`);

  // 3. Convertir Map en objet pour export
  const mappingObject = {};
  for (const [key, value] of mapping.entries()) {
    mappingObject[key] = value;
  }

  console.log('📊 Statistiques:');
  console.log(`   Total entrées: ${stats.total}`);
  console.log(`   Depuis indices: ${stats.fromIndices}`);
  console.log(`   Compagnies canadiennes: ${stats.fromCanadian}`);
  console.log(`   Doublons évités: ${stats.duplicates}\n`);

  return mappingObject;
}

/**
 * Met à jour le fichier ticker-extractor.js
 */
function updateTickerExtractorFile(newMapping) {
  try {
    const fileContent = fs.readFileSync(TICKER_EXTRACTOR_PATH, 'utf8');
    
    // Trouver le début et la fin du mapping
    const startMarker = 'static companyToTicker = {';
    const endMarker = '};';
    
    const startIndex = fileContent.indexOf(startMarker);
    if (startIndex === -1) {
      throw new Error('Impossible de trouver le mapping dans le fichier');
    }
    
    const endIndex = fileContent.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
      throw new Error('Impossible de trouver la fin du mapping');
    }
    
    // Générer le nouveau mapping formaté
    const mappingEntries = Object.entries(newMapping)
      .sort(([a], [b]) => a.localeCompare(b));  // Trier alphabétiquement
    
    const mappingLines = ['    // Base de données enrichie - Générée automatiquement'];
    mappingLines.push('    // Total: ' + mappingEntries.length + ' entrées\n');
    
    // Grouper par catégorie (optionnel, pour lisibilité)
    const categories = {
      'canadian': [],
      'us_tech': [],
      'us_finance': [],
      'us_consumer': [],
      'us_industrial': [],
      'us_energy': [],
      'us_healthcare': [],
      'other': []
    };
    
    for (const [name, ticker] of mappingEntries) {
      if (ticker.includes('.TO')) {
        categories.canadian.push([name, ticker]);
      } else if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX'].includes(ticker)) {
        categories.us_tech.push([name, ticker]);
      } else if (['JPM', 'BAC', 'GS', 'MS', 'WFC', 'C'].includes(ticker)) {
        categories.us_finance.push([name, ticker]);
      } else if (['KO', 'PEP', 'MCD', 'NKE', 'WMT', 'COST', 'HD', 'TGT', 'SBUX'].includes(ticker)) {
        categories.us_consumer.push([name, ticker]);
      } else if (['BA', 'CAT', 'MMM', 'GE', 'HON'].includes(ticker)) {
        categories.us_industrial.push([name, ticker]);
      } else if (['XOM', 'CVX', 'COP'].includes(ticker)) {
        categories.us_energy.push([name, ticker]);
      } else if (['JNJ', 'PFE', 'MRK', 'ABBV', 'BMY', 'LLY', 'UNH'].includes(ticker)) {
        categories.us_healthcare.push([name, ticker]);
      } else {
        categories.other.push([name, ticker]);
      }
    }
    
    // Ajouter par catégorie
    if (categories.canadian.length > 0) {
      mappingLines.push('    // Canadian');
      for (const [name, ticker] of categories.canadian) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_tech.length > 0) {
      mappingLines.push('    // Tech Giants');
      for (const [name, ticker] of categories.us_tech) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_finance.length > 0) {
      mappingLines.push('    // Finance');
      for (const [name, ticker] of categories.us_finance) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_consumer.length > 0) {
      mappingLines.push('    // Consumer');
      for (const [name, ticker] of categories.us_consumer) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_industrial.length > 0) {
      mappingLines.push('    // Industrial');
      for (const [name, ticker] of categories.us_industrial) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_energy.length > 0) {
      mappingLines.push('    // Energy');
      for (const [name, ticker] of categories.us_energy) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.us_healthcare.length > 0) {
      mappingLines.push('    // Healthcare');
      for (const [name, ticker] of categories.us_healthcare) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
      mappingLines.push('');
    }
    
    if (categories.other.length > 0) {
      mappingLines.push('    // Other');
      for (const [name, ticker] of categories.other) {
        mappingLines.push(`    '${name}': '${ticker}',`);
      }
    }
    
    const newMappingCode = mappingLines.join('\n');
    
    // Reconstruire le fichier
    const beforeMapping = fileContent.substring(0, startIndex + startMarker.length);
    const afterMapping = fileContent.substring(endIndex);
    const newFileContent = beforeMapping + '\n' + newMappingCode + '\n  ' + afterMapping;
    
    // Sauvegarder
    fs.writeFileSync(TICKER_EXTRACTOR_PATH, newFileContent, 'utf8');
    console.log(`✅ Fichier ${TICKER_EXTRACTOR_PATH} mis à jour`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du fichier:', error.message);
    throw error;
  }
}

/**
 * Main
 */
async function main() {
  const shouldUpdateFile = process.argv.includes('--update-file');
  
  try {
    const enrichedMapping = await buildEnrichedMapping();
    
    // Sauvegarder dans un fichier JSON pour référence
    const jsonPath = path.join(__dirname, '../data/company-ticker-mapping.json');
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(enrichedMapping, null, 2), 'utf8');
    console.log(`✅ Mapping sauvegardé dans ${jsonPath}`);
    
    if (shouldUpdateFile) {
      console.log('\n📝 Mise à jour du fichier ticker-extractor.js...');
      updateTickerExtractorFile(enrichedMapping);
      console.log('✅ Fichier mis à jour avec succès!');
    } else {
      console.log('\n💡 Pour mettre à jour le fichier, exécutez:');
      console.log('   node scripts/enrich-company-ticker-database.js --update-file');
    }
    
    console.log(`\n🎉 Enrichissement terminé: ${Object.keys(enrichedMapping).length} entrées`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
main();

