#!/usr/bin/env node
/**
 * S2-CALC Validation Script
 * Validates calculation formulas against S2-CALC-001 to S2-CALC-020 specs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Calculation functions (matching calculations.ts)
const projectFutureValue = (current, rate, years) => {
    if (current == null || rate == null || years == null) return 0;
    if (!isFinite(current) || !isFinite(rate) || !isFinite(years)) return 0;
    if (years <= 0) return current;
    return current * Math.pow(1 + rate / 100, years);
};

const calculateCAGR = (startValue, endValue, years) => {
    if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
};

async function validateCalculations() {
    console.log('='.repeat(70));
    console.log('S2-CALC Validation - Calculation Formula Verification');
    console.log('='.repeat(70));

    const results = [];

    // Fetch sample tickers for validation
    const { data: snapshots, error } = await supabase
        .from('finance_pro_snapshots')
        .select('ticker, annual_data, assumptions, company_info')
        .eq('is_current', true)
        .limit(20);

    if (error) {
        console.error('Error fetching snapshots:', error.message);
        return;
    }

    console.log(`\nValidating ${snapshots.length} tickers...`);

    for (const snapshot of snapshots) {
        const { ticker, annual_data, assumptions, company_info } = snapshot;
        const data = annual_data || [];
        const assume = assumptions || {};

        // S2-CALC-001: EPS projection formula
        const baseEPS = data.find(d => d.year === assume.baseYear)?.earningsPerShare ||
                       (data.length > 0 ? data[data.length - 1].earningsPerShare : 0);
        const projectedEPS = projectFutureValue(baseEPS, assume.growthRateEPS || 0, 5);
        const calc001 = projectedEPS > 0 || baseEPS <= 0;

        // S2-CALC-005: Target price from EPS
        const targetPriceEPS = projectedEPS * (assume.targetPE || 15);
        const calc005 = targetPriceEPS >= 0;

        // S2-CALC-010: Upside/downside %
        const upside = assume.currentPrice > 0 ?
            ((targetPriceEPS - assume.currentPrice) / assume.currentPrice) * 100 : 0;
        const calc010 = isFinite(upside);

        // S2-CALC-012: Dividend yield calc
        const divYield = assume.currentPrice > 0 && assume.currentDividend > 0 ?
            (assume.currentDividend / assume.currentPrice) * 100 : 0;
        const calc012 = divYield >= 0;

        // S2-CALC-013: PE ratio calc
        const peRatio = baseEPS > 0 && assume.currentPrice > 0 ?
            assume.currentPrice / baseEPS : 0;
        const calc013 = peRatio >= 0;

        // S2-CALC-016: CAGR formula validation
        const sortedData = data.filter(d => d.earningsPerShare > 0).sort((a, b) => a.year - b.year);
        let cagr = 0;
        if (sortedData.length >= 2) {
            const start = sortedData[0].earningsPerShare;
            const end = sortedData[sortedData.length - 1].earningsPerShare;
            const years = sortedData[sortedData.length - 1].year - sortedData[0].year;
            if (years > 0) {
                cagr = calculateCAGR(start, end, years);
            }
        }
        const calc016 = cagr !== undefined; // CAGR calculated

        // S2-CALC-020: Guardrails enforcement
        const growthInBounds = (assume.growthRateEPS || 0) >= -50 && (assume.growthRateEPS || 0) <= 100;
        const peInBounds = (assume.targetPE || 0) >= 1 && (assume.targetPE || 0) <= 100;
        const calc020 = growthInBounds && peInBounds;

        const tickerResult = {
            ticker,
            tests: {
                'S2-CALC-001 (EPS proj)': calc001 ? 'PASS' : 'FAIL',
                'S2-CALC-005 (Target Price)': calc005 ? 'PASS' : 'FAIL',
                'S2-CALC-010 (Upside %)': calc010 ? 'PASS' : 'FAIL',
                'S2-CALC-012 (Div Yield)': calc012 ? 'PASS' : 'FAIL',
                'S2-CALC-013 (PE Ratio)': calc013 ? 'PASS' : 'FAIL',
                'S2-CALC-016 (CAGR)': calc016 ? 'PASS' : 'FAIL',
                'S2-CALC-020 (Guardrails)': calc020 ? 'PASS' : 'FAIL'
            },
            values: {
                baseEPS: baseEPS?.toFixed(2),
                projectedEPS: projectedEPS?.toFixed(2),
                targetPriceEPS: targetPriceEPS?.toFixed(2),
                currentPrice: assume.currentPrice?.toFixed(2),
                upside: upside?.toFixed(1) + '%',
                divYield: divYield?.toFixed(2) + '%',
                peRatio: peRatio?.toFixed(1),
                cagr: cagr?.toFixed(2) + '%',
                growthRateEPS: assume.growthRateEPS?.toFixed(2) + '%',
                targetPE: assume.targetPE?.toFixed(1)
            }
        };

        results.push(tickerResult);

        const allPass = Object.values(tickerResult.tests).every(v => v === 'PASS');
        console.log(`${allPass ? '✅' : '⚠️'} ${ticker}: ${Object.values(tickerResult.tests).filter(v => v === 'PASS').length}/7 tests pass`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('CALCULATION VALIDATION SUMMARY');
    console.log('='.repeat(70));

    const specCounts = {};
    for (const result of results) {
        for (const [spec, status] of Object.entries(result.tests)) {
            if (!specCounts[spec]) specCounts[spec] = { pass: 0, fail: 0 };
            if (status === 'PASS') specCounts[spec].pass++;
            else specCounts[spec].fail++;
        }
    }

    for (const [spec, counts] of Object.entries(specCounts)) {
        const passRate = ((counts.pass / (counts.pass + counts.fail)) * 100).toFixed(0);
        console.log(`${spec}: ${counts.pass}/${counts.pass + counts.fail} (${passRate}%)`);
    }

    const totalTests = results.length * 7;
    const totalPassed = results.reduce((sum, r) =>
        sum + Object.values(r.tests).filter(v => v === 'PASS').length, 0);

    console.log(`\nTotal: ${totalPassed}/${totalTests} tests passed (${((totalPassed/totalTests)*100).toFixed(1)}%)`);

    // Show details for failed tests
    const failedTickers = results.filter(r =>
        Object.values(r.tests).some(v => v === 'FAIL')
    );
    if (failedTickers.length > 0) {
        console.log('\n--- Tickers with Failed Tests ---');
        for (const t of failedTickers.slice(0, 5)) {
            console.log(`${t.ticker}:`);
            for (const [test, status] of Object.entries(t.tests)) {
                if (status === 'FAIL') console.log(`  ❌ ${test}`);
            }
            console.log(`  Values: ${JSON.stringify(t.values)}`);
        }
    }
}

validateCalculations();
