#!/usr/bin/env node
/**
 * SPRINT 1: Clean Supabase Database
 * Removes skeleton/empty snapshots and validates schema
 *
 * Usage: node scripts/sprint1-clean-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Validation results tracker
const results = {
  schema: {},
  data: {},
  cleaning: {}
};

/**
 * SPRINT 1 - DATABASE SCHEMA VALIDATION (S1-DB-001 to S1-DB-015)
 */
async function validateDatabaseSchema() {
  console.log('\n🔍 SPRINT 1: DATABASE SCHEMA VALIDATION\n');

  // S1-DB-001: Verify finance_pro_snapshots table exists
  console.log('S1-DB-001: Verify finance_pro_snapshots table exists');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('id')
      .limit(1);

    if (error) throw error;
    results.schema['S1-DB-001'] = 'PASS';
    console.log('✅ PASS: Table finance_pro_snapshots exists\n');
  } catch (error) {
    results.schema['S1-DB-001'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
    return false;
  }

  // S1-DB-002: Verify ticker column (VARCHAR 10)
  console.log('S1-DB-002: Verify ticker column (VARCHAR 10)');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('ticker')
      .limit(10);

    if (error) throw error;

    const allValid = data.every(row =>
      typeof row.ticker === 'string' && row.ticker.length <= 10
    );

    if (allValid) {
      results.schema['S1-DB-002'] = 'PASS';
      console.log('✅ PASS: All tickers <= 10 chars\n');
    } else {
      results.schema['S1-DB-002'] = 'FAIL';
      console.log('❌ FAIL: Some tickers exceed 10 chars\n');
    }
  } catch (error) {
    results.schema['S1-DB-002'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // S1-DB-003: Verify profile_id column uniqueness
  console.log('S1-DB-003: Verify profile_id column uniqueness');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('profile_id')
      .limit(1000);

    if (error) throw error;

    const profileIds = data.map(row => row.profile_id);
    const uniqueIds = new Set(profileIds);

    if (profileIds.length === uniqueIds.size) {
      results.schema['S1-DB-003'] = 'PASS';
      console.log('✅ PASS: All profile_ids are unique\n');
    } else {
      results.schema['S1-DB-003'] = 'FAIL';
      console.log(`❌ FAIL: Found ${profileIds.length - uniqueIds.size} duplicate profile_ids\n`);
    }
  } catch (error) {
    results.schema['S1-DB-003'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // S1-DB-004: Verify annual_data JSONB structure
  console.log('S1-DB-004: Verify annual_data JSONB structure');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('ticker, annual_data')
      .not('annual_data', 'is', null)
      .limit(10);

    if (error) throw error;

    let validCount = 0;
    for (const row of data) {
      if (Array.isArray(row.annual_data) && row.annual_data.length > 0) {
        const firstRow = row.annual_data[0];
        if (firstRow.year &&
            (firstRow.earningsPerShare !== undefined || firstRow.cashFlowPerShare !== undefined ||
             firstRow.bookValuePerShare !== undefined || firstRow.dividendPerShare !== undefined)) {
          validCount++;
        }
      }
    }

    if (validCount === data.length) {
      results.schema['S1-DB-004'] = 'PASS';
      console.log('✅ PASS: annual_data structure valid\n');
    } else {
      results.schema['S1-DB-004'] = 'FAIL';
      console.log(`❌ FAIL: ${data.length - validCount}/${data.length} rows have invalid annual_data\n`);
    }
  } catch (error) {
    results.schema['S1-DB-004'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // S1-DB-007: Verify is_current flag logic
  console.log('S1-DB-007: Verify is_current flag logic (only one current per ticker)');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('ticker, is_current');

    if (error) throw error;

    const tickerCurrentCount = {};
    data.forEach(row => {
      if (row.is_current) {
        tickerCurrentCount[row.ticker] = (tickerCurrentCount[row.ticker] || 0) + 1;
      }
    });

    const violations = Object.entries(tickerCurrentCount).filter(([_, count]) => count > 1);

    if (violations.length === 0) {
      results.schema['S1-DB-007'] = 'PASS';
      console.log('✅ PASS: Only one current snapshot per ticker\n');
    } else {
      results.schema['S1-DB-007'] = 'FAIL';
      console.log(`❌ FAIL: ${violations.length} tickers have multiple current snapshots\n`);
      violations.slice(0, 5).forEach(([ticker, count]) => {
        console.log(`   ${ticker}: ${count} current snapshots`);
      });
    }
  } catch (error) {
    results.schema['S1-DB-007'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // S1-DB-010: Verify sync_metadata column exists
  console.log('S1-DB-010: Verify sync_metadata column exists');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('sync_metadata')
      .limit(1);

    if (error) throw error;
    results.schema['S1-DB-010'] = 'PASS';
    console.log('✅ PASS: sync_metadata column exists\n');
  } catch (error) {
    results.schema['S1-DB-010'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  // S1-DB-011: Verify auto_fetched boolean flag
  console.log('S1-DB-011: Verify auto_fetched boolean flag');
  try {
    const { data, error } = await supabase
      .from('finance_pro_snapshots')
      .select('auto_fetched')
      .limit(10);

    if (error) throw error;

    const allValid = data.every(row => typeof row.auto_fetched === 'boolean');

    if (allValid) {
      results.schema['S1-DB-011'] = 'PASS';
      console.log('✅ PASS: auto_fetched is boolean\n');
    } else {
      results.schema['S1-DB-011'] = 'FAIL';
      console.log('❌ FAIL: auto_fetched not boolean for some rows\n');
    }
  } catch (error) {
    results.schema['S1-DB-011'] = 'FAIL';
    console.log(`❌ FAIL: ${error.message}\n`);
  }

  return true;
}

/**
 * CLEAN DATABASE: Delete skeleton/empty snapshots
 */
async function cleanDatabase() {
  console.log('\n🧹 CLEANING DATABASE: Removing skeleton/empty snapshots\n');

  // Get all snapshots
  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('*');

  if (error) {
    console.error('❌ Failed to fetch snapshots:', error.message);
    return;
  }

  console.log(`📊 Total snapshots in database: ${snapshots.length}\n`);

  const toDelete = [];

  for (const snapshot of snapshots) {
    let shouldDelete = false;
    let reason = '';

    // Check 1: No annual_data
    if (!snapshot.annual_data || !Array.isArray(snapshot.annual_data) || snapshot.annual_data.length === 0) {
      shouldDelete = true;
      reason = 'No annual_data';
    }
    // Check 2: Empty annual_data array
    else if (snapshot.annual_data.length === 0) {
      shouldDelete = true;
      reason = 'Empty annual_data';
    }
    // Check 3: No valid EPS, CF, BV, DIV data
    else {
      const hasValidData = snapshot.annual_data.some(row => {
        return (row.earningsPerShare && row.earningsPerShare !== 0) ||
               (row.cashFlowPerShare && row.cashFlowPerShare !== 0) ||
               (row.bookValuePerShare && row.bookValuePerShare !== 0) ||
               (row.dividendPerShare && row.dividendPerShare !== 0);
      });

      if (!hasValidData) {
        shouldDelete = true;
        reason = 'No valid EPS/CF/BV/DIV data';
      }
    }

    // Check 4: No current price in assumptions
    if (!shouldDelete && snapshot.assumptions) {
      if (!snapshot.assumptions.currentPrice || snapshot.assumptions.currentPrice <= 0) {
        shouldDelete = true;
        reason = 'No valid current price';
      }
    }

    if (shouldDelete) {
      toDelete.push({ id: snapshot.id, ticker: snapshot.ticker, reason });
    }
  }

  console.log(`🗑️  Found ${toDelete.length} skeleton/empty snapshots to delete:\n`);

  // Group by reason
  const byReason = {};
  toDelete.forEach(item => {
    byReason[item.reason] = (byReason[item.reason] || 0) + 1;
  });

  Object.entries(byReason).forEach(([reason, count]) => {
    console.log(`   ${reason}: ${count} snapshots`);
  });

  console.log('\n🚀 Starting deletion...\n');

  let deleted = 0;
  let failed = 0;

  for (const item of toDelete) {
    try {
      const { error } = await supabase
        .from('finance_pro_snapshots')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      deleted++;
      if (deleted % 100 === 0) {
        console.log(`   Deleted ${deleted}/${toDelete.length}...`);
      }
    } catch (error) {
      failed++;
      console.error(`❌ Failed to delete ${item.ticker} (${item.id}):`, error.message);
    }
  }

  results.cleaning.total = snapshots.length;
  results.cleaning.deleted = deleted;
  results.cleaning.failed = failed;
  results.cleaning.remaining = snapshots.length - deleted;

  console.log('\n✅ CLEANING COMPLETE:');
  console.log(`   Total snapshots: ${snapshots.length}`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Remaining: ${snapshots.length - deleted}`);
}

/**
 * VALIDATE DATA QUALITY (S1-DATA-001 to S1-DATA-025)
 */
async function validateDataQuality() {
  console.log('\n🔍 VALIDATING DATA QUALITY\n');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('*')
    .limit(100);

  if (error) {
    console.error('❌ Failed to fetch snapshots:', error.message);
    return;
  }

  // S1-DATA-010: Verify currentPrice > 0 in assumptions
  console.log('S1-DATA-010: Verify currentPrice > 0 in assumptions');
  const invalidPrices = snapshots.filter(s =>
    !s.assumptions || !s.assumptions.currentPrice || s.assumptions.currentPrice <= 0
  );

  if (invalidPrices.length === 0) {
    results.data['S1-DATA-010'] = 'PASS';
    console.log('✅ PASS: All snapshots have valid currentPrice > 0\n');
  } else {
    results.data['S1-DATA-010'] = 'FAIL';
    console.log(`❌ FAIL: ${invalidPrices.length} snapshots have invalid currentPrice\n`);
  }

  // S1-DATA-017: Verify company_info.symbol matches ticker
  console.log('S1-DATA-017: Verify company_info.symbol matches ticker');
  const symbolMismatches = snapshots.filter(s =>
    s.company_info && s.company_info.symbol &&
    s.company_info.symbol.toUpperCase() !== s.ticker.toUpperCase()
  );

  if (symbolMismatches.length === 0) {
    results.data['S1-DATA-017'] = 'PASS';
    console.log('✅ PASS: All symbols match tickers\n');
  } else {
    results.data['S1-DATA-017'] = 'FAIL';
    console.log(`❌ FAIL: ${symbolMismatches.length} symbol/ticker mismatches\n`);
  }

  // S1-DATA-018: Verify company_info.name is not empty
  console.log('S1-DATA-018: Verify company_info.name is not empty');
  const emptyNames = snapshots.filter(s =>
    !s.company_info || !s.company_info.name || s.company_info.name.trim() === ''
  );

  if (emptyNames.length === 0) {
    results.data['S1-DATA-018'] = 'PASS';
    console.log('✅ PASS: All snapshots have company name\n');
  } else {
    results.data['S1-DATA-018'] = 'FAIL';
    console.log(`❌ FAIL: ${emptyNames.length} snapshots have empty company name\n`);
  }

  // S1-DATA-023: Verify dataSource field is set
  console.log('S1-DATA-023: Verify dataSource field is set');
  const missingSource = snapshots.filter(s =>
    !Array.isArray(s.annual_data) || !s.annual_data.some(row => row.dataSource)
  );

  if (missingSource.length === 0) {
    results.data['S1-DATA-023'] = 'PASS';
    console.log('✅ PASS: All snapshots have dataSource\n');
  } else {
    results.data['S1-DATA-023'] = 'FAIL';
    console.log(`❌ FAIL: ${missingSource.length} snapshots missing dataSource\n`);
  }
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SPRINT 1: DATABASE CLEANING & VALIDATION');
  console.log('═══════════════════════════════════════════════════════');

  // Step 1: Validate schema
  const schemaValid = await validateDatabaseSchema();
  if (!schemaValid) {
    console.error('\n❌ Schema validation failed. Aborting.');
    process.exit(1);
  }

  // Step 2: Clean database
  await cleanDatabase();

  // Step 3: Validate data quality
  await validateDataQuality();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Schema Validation:');
  Object.entries(results.schema).forEach(([spec, status]) => {
    console.log(`   ${spec}: ${status === 'PASS' ? '✅' : '❌'} ${status}`);
  });

  console.log('\nData Quality:');
  Object.entries(results.data).forEach(([spec, status]) => {
    console.log(`   ${spec}: ${status === 'PASS' ? '✅' : '❌'} ${status}`);
  });

  console.log('\nCleaning Results:');
  console.log(`   Total snapshots: ${results.cleaning.total}`);
  console.log(`   Deleted: ${results.cleaning.deleted}`);
  console.log(`   Remaining: ${results.cleaning.remaining}`);

  // Calculate pass rate
  const allResults = { ...results.schema, ...results.data };
  const totalSpecs = Object.keys(allResults).length;
  const passedSpecs = Object.values(allResults).filter(v => v === 'PASS').length;
  const passRate = ((passedSpecs / totalSpecs) * 100).toFixed(1);

  console.log(`\n📊 PASS RATE: ${passedSpecs}/${totalSpecs} (${passRate}%)`);

  console.log('\n✅ SPRINT 1 COMPLETE');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
