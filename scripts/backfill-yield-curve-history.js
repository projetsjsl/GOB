#!/usr/bin/env node
/**
 * Backfill Yield Curve Historical Data
 * 
 * Ce script récupère les données historiques de yield curve (US + Canada)
 * et les stocke dans Supabase pour permettre l'affichage des spreads historiques.
 * 
 * Usage:
 *   node scripts/backfill-yield-curve-history.js [--months=12] [--country=both]
 * 
 * Options:
 *   --months=N     Nombre de mois d'historique à récupérer (défaut: 12)
 *   --country=X    Pays à récupérer: us, canada, both (défaut: both)
 *   --dry-run      Afficher les dates sans insérer dans la DB
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRED_API_KEY = process.env.FRED_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables Supabase manquantes. Configurez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!FRED_API_KEY) {
  console.error('❌ FRED_API_KEY manquante');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Configuration des séries FRED pour US Treasury
const US_TREASURY_RATES = {
  '1M': 'DGS1MO',
  '3M': 'DGS3MO',
  '6M': 'DGS6MO',
  '1Y': 'DGS1',
  '2Y': 'DGS2',
  '3Y': 'DGS3',
  '5Y': 'DGS5',
  '7Y': 'DGS7',
  '10Y': 'DGS10',
  '20Y': 'DGS20',
  '30Y': 'DGS30'
};

// Configuration des séries Bank of Canada
const CANADA_BOND_SERIES = {
  '2Y': 'BD.CDN.2YR.DQ.YLD',
  '3Y': 'BD.CDN.3YR.DQ.YLD',
  '5Y': 'BD.CDN.5YR.DQ.YLD',
  '7Y': 'BD.CDN.7YR.DQ.YLD',
  '10Y': 'BD.CDN.10YR.DQ.YLD',
  '30Y': 'BD.CDN.LONG.DQ.YLD'
};

const CANADA_TBILL_SERIES = {
  '1M': 'V80691342',
  '3M': 'V80691344',
  '6M': 'V80691345',
  '1Y': 'V80691346'
};

function maturityToMonths(maturity) {
  const value = parseFloat(maturity);
  if (maturity.includes('M')) return value;
  if (maturity.includes('Y')) return value * 12;
  return 0;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Récupère toutes les données historiques FRED pour une série
 */
async function fetchFREDHistorical(seriesId, startDate, endDate) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate}&observation_end=${endDate}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠️ FRED erreur pour ${seriesId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return (data.observations || [])
      .filter(o => o.value !== '.' && o.value !== null)
      .map(o => ({ date: o.date, value: parseFloat(o.value) }));
  } catch (error) {
    console.error(`❌ Erreur FRED ${seriesId}:`, error.message);
    return [];
  }
}

/**
 * Récupère les données historiques Bank of Canada
 */
async function fetchBoCHistorical(seriesId, startDate, endDate) {
  const url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?start_date=${startDate}&end_date=${endDate}`;
  
  try {
    const response = await fetch(url, { timeout: 15000 });
    if (!response.ok) {
      console.warn(`⚠️ BoC erreur pour ${seriesId}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return (data.observations || [])
      .filter(o => o[seriesId]?.v !== null && o[seriesId]?.v !== undefined)
      .map(o => ({ date: o.d, value: parseFloat(o[seriesId].v) }));
  } catch (error) {
    console.error(`❌ Erreur BoC ${seriesId}:`, error.message);
    return [];
  }
}

/**
 * Récupère et organise les données US par date
 */
