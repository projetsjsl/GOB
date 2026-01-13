#!/usr/bin/env node
/**
 * 3P1 Supabase Cleanup Script
 *
 * SPRINT 1: S1-DB-001 to S1-DB-015 Validation
 *
 * This script:
 * 1. Connects to Supabase and validates the finance_pro_snapshots table structure
 * 2. Identifies and deletes skeleton/empty snapshots
 * 3. Reports on data quality issues
 *
 * Usage:
 *   node scripts/3p1-cleanup-empty-snapshots.js [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Only report what would be deleted, don't actually delete
 *   --verbose   Show detailed output for each snapshot
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

console.log('='.repeat(80));
console.log('3P1 Supabase Cleanup Script - SPRINT 1 Validation');
console.log('='.repeat(80));
console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will delete empty snapshots)'}`);
console.log('');

/**
 * S1-DB-001 to S1-DB-015: Validate database schema
 */
async function validateDatabaseSchema() {
    console.log('--- S1-DB: Database Schema Validation ---');
    const validationResults = [];

    // S1-DB-001: Verify finance_pro_snapshots table exists
    try {
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('id')
            .limit(1);

        if (error) {
            validationResults.push({ id: 'S1-DB-001', spec: 'Table exists', status: 'FAIL', message: error.message });
        } else {
            validationResults.push({ id: 'S1-DB-001', spec: 'Table exists', status: 'PASS', message: 'Table accessible' });
        }
    } catch (e) {
        validationResults.push({ id: 'S1-DB-001', spec: 'Table exists', status: 'FAIL', message: e.message });
    }

    // S1-DB-002 to S1-DB-015: Validate column structure by fetching sample data
    try {
        const { data, error } = await supabase
            .from('finance_pro_snapshots')
            .select('*')
            .limit(5);

        if (error) {
            validationResults.push({ id: 'S1-DB-002', spec: 'Schema validation', status: 'FAIL', message: error.message });
        } else if (data && data.length > 0) {
            const sample = data[0];
            const requiredColumns = ['id', 'ticker', 'profile_id', 'annual_data', 'assumptions', 'company_info', 'is_current', 'is_watchlist', 'auto_fetched', 'snapshot_date'];

            for (const col of requiredColumns) {
                if (col in sample) {
                    validationResults.push({ id: `S1-DB-*`, spec: `Column '${col}'`, status: 'PASS', message: 'Column exists' });
                } else {
                    validationResults.push({ id: `S1-DB-*`, spec: `Column '${col}'`, status: 'FAIL', message: 'Column missing' });
                }
            }

            // S1-DB-002: Verify ticker column
            const tickerLengths = data.map(d => d.ticker?.length || 0);
            const maxTickerLength = Math.max(...tickerLengths);
            validationResults.push({
                id: 'S1-DB-002',
                spec: 'Ticker <= 10 chars',
                status: maxTickerLength <= 10 ? 'PASS' : 'FAIL',
                message: `Max ticker length: ${maxTickerLength}`
            });

            // S1-DB-004: Verify annual_data JSONB structure
            const hasValidAnnualData = data.some(d => Array.isArray(d.annual_data) && d.annual_data.length > 0);
            validationResults.push({
                id: 'S1-DB-004',
                spec: 'annual_data JSONB',
                status: hasValidAnnualData ? 'PASS' : 'WARN',
                message: hasValidAnnualData ? 'Valid array structure' : 'Some empty arrays found'
            });

            // S1-DB-005: Verify assumptions JSONB structure
            const hasValidAssumptions = data.some(d => d.assumptions && typeof d.assumptions === 'object');
            validationResults.push({
                id: 'S1-DB-005',
                spec: 'assumptions JSONB',
                status: hasValidAssumptions ? 'PASS' : 'WARN',
                message: hasValidAssumptions ? 'Valid object structure' : 'Some empty objects found'
            });

            // S1-DB-006: Verify company_info JSONB structure
            const hasValidCompanyInfo = data.some(d => d.company_info && typeof d.company_info === 'object');
            validationResults.push({
                id: 'S1-DB-006',
                spec: 'company_info JSONB',
                status: hasValidCompanyInfo ? 'PASS' : 'WARN',
                message: hasValidCompanyInfo ? 'Valid object structure' : 'Some empty objects found'
            });
        } else {
            validationResults.push({ id: 'S1-DB-002', spec: 'Schema validation', status: 'WARN', message: 'No data in table to validate' });
        }
    } catch (e) {
        validationResults.push({ id: 'S1-DB-*', spec: 'Schema validation', status: 'FAIL', message: e.message });
    }

    // Print validation results
    console.log('\nSchema Validation Results:');
    console.log('-'.repeat(60));
    for (const result of validationResults) {
        const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${result.id}: ${result.spec} - ${result.message}`);
    }

    return validationResults;
}

/**
 * Identify empty/skeleton snapshots
 */
async function identifyEmptySnapshots() {
    console.log('\n--- Identifying Empty/Skeleton Snapshots ---');

    const { data: allSnapshots, error } = await supabase
        .from('finance_pro_snapshots')
        .select('id, ticker, annual_data, assumptions, company_info, is_current, snapshot_date')
        .order('ticker', { ascending: true });

    if (error) {
        console.error('❌ Error fetching snapshots:', error.message);
        return { empty: [], valid: [] };
    }

    console.log(`Total snapshots in database: ${allSnapshots.length}`);

    const emptySnapshots = [];
    const validSnapshots = [];
    const issues = {
        emptyAnnualData: [],
        noPrice: [],
        noGrowthRates: [],
        noCompanyName: []
    };

    for (const snapshot of allSnapshots) {
        const annualData = snapshot.annual_data || [];
        const assumptions = snapshot.assumptions || {};
        const companyInfo = snapshot.company_info || {};

        let isEmpty = false;
        let issueReasons = [];

        // Check if annual_data is empty or has no valid years
        if (!Array.isArray(annualData) || annualData.length === 0) {
            isEmpty = true;
            issueReasons.push('empty_annual_data');
            issues.emptyAnnualData.push(snapshot.ticker);
        } else {
            // Check if any year has real data (EPS, CF, BV > 0)
            const hasRealData = annualData.some(row =>
                (row.earningsPerShare && row.earningsPerShare !== 0) ||
                (row.cashFlowPerShare && row.cashFlowPerShare !== 0) ||
                (row.bookValuePerShare && row.bookValuePerShare !== 0)
            );
            if (!hasRealData) {
                isEmpty = true;
                issueReasons.push('no_real_data_in_annual');
                issues.emptyAnnualData.push(snapshot.ticker);
            }
        }

        // Check if currentPrice is 0 or missing
        if (!assumptions.currentPrice || assumptions.currentPrice <= 0) {
            issueReasons.push('no_current_price');
            issues.noPrice.push(snapshot.ticker);
        }

        // Check if growth rates are missing or all zero
        const hasGrowthRates = assumptions.growthRateEPS || assumptions.growthRateCF || assumptions.growthRateBV;
        if (!hasGrowthRates) {
            issueReasons.push('no_growth_rates');
            issues.noGrowthRates.push(snapshot.ticker);
        }

        // Check if company name is missing
        if (!companyInfo.name && !companyInfo.companyName && !companyInfo.symbol) {
            issueReasons.push('no_company_info');
            issues.noCompanyName.push(snapshot.ticker);
        }

        if (isEmpty) {
            emptySnapshots.push({
                id: snapshot.id,
                ticker: snapshot.ticker,
                reasons: issueReasons,
                is_current: snapshot.is_current,
                snapshot_date: snapshot.snapshot_date
            });
        } else {
            validSnapshots.push(snapshot);
        }

        if (VERBOSE && issueReasons.length > 0) {
            console.log(`  ${snapshot.ticker}: ${issueReasons.join(', ')}`);
        }
    }

    // Report summary
    console.log('\n--- Summary ---');
    console.log(`Valid snapshots with real data: ${validSnapshots.length}`);
    console.log(`Empty/skeleton snapshots to delete: ${emptySnapshots.length}`);
    console.log(`\nIssue breakdown:`);
    console.log(`  - Empty annual_data: ${issues.emptyAnnualData.length}`);
    console.log(`  - Missing current price: ${issues.noPrice.length}`);
    console.log(`  - Missing growth rates: ${issues.noGrowthRates.length}`);
    console.log(`  - Missing company info: ${issues.noCompanyName.length}`);

    return { empty: emptySnapshots, valid: validSnapshots, issues };
}

/**
 * Delete empty snapshots
 */
async function deleteEmptySnapshots(emptySnapshots) {
    if (emptySnapshots.length === 0) {
        console.log('\n✅ No empty snapshots to delete');
        return { deleted: 0, failed: 0 };
    }

    console.log(`\n--- Deleting ${emptySnapshots.length} Empty Snapshots ---`);

    if (DRY_RUN) {
        console.log('⚠️ DRY RUN - No changes will be made');
        console.log('Snapshots that WOULD be deleted:');
        for (const snap of emptySnapshots.slice(0, 20)) {
            console.log(`  - ${snap.ticker} (${snap.id}) - Reasons: ${snap.reasons.join(', ')}`);
        }
        if (emptySnapshots.length > 20) {
            console.log(`  ... and ${emptySnapshots.length - 20} more`);
        }
        return { deleted: 0, failed: 0, dryRun: true };
    }

    let deleted = 0;
    let failed = 0;

    // Delete in batches of 100
    const batchSize = 100;
    for (let i = 0; i < emptySnapshots.length; i += batchSize) {
        const batch = emptySnapshots.slice(i, i + batchSize);
        const ids = batch.map(s => s.id);

        const { error } = await supabase
            .from('finance_pro_snapshots')
            .delete()
            .in('id', ids);

        if (error) {
            console.error(`❌ Error deleting batch ${i}-${i + batch.length}:`, error.message);
            failed += batch.length;
        } else {
            deleted += batch.length;
            console.log(`✅ Deleted batch ${i + 1}-${i + batch.length} (${batch.length} snapshots)`);
        }
    }

    return { deleted, failed };
}

/**
 * Generate report of unique tickers still needing sync
 */
async function generateSyncReport(validSnapshots, emptySnapshots) {
    console.log('\n--- Sync Status Report ---');

    // Get all active tickers from tickers table
    const { data: allTickers, error: tickersError } = await supabase
        .from('tickers')
        .select('ticker')
        .eq('is_active', true);

    if (tickersError) {
        console.error('❌ Error fetching tickers:', tickersError.message);
        return;
    }

    const allTickerSet = new Set(allTickers.map(t => t.ticker.toUpperCase()));
    const validTickerSet = new Set(validSnapshots.map(s => s.ticker.toUpperCase()));
    const emptyTickerSet = new Set(emptySnapshots.map(s => s.ticker.toUpperCase()));

    // Find tickers that need syncing (active but no valid snapshot)
    const needsSync = [];
    for (const ticker of allTickerSet) {
        if (!validTickerSet.has(ticker)) {
            needsSync.push(ticker);
        }
    }

    console.log(`\nTotal active tickers in database: ${allTickerSet.size}`);
    console.log(`Tickers with valid snapshots: ${validTickerSet.size}`);
    console.log(`Tickers needing FMP sync: ${needsSync.length}`);

    if (needsSync.length > 0 && needsSync.length <= 50) {
        console.log('\nTickers needing sync:');
        console.log(needsSync.join(', '));
    } else if (needsSync.length > 50) {
        console.log('\nFirst 50 tickers needing sync:');
        console.log(needsSync.slice(0, 50).join(', '));
        console.log(`... and ${needsSync.length - 50} more`);
    }

    return { totalTickers: allTickerSet.size, validCount: validTickerSet.size, needsSync };
}

/**
 * Main execution
 */
async function main() {
    try {
        // Step 1: Validate database schema (S1-DB specs)
        const schemaResults = await validateDatabaseSchema();

        // Step 2: Identify empty/skeleton snapshots (S1-DATA specs)
        const { empty, valid, issues } = await identifyEmptySnapshots();

        // Step 3: Delete empty snapshots
        const deleteResult = await deleteEmptySnapshots(empty);

        // Step 4: Generate sync report
        const syncReport = await generateSyncReport(valid, empty);

        // Final summary
        console.log('\n' + '='.repeat(80));
        console.log('FINAL SUMMARY');
        console.log('='.repeat(80));
        console.log(`Schema validations passed: ${schemaResults.filter(r => r.status === 'PASS').length}/${schemaResults.length}`);
        console.log(`Valid snapshots: ${valid.length}`);
        console.log(`Empty snapshots deleted: ${deleteResult.deleted}`);
        console.log(`Delete failures: ${deleteResult.failed}`);
        if (syncReport) {
            console.log(`Tickers needing FMP sync: ${syncReport.needsSync?.length || 0}`);
        }

        if (DRY_RUN) {
            console.log('\n⚠️ This was a DRY RUN. Run without --dry-run to actually delete empty snapshots.');
        }

    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
}

main();
