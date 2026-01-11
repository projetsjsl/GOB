#!/usr/bin/env node
/**
 * Fill Missing Yield Curve Data
 * 
 * Ce script identifie les dates manquantes dans yield_curve_data
 * et les remplit en utilisant l'API yield-curve ou directement les APIs sources.
 * 
 * Usage:
 *   node scripts/fill-missing-yield-data.js [--days=30] [--country=both] [--use-api]
 * 
 * Options:
 *   --days=N       Nombre de jours à vérifier en arrière (défaut: 30)
 *   --country=X    Pays à vérifier: us, canada, both (défaut: both)
 *   --use-api      Utiliser l'API /api/yield-curve au lieu des APIs directes
 *   --dry-run      Afficher les dates manquantes sans insérer
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRED_API_KEY = process.env.FRED_API_KEY;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables Supabase manquantes. Configurez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function maturityToMonths(maturity) {
  const value = parseFloat(maturity);
  if (maturity.includes('M')) return value;
  if (maturity.includes('Y')) return value * 12;
  return 0;
}

/**
 * Trouve les dates manquantes pour un pays donné
 */
async function findMissingDates(country, days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Générer toutes les dates de la plage
  const allDates = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    // Ignorer les weekends (optionnel - on peut les garder car les marchés peuvent avoir des données)
    allDates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  // Récupérer les dates existantes
  const { data: existing, error } = await supabase
    .from('yield_curve_data')
    .select('data_date')
    .eq('country', country)
    .gte('data_date', startDate.toISOString().split('T')[0])
    .lte('data_date', endDate.toISOString().split('T')[0]);
  
  if (error) {
    console.error(`❌ Erreur lors de la vérification des dates ${country}:`, error.message);
    return [];
  }
  
  const existingDates = new Set(existing.map(r => r.data_date));
  const missingDates = allDates.filter(date => !existingDates.has(date));
  
  return missingDates.sort();
}

/**
 * Récupère les données via l'API yield-curve
 */
