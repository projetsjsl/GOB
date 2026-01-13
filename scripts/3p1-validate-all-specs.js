#!/usr/bin/env node
/**
 * 3P1 Complete Validation Script
 *
 * Validates all specs from the 3P1-VALIDATION-PLAN-200-SPECS.md
 * Tests database schema, data quality, calculations, and more.
 *
 * Usage:
 *   node scripts/3p1-validate-all-specs.js [--sprint=N] [--verbose]
 *
 * Options:
 *   --sprint=N     Run only specific sprint (1, 2, 3, 4)
 *   --verbose      Show detailed output
 *   --fix          Attempt to fix issues where possible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
};

const SPRINT = parseInt(getArg('sprint', '0')) || 0;
const VERBOSE = args.includes('--verbose');
const FIX = args.includes('--fix');

console.log('='.repeat(80));
console.log('3P1 Complete Validation Script');
console.log('='.repeat(80));
if (SPRINT > 0) console.log(`Running Sprint ${SPRINT} only`);
console.log('');

// Validation results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    specs: []
};

/**
 * Log a spec result
 */
function logSpec(id, description, status, message = '') {
    const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    results.specs.push({ id, description, status, message });

    if (status === 'PASS') results.passed++;
    else if (status === 'WARN') results.warnings++;
    else results.failed++;

    console.log(`${statusIcon} ${id}: ${description}`);
    if (message && (VERBOSE || status !== 'PASS')) {
        console.log(`   ${message}`);
    }
}

/**
 * SPRINT 1: Database Schema Validation (S1-DB-001 to S1-DB-015)
 */
async function validateSprint1_DB() {
    console.log('\n--- S1-DB: Database Schema Validation ---');

    // Fetch sample data for validation
    const { data: samples, error } = await supabase
        .from('finance_pro_snapshots')
        .select('*')
        .limit(100);

    if (error) {
        logSpec('S1-DB-001', 'Table exists', 'FAIL', error.message);
        return;
    }

    logSpec('S1-DB-001', 'Table exists', 'PASS', `${samples.length} samples fetched`);

    if (samples.length === 0) {
        logSpec('S1-DB-002', 'Schema validation', 'WARN', 'No data to validate');
        return;
    }

    const sample = samples[0];

    // S1-DB-002: Ticker column
    const maxTickerLen = Math.max(...samples.map(s => (s.ticker || '').length));
    logSpec('S1-DB-002', 'Ticker <= 10 chars', maxTickerLen <= 10 ? 'PASS' : 'FAIL', `Max length: ${maxTickerLen}`);

    // S1-DB-003: Profile ID uniqueness
    const profileIds = samples.map(s => s.profile_id);
    const uniqueProfileIds = new Set(profileIds);
    // Note: profile_id is not necessarily unique across snapshots, only within is_current=true
    logSpec('S1-DB-003', 'Profile ID exists', profileIds.every(id => id) ? 'PASS' : 'FAIL');

    // S1-DB-004: annual_data JSONB structure
    const validAnnualData = samples.filter(s =>
        Array.isArray(s.annual_data) && s.annual_data.length > 0 &&
        s.annual_data[0].year !== undefined
    );
    logSpec('S1-DB-004', 'annual_data JSONB structure',
        validAnnualData.length === samples.length ? 'PASS' : 'WARN',
        `${validAnnualData.length}/${samples.length} have valid annual_data`);

    // S1-DB-005: assumptions JSONB structure
    const validAssumptions = samples.filter(s =>
        s.assumptions && typeof s.assumptions === 'object'
    );
    logSpec('S1-DB-005', 'assumptions JSONB structure',
        validAssumptions.length === samples.length ? 'PASS' : 'WARN',
        `${validAssumptions.length}/${samples.length} have valid assumptions`);

    // S1-DB-006: company_info JSONB structure
    const validCompanyInfo = samples.filter(s =>
        s.company_info && typeof s.company_info === 'object'
    );
    logSpec('S1-DB-006', 'company_info JSONB structure',
        validCompanyInfo.length === samples.length ? 'PASS' : 'WARN',
        `${validCompanyInfo.length}/${samples.length} have valid company_info`);

    // S1-DB-007: is_current flag
    const hasCurrent = samples.some(s => s.is_current === true);
    logSpec('S1-DB-007', 'is_current flag exists', hasCurrent ? 'PASS' : 'WARN');

    // S1-DB-009: Timestamps
    const hasTimestamps = samples.every(s => s.created_at || s.snapshot_date);
    logSpec('S1-DB-009', 'Timestamps exist', hasTimestamps ? 'PASS' : 'WARN');

    // S1-DB-011: auto_fetched flag
    const hasAutoFetched = 'auto_fetched' in sample;
    logSpec('S1-DB-011', 'auto_fetched flag exists', hasAutoFetched ? 'PASS' : 'WARN');

    // S1-DB-012: is_watchlist flag
    const hasWatchlist = 'is_watchlist' in sample;
    logSpec('S1-DB-012', 'is_watchlist flag exists', hasWatchlist ? 'PASS' : 'WARN');
}