async function fetchUSHistoricalData(startDate, endDate) {
  console.log(`\n📊 Récupération données US Treasury (${startDate} → ${endDate})...`);
  
  const allData = {};
  
  for (const [maturity, seriesId] of Object.entries(US_TREASURY_RATES)) {
    console.log(`   Fetching ${maturity} (${seriesId})...`);
    const observations = await fetchFREDHistorical(seriesId, startDate, endDate);
    
    for (const obs of observations) {
      if (!allData[obs.date]) {
        allData[obs.date] = {};
      }
      allData[obs.date][maturity] = obs.value;
    }
    
    // Rate limiting - pause entre chaque appel
    await sleep(200);
  }
  
  // Convertir en format pour Supabase
  const results = [];
  for (const [date, rates] of Object.entries(allData)) {
    const ratesArray = Object.entries(rates)
      .map(([maturity, rate]) => ({
        maturity,
        rate,
        months: maturityToMonths(maturity),
        change1M: null,
        prevValue: null
      }))
      .sort((a, b) => a.months - b.months);
    
    if (ratesArray.length >= 5) { // Au moins 5 maturités
      const rate10Y = ratesArray.find(r => r.maturity === '10Y');
      const rate2Y = ratesArray.find(r => r.maturity === '2Y');
      const spread = rate10Y && rate2Y ? rate10Y.rate - rate2Y.rate : null;
      
      results.push({
        country: 'us',
        data_date: date,
        rates: ratesArray,
        source: 'FRED',
        currency: 'USD',
        count: ratesArray.length,
        spread_10y_2y: spread,
        inverted: spread !== null ? spread < 0 : false
      });
    }
  }
  
  console.log(`   ✅ ${results.length} jours de données US récupérés`);
  return results.sort((a, b) => a.data_date.localeCompare(b.data_date));
}

/**
 * Récupère et organise les données Canada par date
 */
async function fetchCanadaHistoricalData(startDate, endDate) {
  console.log(`\n📊 Récupération données Canada (${startDate} → ${endDate})...`);
  
  const allData = {};
  
  // Récupérer les T-Bills
  for (const [maturity, seriesId] of Object.entries(CANADA_TBILL_SERIES)) {
    console.log(`   Fetching T-Bill ${maturity} (${seriesId})...`);
    const observations = await fetchBoCHistorical(seriesId, startDate, endDate);
    
    for (const obs of observations) {
      if (!allData[obs.date]) {
        allData[obs.date] = {};
      }
      allData[obs.date][maturity] = obs.value;
    }
    
    await sleep(300); // Rate limiting pour BoC
  }
  
  // Récupérer les Bonds
  for (const [maturity, seriesId] of Object.entries(CANADA_BOND_SERIES)) {
    console.log(`   Fetching Bond ${maturity} (${seriesId})...`);
    const observations = await fetchBoCHistorical(seriesId, startDate, endDate);
    
    for (const obs of observations) {
      if (!allData[obs.date]) {
        allData[obs.date] = {};
      }
      allData[obs.date][maturity] = obs.value;
    }
    
    await sleep(300);
  }
  
  // Convertir en format pour Supabase
  const results = [];
  for (const [date, rates] of Object.entries(allData)) {
    const ratesArray = Object.entries(rates)
      .map(([maturity, rate]) => ({
        maturity,
        rate,
        months: maturityToMonths(maturity),
        change1M: null,
        prevValue: null
      }))
      .sort((a, b) => a.months - b.months);
    
    if (ratesArray.length >= 4) { // Au moins 4 maturités
      const rate10Y = ratesArray.find(r => r.maturity === '10Y');
      const rate2Y = ratesArray.find(r => r.maturity === '2Y');
      const spread = rate10Y && rate2Y ? rate10Y.rate - rate2Y.rate : null;
      
      results.push({
        country: 'canada',
        data_date: date,
        rates: ratesArray,
        source: 'Bank of Canada',
        currency: 'CAD',
        count: ratesArray.length,
        spread_10y_2y: spread,
        inverted: spread !== null ? spread < 0 : false
      });
    }
  }
  
  console.log(`   ✅ ${results.length} jours de données Canada récupérés`);
  return results.sort((a, b) => a.data_date.localeCompare(b.data_date));
}

/**
 * Insère les données dans Supabase par batch
 */