async function fetchViaAPI(country, date) {
  try {
    const url = `${BASE_URL}/api/yield-curve?country=${country}&date=${date}`;
    const response = await fetch(url, { 
      timeout: 15000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn(`⚠️ API erreur pour ${country} ${date}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (!data || !data.success || !data.data) {
      return null;
    }
    
    const countryData = data.data[country.toLowerCase()];
    if (!countryData || !countryData.rates || countryData.rates.length === 0) {
      return null;
    }
    
    return countryData;
  } catch (error) {
    console.warn(`⚠️ Erreur API pour ${country} ${date}:`, error.message);
    return null;
  }
}

/**
 * Récupère les données US directement depuis FRED
 */
async function fetchUSDirect(date) {
  if (!FRED_API_KEY) {
    console.warn('⚠️ FRED_API_KEY manquante pour récupération directe');
    return null;
  }
  
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
  
  const rates = {};
  let fetchDate = date;
  
  // Récupérer chaque maturité
  for (const [maturity, seriesId] of Object.entries(US_TREASURY_RATES)) {
    try {
      // FRED nécessite une plage de dates
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 5);
      
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&observation_start=${startDate.toISOString().split('T')[0]}&observation_end=${endDate.toISOString().split('T')[0]}&sort_order=desc`;
      
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const data = await response.json();
      const validObs = (data.observations || [])
        .filter(o => o.value !== '.' && o.value !== null && o.date <= date)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      if (validObs.length > 0) {
        const obs = validObs[0];
        rates[maturity] = parseFloat(obs.value);
        if (!fetchDate || obs.date < fetchDate) {
          fetchDate = obs.date;
        }
      }
      
      await sleep(200); // Rate limiting
    } catch (error) {
      console.warn(`⚠️ Erreur FRED ${maturity}:`, error.message);
    }
  }
  
  if (Object.keys(rates).length < 5) {
    return null;
  }
  
  const ratesArray = Object.entries(rates)
    .map(([maturity, rate]) => ({
      maturity,
      rate,
      months: maturityToMonths(maturity),
      change1M: null,
      prevValue: null
    }))
    .sort((a, b) => a.months - b.months);
  
  const rate10Y = ratesArray.find(r => r.maturity === '10Y');
  const rate2Y = ratesArray.find(r => r.maturity === '2Y');
  const spread = rate10Y && rate2Y ? rate10Y.rate - rate2Y.rate : null;
  
  return {
    country: 'US',
    currency: 'USD',
    rates: ratesArray,
    source: 'FRED',
    date: fetchDate,
    count: ratesArray.length,
    spread_10y_2y: spread,
    inverted: spread !== null ? spread < 0 : false
  };
}

/**
 * Récupère les données Canada directement depuis Bank of Canada
 */
async function fetchCanadaDirect(date) {
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
  
  const rates = {};
  let fetchDate = date;
  
  // Récupérer les T-Bills
  for (const [maturity, seriesId] of Object.entries(CANADA_TBILL_SERIES)) {
    try {
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 5);
      
      const url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
      
      const response = await fetch(url, { timeout: 15000 });
      if (!response.ok) continue;
      
      const data = await response.json();
      const validObs = (data.observations || [])
        .filter(o => o[seriesId]?.v !== null && o[seriesId]?.v !== undefined && o.d <= date)
        .sort((a, b) => b.d.localeCompare(a.d));
      
      if (validObs.length > 0) {
        const obs = validObs[0];
        rates[maturity] = parseFloat(obs[seriesId].v);
        if (!fetchDate || obs.d < fetchDate) {
          fetchDate = obs.d;
        }
      }
      
      await sleep(300);
    } catch (error) {
      console.warn(`⚠️ Erreur BoC T-Bill ${maturity}:`, error.message);
    }
  }
  
  // Récupérer les Bonds
  for (const [maturity, seriesId] of Object.entries(CANADA_BOND_SERIES)) {
    try {
      const targetDate = new Date(date);
      const startDate = new Date(targetDate);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 5);
      
      const url = `https://www.bankofcanada.ca/valet/observations/${seriesId}/json?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
      
      const response = await fetch(url, { timeout: 15000 });
      if (!response.ok) continue;
      
      const data = await response.json();
      const validObs = (data.observations || [])
        .filter(o => o[seriesId]?.v !== null && o[seriesId]?.v !== undefined && o.d <= date)
        .sort((a, b) => b.d.localeCompare(a.d));
      
      if (validObs.length > 0) {
        const obs = validObs[0];
        rates[maturity] = parseFloat(obs[seriesId].v);
        if (!fetchDate || obs.d < fetchDate) {
          fetchDate = obs.d;
        }
      }
      
      await sleep(300);
    } catch (error) {
      console.warn(`⚠️ Erreur BoC Bond ${maturity}:`, error.message);
    }
  }
  
  if (Object.keys(rates).length < 4) {
    return null;
  }
  
  const ratesArray = Object.entries(rates)
    .map(([maturity, rate]) => ({
      maturity,
      rate,
      months: maturityToMonths(maturity),
      change1M: null,
      prevValue: null
    }))
    .sort((a, b) => a.months - b.months);
  
  const rate10Y = ratesArray.find(r => r.maturity === '10Y');
  const rate2Y = ratesArray.find(r => r.maturity === '2Y');
  const spread = rate10Y && rate2Y ? rate10Y.rate - rate2Y.rate : null;
  
  return {
    country: 'Canada',
    currency: 'CAD',
    rates: ratesArray,
    source: 'Bank of Canada',
    date: fetchDate,
    count: ratesArray.length,
    spread_10y_2y: spread,
    inverted: spread !== null ? spread < 0 : false
  };
}

/**
 * Sauvegarde les données dans Supabase
 */
async function saveToSupabase(country, yieldData) {
  if (!yieldData || !yieldData.rates || yieldData.rates.length === 0) {
    return false;
  }
  
  const record = {
    country: country.toLowerCase(),
    data_date: yieldData.date,
    rates: yieldData.rates,
    source: yieldData.source,
    currency: yieldData.currency,
    count: yieldData.count,
    spread_10y_2y: yieldData.spread_10y_2y,
    inverted: yieldData.inverted || false
  };
  
  const { error } = await supabase
    .from('yield_curve_data')
    .upsert(record, { onConflict: 'country,data_date' });
  
  if (error) {
    console.error(`   ❌ Erreur sauvegarde ${country} ${yieldData.date}:`, error.message);
    return false;
  }
  
  return true;
}

/**
 * Remplit les dates manquantes pour un pays
 */
async function fillMissingDates(country, missingDates, useAPI) {
  console.log(`\n📊 Remplissage ${country.toUpperCase()} (${missingDates.length} dates manquantes)...`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < missingDates.length; i++) {
    const date = missingDates[i];
    process.stdout.write(`\r   [${i + 1}/${missingDates.length}] ${date}...`);
    
    let yieldData = null;
    
    if (useAPI) {
      // Utiliser l'API yield-curve
      yieldData = await fetchViaAPI(country, date);
    } else {
      // Utiliser les APIs directes
      if (country === 'us') {
        yieldData = await fetchUSDirect(date);
      } else if (country === 'canada') {
        yieldData = await fetchCanadaDirect(date);
      }
    }
    
    if (yieldData) {
      const saved = await saveToSupabase(country, yieldData);
      if (saved) {
        success++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
    
    // Rate limiting
    await sleep(500);
  }
  
  console.log(`\n   ✅ ${success} réussis, ❌ ${failed} échoués`);
  return { success, failed };
}

/**
 * Main
 */
async function main() {
  console.log('🚀 Fill Missing Yield Curve Data');
  console.log('='.repeat(50));
  
  // Parse arguments
  const args = process.argv.slice(2);
  let days = 30;
  let country = 'both';
  let useAPI = false;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith('--days=')) {
      days = parseInt(arg.split('=')[1]) || 30;
    } else if (arg.startsWith('--country=')) {
      country = arg.split('=')[1];
    } else if (arg === '--use-api') {
      useAPI = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }
  
  console.log(`\n📋 Configuration:`);
  console.log(`   Période: ${days} jours`);
  console.log(`   Pays: ${country}`);
  console.log(`   Méthode: ${useAPI ? 'API /api/yield-curve' : 'APIs directes (FRED/BoC)'}`);
  console.log(`   Dry run: ${dryRun}`);
  
  // Trouver les dates manquantes
  const countries = country === 'both' ? ['us', 'canada'] : [country];
  const missingDatesByCountry = {};
  
  for (const c of countries) {
    console.log(`\n🔍 Recherche dates manquantes pour ${c.toUpperCase()}...`);
    const missing = await findMissingDates(c, days);
    missingDatesByCountry[c] = missing;
    console.log(`   ${missing.length} dates manquantes trouvées`);
    if (missing.length > 0 && missing.length <= 20) {
      console.log(`   Dates: ${missing.join(', ')}`);
    } else if (missing.length > 20) {
      console.log(`   Premières dates: ${missing.slice(0, 10).join(', ')}...`);
      console.log(`   Dernières dates: ...${missing.slice(-10).join(', ')}`);
    }
  }
  
  if (dryRun) {
    console.log('\n🔍 Mode dry-run - aucune donnée ne sera insérée');
    return;
  }
  
  // Remplir les dates manquantes
  const results = {};
  for (const c of countries) {
    const missing = missingDatesByCountry[c];
    if (missing.length > 0) {
      results[c] = await fillMissingDates(c, missing, useAPI);
    } else {
      console.log(`\n✅ ${c.toUpperCase()}: Aucune date manquante`);
      results[c] = { success: 0, failed: 0 };
    }
  }
  
  // Résumé
  console.log('\n📊 Résumé:');
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const [c, r] of Object.entries(results)) {
    console.log(`   ${c.toUpperCase()}: ✅ ${r.success} réussis, ❌ ${r.failed} échoués`);
    totalSuccess += r.success;
    totalFailed += r.failed;
  }
  
  console.log(`\n   Total: ✅ ${totalSuccess} réussis, ❌ ${totalFailed} échoués`);
  console.log('\n✅ Terminé!');
}

main().catch(console.error);
