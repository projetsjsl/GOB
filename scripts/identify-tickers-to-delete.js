/**
 * Script pour identifier les tickers à supprimer de Supabase
 * 
 * Critères de suppression:
 * - Pays: TOUS sauf United States, Canada, US, CA
 * - Bourses internationales: TOUTES sauf NYSE, NASDAQ, AMEX, OTC, OTCQB, OTCQX, PINK (pour les ADR)
 * - Exception: Garder les ADR américains (NYSE/NASDAQ) même si pays != US/CA
 * 
 * Résultat: Liste des tickers à supprimer
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

// Pays à CONSERVER (normalisés)
const KEEP_COUNTRIES = ['United States', 'Canada', 'US', 'CA', 'UNITED STATES', 'CANADA'];

// Bourses américaines (pour ADR et actions US)
const US_EXCHANGES = ['NYSE', 'NASDAQ', 'AMEX', 'OTC', 'OTCQB', 'OTCQX', 'PINK', 'NYS', 'NAS'];

// Bourses canadiennes
const CA_EXCHANGES = ['TSX', 'TSXV', 'CSE', 'NEO', 'TSX-V', 'TSE'];

// Bourses internationales à SUPPRIMER (sauf si ADR sur bourses US)
const INTERNATIONAL_EXCHANGES_TO_DELETE = [
  // Bourses européennes
  'LSE', 'XETRA', 'ETR', 'MUN', 'DUS', 'HAM', 'BER', 'STU', 'BOE', 'BRE', 'FRA', 'GM', 'MU', 'RG', 'HM',
  'PAR', // Paris
  '.AS', '.PA', '.DE', '.F', '.BE', '.DU', '.HA', '.MU', '.RG', '.HM', '.L',
  // Bourses asiatiques
  'HKSE', 'JPX', 'IOB', 'BSE',
  '.HK', '.T', '.CN', '.IL',
  // Bourses autres
  '.MX', '.BR', '.MC', '.SW', '.OL', '.ST', '.CO', '.LS', '.IR', '.IS', '.VI', '.AT',
  'FSX', 'MEX', 'STO'
];

/**
 * Détermine si un ticker doit être supprimé
 */
function shouldDeleteTicker(ticker) {
  const country = (ticker.country || '').toUpperCase();
  const exchange = (ticker.exchange || '').toUpperCase();
  const tickerSymbol = (ticker.ticker || '').toUpperCase();
  const companyName = (ticker.company_name || '').toUpperCase();
  
  // 1. CONSERVER: Pays US ou Canada (peu importe la bourse)
  const keepCountriesUpper = KEEP_COUNTRIES.map(c => c.toUpperCase());
  if (keepCountriesUpper.includes(country)) {
    return false; // Garder
  }
  
  // 2. CONSERVER: ADR américains (NYSE/NASDAQ même si pays != US/CA)
  const usExchangesUpper = US_EXCHANGES.map(e => e.toUpperCase());
  if (usExchangesUpper.includes(exchange)) {
    return false; // Garder (ADR américain ou action US)
  }
  
  // 3. CONSERVER: Bourses canadiennes (même si pays pas exactement "Canada")
  const caExchangesUpper = CA_EXCHANGES.map(e => e.toUpperCase());
  if (caExchangesUpper.includes(exchange)) {
    return false; // Garder (bourse canadienne)
  }
  
  // 4. SUPPRIMER: Tous les autres (bourses internationales non-US/non-CA)
  return true; // Supprimer
}

/**
 * Identifie les tickers à supprimer
 */