async function insertToSupabase(records, batchSize = 50) {
  if (records.length === 0) {
    console.log('   Aucun enregistrement à insérer');
    return { inserted: 0, errors: 0 };
  }
  
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('yield_curve_data')
      .upsert(batch, { onConflict: 'country,data_date' });
    
    if (error) {
      console.error(`   ❌ Erreur batch ${i}-${i + batch.length}:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      process.stdout.write(`\r   📥 Inséré: ${inserted}/${records.length}`);
    }
    
    await sleep(100);
  }
  
  console.log(''); // Nouvelle ligne après progress
  return { inserted, errors };
}

/**
 * Vérifie les données existantes dans Supabase
 */
async function checkExistingData(country) {
  const { data, error } = await supabase
    .from('yield_curve_data')
    .select('data_date')
    .eq('country', country)
    .order('data_date', { ascending: true });
  
  if (error) {
    console.warn(`⚠️ Erreur vérification ${country}:`, error.message);
    return { count: 0, minDate: null, maxDate: null };
  }
  
  return {
    count: data.length,
    minDate: data[0]?.data_date || null,
    maxDate: data[data.length - 1]?.data_date || null
  };
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Backfill Yield Curve Historical Data');
  console.log('=' .repeat(50));
  
  // Parse arguments
  const args = process.argv.slice(2);
  let months = 12;
  let country = 'both';
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith('--months=')) {
      months = parseInt(arg.split('=')[1]) || 12;
    } else if (arg.startsWith('--country=')) {
      country = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }
  
  console.log(`\n📋 Configuration:`);
  console.log(`   Période: ${months} mois`);
  console.log(`   Pays: ${country}`);
  console.log(`   Dry run: ${dryRun}`);
  
  // Calculer les dates
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`   Date début: ${startDateStr}`);
  console.log(`   Date fin: ${endDateStr}`);
  
  // Vérifier données existantes
  console.log('\n📊 Données existantes dans Supabase:');
  
  if (country === 'us' || country === 'both') {
    const usExisting = await checkExistingData('us');
    console.log(`   US: ${usExisting.count} enregistrements (${usExisting.minDate} → ${usExisting.maxDate})`);
  }
  
  if (country === 'canada' || country === 'both') {
    const caExisting = await checkExistingData('canada');
    console.log(`   Canada: ${caExisting.count} enregistrements (${caExisting.minDate} → ${caExisting.maxDate})`);
  }
  
  if (dryRun) {
    console.log('\n🔍 Mode dry-run - aucune donnée ne sera insérée');
    return;
  }
  
  // Récupérer et insérer les données US
  if (country === 'us' || country === 'both') {
    const usData = await fetchUSHistoricalData(startDateStr, endDateStr);
    console.log(`\n📥 Insertion données US...`);
    const usResult = await insertToSupabase(usData);
    console.log(`   ✅ US: ${usResult.inserted} insérés, ${usResult.errors} erreurs`);
  }
  
  // Récupérer et insérer les données Canada
  if (country === 'canada' || country === 'both') {
    const caData = await fetchCanadaHistoricalData(startDateStr, endDateStr);
    console.log(`\n📥 Insertion données Canada...`);
    const caResult = await insertToSupabase(caData);
    console.log(`   ✅ Canada: ${caResult.inserted} insérés, ${caResult.errors} erreurs`);
  }
  
  // Vérification finale
  console.log('\n📊 Vérification finale:');
  
  if (country === 'us' || country === 'both') {
    const usAfter = await checkExistingData('us');
    console.log(`   US: ${usAfter.count} enregistrements (${usAfter.minDate} → ${usAfter.maxDate})`);
  }
  
  if (country === 'canada' || country === 'both') {
    const caAfter = await checkExistingData('canada');
    console.log(`   Canada: ${caAfter.count} enregistrements (${caAfter.minDate} → ${caAfter.maxDate})`);
  }
  
  console.log('\n✅ Backfill terminé!');
}

main().catch(console.error);
