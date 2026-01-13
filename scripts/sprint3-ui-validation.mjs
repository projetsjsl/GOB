#!/usr/bin/env node
/**
 * SPRINT 3: UI/UX & Final Validation
 * Validates the UI at gobapps.com/3p1 displays real data correctly
 *
 * Usage: node scripts/sprint3-ui-validation.mjs
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

const results = {
  ui: {},
  validation: {},
  dataQuality: {}
};

function hasValidMarketCap(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toUpperCase() === 'N/A' || trimmed === '0') return false;
    const match = trimmed.match(/^([\d.]+)([BMKT]?)$/i);
    if (match) {
      return parseFloat(match[1]) > 0;
    }
    const numeric = Number(trimmed.replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) && numeric > 0;
  }
  return false;
}

/**
 * S3-VAL-009: No skeleton profiles
 */
async function validateNoSkeletonProfiles() {
  console.log('\nS3-VAL-009: No skeleton profiles');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, annual_data, assumptions')
    .eq('is_current', true);

  if (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    results.validation['S3-VAL-009'] = 'FAIL';
    return;
  }

  const skeletons = snapshots.filter(s => {
    // Check if annual_data is empty or has no valid data
    if (!s.annual_data || !Array.isArray(s.annual_data) || s.annual_data.length === 0) {
      return true;
    }

    // Check if no valid metrics exist
    const hasValidData = s.annual_data.some(row =>
      (Number.isFinite(row.earningsPerShare) && row.earningsPerShare !== 0) ||
      (Number.isFinite(row.cashFlowPerShare) && row.cashFlowPerShare !== 0) ||
      (Number.isFinite(row.bookValuePerShare) && row.bookValuePerShare !== 0) ||
      (Number.isFinite(row.dividendPerShare) && row.dividendPerShare !== 0)
    );

    if (!hasValidData) return true;

    // Check if current price is invalid
    if (!s.assumptions || !s.assumptions.currentPrice || s.assumptions.currentPrice <= 0) {
      return true;
    }

    return false;
  });

  if (skeletons.length === 0) {
    console.log('✅ PASS: No skeleton profiles found\n');
    results.validation['S3-VAL-009'] = 'PASS';
  } else {
    console.log(`❌ FAIL: Found ${skeletons.length} skeleton profiles\n`);
    skeletons.slice(0, 10).forEach(s => console.log(`   - ${s.ticker}`));
    results.validation['S3-VAL-009'] = 'FAIL';
  }
}

/**
 * S3-VAL-010: No zero prices
 */
async function validateNoZeroPrices() {
  console.log('S3-VAL-010: No zero prices');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, assumptions')
    .eq('is_current', true);

  if (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    results.validation['S3-VAL-010'] = 'FAIL';
    return;
  }

  const zeroPrices = snapshots.filter(s =>
    !s.assumptions || !s.assumptions.currentPrice || s.assumptions.currentPrice <= 0
  );

  if (zeroPrices.length === 0) {
    console.log('✅ PASS: All prices > 0\n');
    results.validation['S3-VAL-010'] = 'PASS';
  } else {
    console.log(`❌ FAIL: Found ${zeroPrices.length} snapshots with zero/invalid prices\n`);
    zeroPrices.slice(0, 10).forEach(s => console.log(`   - ${s.ticker}`));
    results.validation['S3-VAL-010'] = 'FAIL';
  }
}

/**
 * S3-VAL-011: No N/A capitalizations
 */
async function validateNoNACapitalizations() {
  console.log('S3-VAL-011: No N/A capitalizations');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, company_info')
    .eq('is_current', true);

  if (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    results.validation['S3-VAL-011'] = 'FAIL';
    return;
  }

  const naCaps = snapshots.filter(s =>
    !s.company_info || !hasValidMarketCap(s.company_info.marketCap)
  );

  if (naCaps.length === 0) {
    console.log('✅ PASS: All have valid market cap\n');
    results.validation['S3-VAL-011'] = 'PASS';
  } else {
    console.log(`❌ FAIL: Found ${naCaps.length} snapshots with N/A market cap\n`);
    naCaps.slice(0, 10).forEach(s => console.log(`   - ${s.ticker}`));
    results.validation['S3-VAL-011'] = 'FAIL';
  }
}