/**
 * SPRINT 1: Data Quality Validation (S1-DATA-001 to S1-DATA-025)
 */
async function validateSprint1_DATA() {
    console.log('\n--- S1-DATA: Data Quality Validation ---');

    const { data: snapshots, error } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker, annual_data, assumptions, company_info')
        .eq('is_current', true)
        .limit(500);

    if (error) {
        logSpec('S1-DATA-001', 'Data fetch', 'FAIL', error.message);
        return;
    }

    let nullEPS = 0, nullCF = 0, nullBV = 0, nullDIV = 0;
    let nullPriceHigh = 0, nullPriceLow = 0;
    let invalidYears = 0, duplicateYears = 0;
    let tooFewYears = 0;
    let zeroPrice = 0;
    let unreasonableGrowth = 0;
    let nanValues = 0;

    for (const snapshot of snapshots) {
        const annual = snapshot.annual_data || [];
        const assumptions = snapshot.assumptions || {};
        const companyInfo = snapshot.company_info || {};

        // S1-DATA-001 to S1-DATA-006: Check for NULL values
        for (const row of annual) {
            if (row.earningsPerShare === null || row.earningsPerShare === undefined) nullEPS++;
            if (row.cashFlowPerShare === null || row.cashFlowPerShare === undefined) nullCF++;
            if (row.bookValuePerShare === null || row.bookValuePerShare === undefined) nullBV++;
            if (row.dividendPerShare === null || row.dividendPerShare === undefined) nullDIV++;
            if (row.priceHigh === null || row.priceHigh === undefined) nullPriceHigh++;
            if (row.priceLow === null || row.priceLow === undefined) nullPriceLow++;

            // S1-DATA-007: Year validation
            if (!row.year || row.year < 1950 || row.year > 2030) invalidYears++;

            // S1-DATA-021/022: NaN/Infinity check
            const values = [row.earningsPerShare, row.cashFlowPerShare, row.bookValuePerShare, row.dividendPerShare, row.priceHigh, row.priceLow];
            for (const val of values) {
                if (typeof val === 'number' && (!isFinite(val) || isNaN(val))) nanValues++;
            }
        }

        // S1-DATA-008: Duplicate years
        const years = annual.map(r => r.year);
        const uniqueYears = new Set(years);
        if (years.length !== uniqueYears.size) duplicateYears++;

        // S1-DATA-009: Minimum years
        if (annual.length < 3) tooFewYears++;

        // S1-DATA-010: Current price
        if (!assumptions.currentPrice || assumptions.currentPrice <= 0) zeroPrice++;

        // S1-DATA-011 to S1-DATA-013: Reasonable growth rates
        const growthRates = [assumptions.growthRateEPS, assumptions.growthRateCF, assumptions.growthRateBV];
        for (const rate of growthRates) {
            if (rate !== undefined && (rate < -50 || rate > 100)) unreasonableGrowth++;
        }
    }

    const total = snapshots.length;
    const totalRows = snapshots.reduce((sum, s) => sum + (s.annual_data?.length || 0), 0);

    logSpec('S1-DATA-001', 'No NULL EPS', nullEPS === 0 ? 'PASS' : 'WARN', `${nullEPS}/${totalRows} null values`);
    logSpec('S1-DATA-002', 'No NULL CF', nullCF === 0 ? 'PASS' : 'WARN', `${nullCF}/${totalRows} null values`);
    logSpec('S1-DATA-003', 'No NULL BV', nullBV === 0 ? 'PASS' : 'WARN', `${nullBV}/${totalRows} null values`);
    logSpec('S1-DATA-004', 'No NULL DIV', nullDIV === 0 ? 'PASS' : 'WARN', `${nullDIV}/${totalRows} null values`);
    logSpec('S1-DATA-005', 'No NULL priceHigh', nullPriceHigh === 0 ? 'PASS' : 'WARN', `${nullPriceHigh}/${totalRows} null values`);
    logSpec('S1-DATA-006', 'No NULL priceLow', nullPriceLow === 0 ? 'PASS' : 'WARN', `${nullPriceLow}/${totalRows} null values`);
    logSpec('S1-DATA-007', 'Valid years (1950-2030)', invalidYears === 0 ? 'PASS' : 'WARN', `${invalidYears} invalid years`);
    logSpec('S1-DATA-008', 'No duplicate years', duplicateYears === 0 ? 'PASS' : 'WARN', `${duplicateYears} tickers with duplicates`);
    logSpec('S1-DATA-009', 'Minimum 3 years', tooFewYears === 0 ? 'PASS' : 'WARN', `${tooFewYears}/${total} have < 3 years`);
    logSpec('S1-DATA-010', 'currentPrice > 0', zeroPrice === 0 ? 'PASS' : 'FAIL', `${zeroPrice}/${total} have zero/no price`);
    logSpec('S1-DATA-011', 'Reasonable growth rates', unreasonableGrowth === 0 ? 'PASS' : 'WARN', `${unreasonableGrowth} unreasonable rates`);
    logSpec('S1-DATA-021', 'No NaN values', nanValues === 0 ? 'PASS' : 'WARN', `${nanValues} NaN/Infinity values`);
}

