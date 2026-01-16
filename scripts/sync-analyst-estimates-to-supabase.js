/**
 * Synchronise les Analyst Estimates FMP vers Supabase
 *
 * Ce script:
 * 1. Charge tous les tickers actifs depuis Supabase
 * 2. Fetch les analyst estimates depuis FMP pour chaque ticker
 * 3. Stocke les donnees dans une nouvelle table Supabase
 *
 * Usage: node scripts/sync-analyst-estimates-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const FMP_KEY = process.env.FMP_API_KEY || process.env.FMP_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL et SUPABASE_KEY requis dans .env.local');
  process.exit(1);
}

if (!FMP_KEY) {
  console.error('FMP_API_KEY requis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Stats
const stats = {
  total: 0,
  synced: 0,
  noData: 0,
  errors: 0,
  rateLimited: 0
};

/**
 * Fetch analyst estimates from FMP
 */
async function fetchAnalystEstimates(ticker, delay = 200) {
  await new Promise(r => setTimeout(r, delay));

  try {
    const url = `https://financialmodelingprep.com/api/v3/analyst-estimates/${ticker}?limit=10&apikey=${FMP_KEY}`;
    const res = await fetch(url);

    if (res.status === 429) {
      stats.rateLimited++;
      return { status: 'rate_limited', data: null };
    }

    if (!res.ok) {
      return { status: 'error', data: null, error: `HTTP ${res.status}` };
    }

    const data = await res.json();

    if (!data || !Array.isArray(data) || data.length === 0) {
      stats.noData++;
      return { status: 'no_data', data: null };
    }

    return { status: 'ok', data };

  } catch (error) {
    stats.errors++;
    return { status: 'error', data: null, error: error.message };
  }
}

/**
 * Create table if not exists
 */