/**
 * S3-VAL-012: No empty sectors
 */
async function validateNoEmptySectors() {
  console.log('S3-VAL-012: No empty sectors');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, company_info')
    .eq('is_current', true);

  if (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    results.validation['S3-VAL-012'] = 'FAIL';
    return;
  }

  const emptySectors = snapshots.filter(s =>
    !s.company_info || !s.company_info.sector || s.company_info.sector.trim() === '' || s.company_info.sector === 'Unknown'
  );

  if (emptySectors.length === 0) {
    console.log('✅ PASS: All have valid sector\n');
    results.validation['S3-VAL-012'] = 'PASS';
  } else {
    console.log(`❌ FAIL: Found ${emptySectors.length} snapshots with empty/unknown sector\n`);
    emptySectors.slice(0, 10).forEach(s => console.log(`   - ${s.ticker}`));
    results.validation['S3-VAL-012'] = 'FAIL';
  }
}

/**
 * Validate specific high-profile tickers
 */
async function validateKeyTickers() {
  console.log('\n🔍 VALIDATING KEY TICKERS\n');

  const keyTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'BRK-B', 'TD.TO', 'RY.TO', 'BCE.TO'];

  for (const ticker of keyTickers) {
    console.log(`Checking ${ticker}...`);

    const { data: snapshot, error } = await supabase
      .from('finance_pro_snapshots')
      .select('*')
      .eq('ticker', ticker)
      .eq('is_current', true)
      .single();

    if (error) {
      console.log(`❌ ${ticker}: Not found or error: ${error.message}\n`);
      results.validation[`KEY-${ticker}`] = 'FAIL';
      continue;
    }

    // Validate data completeness
    const hasAnnualData = snapshot.annual_data && Array.isArray(snapshot.annual_data) && snapshot.annual_data.length > 0;
    const hasValidMetrics = hasAnnualData && snapshot.annual_data.some(row =>
      (Number.isFinite(row.earningsPerShare) && row.earningsPerShare !== 0) ||
      (Number.isFinite(row.cashFlowPerShare) && row.cashFlowPerShare !== 0) ||
      (Number.isFinite(row.bookValuePerShare) && row.bookValuePerShare !== 0) ||
      (Number.isFinite(row.dividendPerShare) && row.dividendPerShare !== 0)
    );
    const hasCurrentPrice = snapshot.assumptions && snapshot.assumptions.currentPrice && snapshot.assumptions.currentPrice > 0;
    const hasCompanyInfo = snapshot.company_info && snapshot.company_info.name && snapshot.company_info.sector;

    if (hasAnnualData && hasValidMetrics && hasCurrentPrice && hasCompanyInfo) {
      console.log(`✅ ${ticker}: Complete (${snapshot.annual_data.length} years, $${snapshot.assumptions.currentPrice.toFixed(2)})\n`);
      results.validation[`KEY-${ticker}`] = 'PASS';
    } else {
      console.log(`❌ ${ticker}: Incomplete data`);
      console.log(`   Annual data: ${hasAnnualData ? 'YES' : 'NO'}`);
      console.log(`   Valid metrics: ${hasValidMetrics ? 'YES' : 'NO'}`);
      console.log(`   Current price: ${hasCurrentPrice ? 'YES' : 'NO'}`);
      console.log(`   Company info: ${hasCompanyInfo ? 'YES' : 'NO'}\n`);
      results.validation[`KEY-${ticker}`] = 'FAIL';
    }
  }
}

/**
 * Validate FMP data source
 */