async function identifyTickersToDelete() {
  console.log('🔍 Identification des tickers à supprimer...\n');
  
  try {
    // Charger TOUS les tickers actifs (avec pagination pour éviter la limite de 1000)
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
        .order('country')
        .order('exchange')
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
    
    const tickers = allTickers;
    console.log(`\n📊 Total tickers actifs chargés: ${tickers.length}\n`);
    
    // Filtrer les tickers à supprimer
    const toDelete = tickers.filter(shouldDeleteTicker);
    const toKeep = tickers.filter(t => !shouldDeleteTicker(t));
    
    // Statistiques par pays
    const statsByCountry = {};
    toDelete.forEach(t => {
      const country = t.country || 'N/A';
      if (!statsByCountry[country]) {
        statsByCountry[country] = { count: 0, exchanges: new Set(), tickers: [] };
      }
      statsByCountry[country].count++;
      if (t.exchange) statsByCountry[country].exchanges.add(t.exchange);
      statsByCountry[country].tickers.push(t.ticker);
    });
    
    // Statistiques par bourse
    const statsByExchange = {};
    toDelete.forEach(t => {
      const exchange = t.exchange || 'N/A';
      if (!statsByExchange[exchange]) {
        statsByExchange[exchange] = { count: 0, countries: new Set(), tickers: [] };
      }
      statsByExchange[exchange].count++;
      if (t.country) statsByExchange[exchange].countries.add(t.country);
      statsByExchange[exchange].tickers.push(t.ticker);
    });
    
    // Afficher le rapport
    console.log('='.repeat(80));
    console.log('📋 RAPPORT DE SUPPRESSION');
    console.log('='.repeat(80));
    console.log(`\n✅ À CONSERVER: ${toKeep.length} tickers`);
    console.log(`   - US/Canada: ${toKeep.filter(t => KEEP_COUNTRIES.includes(t.country || '')).length}`);
    console.log(`   - ADR américains: ${toKeep.filter(t => !KEEP_COUNTRIES.includes(t.country || '') && US_EXCHANGES.includes(t.exchange || '')).length}`);
    
    console.log(`\n❌ À SUPPRIMER: ${toDelete.length} tickers\n`);
    
    // Par pays
    console.log('📊 Répartition par PAYS:');
    console.log('-'.repeat(80));
    Object.entries(statsByCountry)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([country, stats]) => {
        console.log(`\n${country}: ${stats.count} tickers`);
        console.log(`  Bourses: ${Array.from(stats.exchanges).join(', ')}`);
        console.log(`  Exemples: ${stats.tickers.slice(0, 10).join(', ')}${stats.tickers.length > 10 ? '...' : ''}`);
      });
    
    // Par bourse
    console.log('\n\n📊 Répartition par BOURSE:');
    console.log('-'.repeat(80));
    Object.entries(statsByExchange)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([exchange, stats]) => {
        console.log(`\n${exchange}: ${stats.count} tickers`);
        console.log(`  Pays: ${Array.from(stats.countries).slice(0, 5).join(', ')}${stats.countries.size > 5 ? '...' : ''}`);
        console.log(`  Exemples: ${stats.tickers.slice(0, 10).join(', ')}${stats.tickers.length > 10 ? '...' : ''}`);
      });
    
    // Liste complète des tickers à supprimer
    console.log('\n\n📝 LISTE COMPLÈTE DES TICKERS À SUPPRIMER:');
    console.log('='.repeat(80));
    toDelete.forEach(t => {
      console.log(`${t.ticker.padEnd(15)} | ${(t.country || 'N/A').padEnd(20)} | ${(t.exchange || 'N/A').padEnd(15)} | ${t.company_name || 'N/A'}`);
    });
    
    // Export JSON
    const exportData = {
      summary: {
        total: tickers.length,
        toKeep: toKeep.length,
        toDelete: toDelete.length,
        keepCountries: KEEP_COUNTRIES,
        keepExchanges: US_EXCHANGES
      },
      toDelete: toDelete.map(t => ({
        ticker: t.ticker,
        company_name: t.company_name,
        country: t.country,
        exchange: t.exchange,
        sector: t.sector,
        source: t.source
      })),
      statsByCountry: Object.fromEntries(
        Object.entries(statsByCountry).map(([country, stats]) => [
          country,
          {
            count: stats.count,
            exchanges: Array.from(stats.exchanges),
            tickers: stats.tickers
          }
        ])
      ),
      statsByExchange: Object.fromEntries(
        Object.entries(statsByExchange).map(([exchange, stats]) => [
          exchange,
          {
            count: stats.count,
            countries: Array.from(stats.countries),
            tickers: stats.tickers
          }
        ])
      )
    };
    
    const outputPath = path.join(__dirname, '../docs/TICKERS_TO_DELETE.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n\n💾 Données exportées dans: ${outputPath}`);
    
    // Générer SQL de suppression
    const sqlStatements = toDelete.map(t => 
      `-- ${t.company_name || 'N/A'} (${t.country || 'N/A'}, ${t.exchange || 'N/A'})\nUPDATE tickers SET is_active = false WHERE ticker = '${t.ticker}';`
    ).join('\n');
    
    const sqlPath = path.join(__dirname, '../docs/TICKERS_TO_DELETE.sql');
    fs.writeFileSync(sqlPath, `-- Script de suppression de ${toDelete.length} tickers\n-- Généré le ${new Date().toISOString()}\n\n${sqlStatements}`);
    console.log(`💾 SQL de suppression généré dans: ${sqlPath}`);
    
    return exportData;
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  identifyTickersToDelete()
    .then(() => {
      console.log('\n✅ Analyse terminée');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

export { identifyTickersToDelete, shouldDeleteTicker };