async function ensureTable() {
  // Check if table exists by trying to select from it
  const { error } = await supabase
    .from('analyst_estimates')
    .select('ticker')
    .limit(1);

  if (error && error.code === '42P01') {
    // Table doesn't exist - we need to create it via migration
    console.log('Table analyst_estimates does not exist.');
    console.log('Creating table via direct SQL...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS analyst_estimates (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(20) NOT NULL,
        date DATE NOT NULL,
        estimated_revenue_avg DECIMAL,
        estimated_revenue_low DECIMAL,
        estimated_revenue_high DECIMAL,
        estimated_ebitda_avg DECIMAL,
        estimated_ebitda_low DECIMAL,
        estimated_ebitda_high DECIMAL,
        estimated_net_income_avg DECIMAL,
        estimated_net_income_low DECIMAL,
        estimated_net_income_high DECIMAL,
        estimated_eps_avg DECIMAL,
        estimated_eps_low DECIMAL,
        estimated_eps_high DECIMAL,
        number_analysts_estimated_revenue INTEGER,
        number_analysts_estimated_eps INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(ticker, date)
      );

      CREATE INDEX IF NOT EXISTS idx_analyst_estimates_ticker ON analyst_estimates(ticker);
      CREATE INDEX IF NOT EXISTS idx_analyst_estimates_date ON analyst_estimates(date);
    `;

    // Note: This requires service role key with SQL execution permissions
    // If this fails, the table needs to be created manually in Supabase dashboard
    console.log('Please create the table manually in Supabase if this fails.');
    console.log('SQL:', createTableSQL);

    return false;
  }

  return true;
}

/**
 * Upsert analyst estimates to Supabase
 */
async function upsertEstimates(ticker, estimates) {
  const records = estimates.map(e => ({
    ticker: ticker,
    date: e.date,
    estimated_revenue_avg: e.estimatedRevenueAvg,
    estimated_revenue_low: e.estimatedRevenueLow,
    estimated_revenue_high: e.estimatedRevenueHigh,
    estimated_ebitda_avg: e.estimatedEbitdaAvg,
    estimated_ebitda_low: e.estimatedEbitdaLow,
    estimated_ebitda_high: e.estimatedEbitdaHigh,
    estimated_net_income_avg: e.estimatedNetIncomeAvg,
    estimated_net_income_low: e.estimatedNetIncomeLow,
    estimated_net_income_high: e.estimatedNetIncomeHigh,
    estimated_eps_avg: e.estimatedEpsAvg,
    estimated_eps_low: e.estimatedEpsLow,
    estimated_eps_high: e.estimatedEpsHigh,
    number_analysts_estimated_revenue: e.numberAnalystEstimatedRevenue,
    number_analysts_estimated_eps: e.numberAnalystsEstimatedEps,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('analyst_estimates')
    .upsert(records, { onConflict: 'ticker,date' });

  if (error) {
    console.error(`Error upserting ${ticker}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(80));
  console.log('SYNC ANALYST ESTIMATES: FMP -> Supabase');
  console.log('='.repeat(80));
  console.log('');

  // 1. Ensure table exists
  console.log('Verification de la table analyst_estimates...');
  const tableExists = await ensureTable();

  if (!tableExists) {
    console.log('');
    console.log('Veuillez creer la table manuellement dans Supabase Dashboard:');
    console.log('');
    console.log(`
CREATE TABLE analyst_estimates (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  estimated_revenue_avg DECIMAL,
  estimated_revenue_low DECIMAL,
  estimated_revenue_high DECIMAL,
  estimated_ebitda_avg DECIMAL,
  estimated_ebitda_low DECIMAL,
  estimated_ebitda_high DECIMAL,
  estimated_net_income_avg DECIMAL,
  estimated_net_income_low DECIMAL,
  estimated_net_income_high DECIMAL,
  estimated_eps_avg DECIMAL,
  estimated_eps_low DECIMAL,
  estimated_eps_high DECIMAL,
  number_analysts_estimated_revenue INTEGER,
  number_analysts_estimated_eps INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ticker, date)
);

CREATE INDEX idx_analyst_estimates_ticker ON analyst_estimates(ticker);
CREATE INDEX idx_analyst_estimates_date ON analyst_estimates(date);
    `);
    process.exit(1);
  }

  console.log('Table OK\n');

  // 2. Load tickers from Supabase
  console.log('Chargement des tickers depuis Supabase...');
  const { data: tickers, error } = await supabase
    .from('tickers')
    .select('ticker')
    .eq('is_active', true)
    .limit(500);

  if (error) {
    console.error('Erreur Supabase:', error.message);
    process.exit(1);
  }

  stats.total = tickers.length;
  console.log(`${stats.total} tickers charges\n`);

  // 3. Sync each ticker
  console.log('Synchronisation des analyst estimates (250ms entre chaque appel)...\n');

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i].ticker;
    const pct = (((i + 1) / stats.total) * 100).toFixed(0);

    process.stdout.write(`\r[${pct}%] ${i + 1}/${stats.total} - ${ticker.padEnd(10)}`);

    const result = await fetchAnalystEstimates(ticker, 250);

    if (result.status === 'ok' && result.data) {
      const success = await upsertEstimates(ticker, result.data);
      if (success) {
        stats.synced++;
        process.stdout.write(' OK ');
      } else {
        stats.errors++;
        process.stdout.write(' ERR');
      }
    } else if (result.status === 'no_data') {
      process.stdout.write(' --');
    } else if (result.status === 'rate_limited') {
      console.log('\n Rate limited! Waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      i--; // Retry this ticker
    } else {
      stats.errors++;
      process.stdout.write(' ERR');
    }
  }

  console.log('\n');

  // 4. Results
  console.log('='.repeat(80));
  console.log('RESULTATS');
  console.log('='.repeat(80));
  console.log('');
  console.log(`Total tickers:      ${stats.total}`);
  console.log(`Synchronises:       ${stats.synced}`);
  console.log(`Sans donnees:       ${stats.noData}`);
  console.log(`Erreurs:            ${stats.errors}`);
  console.log(`Rate limited:       ${stats.rateLimited}`);
  console.log('');

  // 5. Verify in Supabase
  const { count } = await supabase
    .from('analyst_estimates')
    .select('*', { count: 'exact', head: true });

  console.log(`Total enregistrements dans Supabase: ${count}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('SYNC TERMINE');
  console.log('='.repeat(80));
}

main().catch(console.error);