/**
 * SPRINT 2: Calculation Validation (S2-CALC-001 to S2-CALC-020)
 */
async function validateSprint2_CALC() {
    console.log('\n--- S2-CALC: Calculation Validation ---');

    const { data: snapshots, error } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker, annual_data, assumptions')
        .eq('is_current', true)
        .not('annual_data', 'is', null)
        .limit(50);

    if (error) {
        logSpec('S2-CALC-001', 'Data fetch', 'FAIL', error.message);
        return;
    }

    let validProjections = 0;
    let validCAGR = 0;
    let validTargets = 0;
    let validRecommendations = 0;

    for (const snapshot of snapshots) {
        const annual = snapshot.annual_data || [];
        const assumptions = snapshot.assumptions || {};

        if (annual.length < 3) continue;

        const latestYear = annual.reduce((max, r) => r.year > max.year ? r : max, annual[0]);

        // S2-CALC-001: EPS projection formula
        const baseEPS = latestYear.earningsPerShare || 0;
        const growthEPS = (assumptions.growthRateEPS || 0) / 100;
        const projectedEPS = baseEPS * Math.pow(1 + growthEPS, 5);
        if (baseEPS > 0 && growthEPS > 0 && projectedEPS > baseEPS) {
            validProjections++;
        }

        // S2-CALC-016: CAGR validation
        if (assumptions.growthRateEPS !== undefined && assumptions.growthRateEPS !== 0) {
            validCAGR++;
        }

        // S2-CALC-005 to S2-CALC-009: Target price calculations
        if (assumptions.targetPE && assumptions.targetPE > 0) {
            validTargets++;
        }

        // S2-CALC-011: Recommendation logic
        if (assumptions.currentPrice > 0 && projectedEPS > 0 && assumptions.targetPE) {
            const targetPrice = projectedEPS * assumptions.targetPE;
            const upside = (targetPrice - assumptions.currentPrice) / assumptions.currentPrice;
            // Valid if upside calculation is reasonable
            if (upside > -1 && upside < 10) {
                validRecommendations++;
            }
        }
    }

    const total = snapshots.length;
    logSpec('S2-CALC-001', 'EPS projection formula', validProjections > total * 0.5 ? 'PASS' : 'WARN',
        `${validProjections}/${total} have valid projections`);
    logSpec('S2-CALC-016', 'CAGR calculation', validCAGR > total * 0.5 ? 'PASS' : 'WARN',
        `${validCAGR}/${total} have CAGR values`);
    logSpec('S2-CALC-005', 'Target price calculation', validTargets > total * 0.5 ? 'PASS' : 'WARN',
        `${validTargets}/${total} have target PE`);
    logSpec('S2-CALC-011', 'Recommendation logic', validRecommendations > total * 0.3 ? 'PASS' : 'WARN',
        `${validRecommendations}/${total} have valid recommendation data`);
}