async function validateFMPDataSource() {
  console.log('\n🔍 VALIDATING FMP DATA SOURCE\n');

  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('ticker, auto_fetched, sync_metadata, company_info, annual_data')
    .eq('is_current', true)
    .limit(100);

  if (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
    return;
  }

  const fmpCount = snapshots.filter(s => {
    if (s.auto_fetched !== true) return false;
    const companySource = s.company_info?.dataSource;
    const annualSources = Array.isArray(s.annual_data)
      ? s.annual_data.map(row => row.dataSource).filter(Boolean)
      : [];
    return (
      (typeof companySource === 'string' && companySource.startsWith('fmp-')) ||
      annualSources.some(src => typeof src === 'string' && src.startsWith('fmp-'))
    );
  }).length;

  const percentage = ((fmpCount / snapshots.length) * 100).toFixed(1);

  console.log(`📊 FMP Data Source: ${fmpCount}/${snapshots.length} (${percentage}%)`);

  if (fmpCount === snapshots.length) {
    console.log('✅ All snapshots are from FMP\n');
    results.dataQuality['FMP_SOURCE'] = 'PASS';
  } else {
    console.log(`⚠️  ${snapshots.length - fmpCount} snapshots not from FMP\n`);
    results.dataQuality['FMP_SOURCE'] = 'PARTIAL';
  }
}

/**
 * Generate statistics report
 */
async function generateStatistics() {
  console.log('\n📊 GENERATING STATISTICS\n');

  // Total snapshots
  const { count: totalCount, error: countError } = await supabase
    .from('finance_pro_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('is_current', true);

  if (countError) {
    console.log(`❌ Failed to count snapshots: ${countError.message}\n`);
    return;
  }

  console.log(`Total Current Snapshots: ${totalCount}`);

  // Average data years
  const { data: snapshots, error } = await supabase
    .from('finance_pro_snapshots')
    .select('annual_data')
    .eq('is_current', true);

  if (!error && snapshots) {
    const dataYears = snapshots
      .filter(s => s.annual_data && Array.isArray(s.annual_data))
      .map(s => s.annual_data.length);

    const avgYears = dataYears.length > 0
      ? (dataYears.reduce((a, b) => a + b, 0) / dataYears.length).toFixed(1)
      : 0;

    const minYears = dataYears.length > 0 ? Math.min(...dataYears) : 0;
    const maxYears = dataYears.length > 0 ? Math.max(...dataYears) : 0;

    console.log(`Average Data Years: ${avgYears} (min: ${minYears}, max: ${maxYears})`);
  }

  // FMP vs Manual
  const { data: sourceCounts, error: sourceError } = await supabase
    .from('finance_pro_snapshots')
    .select('auto_fetched')
    .eq('is_current', true);

  if (!sourceError && sourceCounts) {
    const autoCount = sourceCounts.filter(s => s.auto_fetched === true).length;
    const manualCount = sourceCounts.length - autoCount;

    console.log(`Auto-fetched (FMP): ${autoCount}`);
    console.log(`Manual: ${manualCount}`);
  }

  console.log('');
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SPRINT 3: UI/UX & FINAL VALIDATION');
  console.log('═══════════════════════════════════════════════════════');

  // Run validations
  await validateNoSkeletonProfiles();
  await validateNoZeroPrices();
  await validateNoNACapitalizations();
  await validateNoEmptySectors();
  await validateKeyTickers();
  await validateFMPDataSource();
  await generateStatistics();

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Validation Results:');
  Object.entries(results.validation).forEach(([spec, status]) => {
    const icon = status === 'PASS' ? '✅' : status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`   ${spec}: ${icon} ${status}`);
  });

  console.log('\nData Quality:');
  Object.entries(results.dataQuality).forEach(([metric, status]) => {
    const icon = status === 'PASS' ? '✅' : status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`   ${metric}: ${icon} ${status}`);
  });

  // Calculate pass rate
  const allResults = { ...results.validation, ...results.dataQuality };
  const totalSpecs = Object.keys(allResults).length;
  const passedSpecs = Object.values(allResults).filter(v => v === 'PASS').length;
  const passRate = totalSpecs > 0 ? ((passedSpecs / totalSpecs) * 100).toFixed(1) : 0;

  console.log(`\n📊 PASS RATE: ${passedSpecs}/${totalSpecs} (${passRate}%)`);

  if (passRate >= 90) {
    console.log('\n✅ SPRINT 3 COMPLETE - EXCELLENT');
  } else if (passRate >= 70) {
    console.log('\n⚠️  SPRINT 3 COMPLETE - NEEDS IMPROVEMENT');
  } else {
    console.log('\n❌ SPRINT 3 INCOMPLETE - CRITICAL ISSUES');
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