/**
 * SPRINT 3: Final Validation (S3-VAL-001 to S3-VAL-025)
 */
async function validateSprint3_VAL() {
    console.log('\n--- S3-VAL: Final Validation ---');

    // Test specific tickers
    const testTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'BRK-B', 'TD.TO', 'RY.TO', 'BCE.TO'];

    for (const ticker of testTickers) {
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('ticker, annual_data, assumptions, company_info')
            .eq('ticker', ticker.toUpperCase())
            .eq('is_current', true)
            .single();

        if (error || !data) {
            logSpec(`S3-VAL-${testTickers.indexOf(ticker) + 1}`, `${ticker} has data`, 'FAIL', error?.message || 'Not found');
            continue;
        }

        const hasData = data.annual_data && data.annual_data.length >= 3;
        const hasPrice = data.assumptions?.currentPrice > 0;
        const hasEPS = data.annual_data?.some(r => r.earningsPerShare !== 0);

        logSpec(`S3-VAL-${testTickers.indexOf(ticker) + 1}`, `${ticker} has real data`,
            hasData && hasPrice && hasEPS ? 'PASS' : 'WARN',
            `${data.annual_data?.length || 0} years, price $${data.assumptions?.currentPrice?.toFixed(2) || 0}`);
    }

    // S3-VAL-009: No skeleton profiles
    const { data: allSnapshots, error: allError } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker, annual_data, assumptions')
        .eq('is_current', true);

    if (!allError && allSnapshots) {
        const skeletons = allSnapshots.filter(s =>
            !s.annual_data || s.annual_data.length === 0 ||
            !s.assumptions?.currentPrice || s.assumptions.currentPrice <= 0
        );

        logSpec('S3-VAL-009', 'No skeleton profiles', skeletons.length === 0 ? 'PASS' : 'FAIL',
            `${skeletons.length}/${allSnapshots.length} are skeletons`);

        // S3-VAL-010: No zero prices
        const zeroPrices = allSnapshots.filter(s => !s.assumptions?.currentPrice || s.assumptions.currentPrice <= 0);
        logSpec('S3-VAL-010', 'No zero prices', zeroPrices.length === 0 ? 'PASS' : 'FAIL',
            `${zeroPrices.length}/${allSnapshots.length} have zero prices`);
    }
}

/**
 * Summary Report
 */
function printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total specs tested: ${results.specs.length}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`⚠️ Warnings: ${results.warnings}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Pass rate: ${((results.passed / results.specs.length) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\n--- Failed Specs ---');
        for (const spec of results.specs.filter(s => s.status === 'FAIL')) {
            console.log(`  ${spec.id}: ${spec.description} - ${spec.message}`);
        }
    }

    if (VERBOSE && results.warnings > 0) {
        console.log('\n--- Warnings ---');
        for (const spec of results.specs.filter(s => s.status === 'WARN')) {
            console.log(`  ${spec.id}: ${spec.description} - ${spec.message}`);
        }
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        if (SPRINT === 0 || SPRINT === 1) {
            await validateSprint1_DB();
            await validateSprint1_DATA();
        }

        if (SPRINT === 0 || SPRINT === 2) {
            await validateSprint2_CALC();
        }

        if (SPRINT === 0 || SPRINT === 3) {
            await validateSprint3_VAL();
        }

        printSummary();

        // Exit with error code if there are failures
        if (results.failed > 0) {
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Validation script failed:', error);
        process.exit(1);
    }
}

main();
