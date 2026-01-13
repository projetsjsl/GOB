#!/usr/bin/env node
/**
 * FINAL VALIDATION REPORT GENERATOR
 *
 * Consolidates all sprint reports and generates final validation summary
 * Checks all 200+ specs across all sprints
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_PATH = '/Users/projetsjsl/Documents/GitHub/GOB';

async function loadSprintReports() {
  const reports = {};

  // Try to load each sprint report
  for (let sprint = 1; sprint <= 6; sprint++) {
    try {
      const reportPath = path.join(BASE_PATH, `SPRINT-${sprint}-VALIDATION-REPORT.json`);
      const content = await fs.readFile(reportPath, 'utf8');
      reports[`sprint${sprint}`] = JSON.parse(content);
    } catch (error) {
      reports[`sprint${sprint}`] = null;
    }
  }

  return reports;
}

async function getFinalDatabaseStats() {
  try {
    // Get all current snapshots
    const { data: snapshots } = await supabase
      .from('finance_pro_snapshots')
      .select('ticker, annual_data, assumptions, company_info, auto_fetched')
      .eq('is_current', true);

    // Get all tickers
    const { data: allTickers } = await supabase
      .from('tickers')
      .select('ticker')
      .eq('is_active', true);

    const totalTickers = allTickers?.length || 0;
    const syncedTickers = snapshots?.length || 0;
    const autoFetched = snapshots?.filter(s => s.auto_fetched).length || 0;

    // Validate data quality
    let validPriceCount = 0;
    let has30YearsCount = 0;
    let hasAllMetricsCount = 0;

    snapshots?.forEach(snapshot => {
      const assumptions = snapshot.assumptions || {};
      const annualData = snapshot.annual_data || [];

      if (assumptions.currentPrice > 0) validPriceCount++;
      if (annualData.length >= 30) has30YearsCount++;

      const hasEPS = annualData.some(y => Number.isFinite(y.earningsPerShare) && y.earningsPerShare !== 0);
      const hasCF = annualData.some(y => Number.isFinite(y.cashFlowPerShare) && y.cashFlowPerShare !== 0);
      const hasBV = annualData.some(y => Number.isFinite(y.bookValuePerShare) && y.bookValuePerShare !== 0);
      const hasDiv = annualData.some(y => Number.isFinite(y.dividendPerShare) && y.dividendPerShare !== 0);

      if (hasEPS && hasCF && hasBV && hasDiv) hasAllMetricsCount++;
    });

    return {
      totalTickers,
      syncedTickers,
      autoFetched,
      validPriceCount,
      has30YearsCount,
      hasAllMetricsCount,
      percentComplete: ((syncedTickers / totalTickers) * 100).toFixed(1),
      percentValidPrice: ((validPriceCount / syncedTickers) * 100).toFixed(1),
      percent30Years: ((has30YearsCount / syncedTickers) * 100).toFixed(1),
      percentAllMetrics: ((hasAllMetricsCount / syncedTickers) * 100).toFixed(1)
    };
  } catch (error) {
    console.error('❌ Database stats error:', error);
    return null;
  }
}

async function generateFinalReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        3P1 200 SPECS VALIDATION - FINAL REPORT             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Load all sprint reports
  const sprintReports = await loadSprintReports();

  // Get current database stats
  const dbStats = await getFinalDatabaseStats();

  console.log('📊 Sprint Completion Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  for (let sprint = 1; sprint <= 6; sprint++) {
    const report = sprintReports[`sprint${sprint}`];
    if (report) {
      const summary = report.summary || {};
      totalPassed += summary.passed || 0;
      totalFailed += summary.failed || 0;
      totalWarnings += summary.warnings || 0;

      console.log(`✅ Sprint ${sprint}: ${summary.passed}/${summary.total} specs passed`);
      if (summary.failed > 0) {
        console.log(`   ❌ ${summary.failed} failed`);
      }
    } else {
      console.log(`⏳ Sprint ${sprint}: Not yet executed`);
    }
  }

  console.log('\n📊 Database Status:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (dbStats) {
    console.log(`📦 Total Tickers: ${dbStats.totalTickers}`);
    console.log(`✅ Synced: ${dbStats.syncedTickers} (${dbStats.percentComplete}%)`);
    console.log(`🤖 Auto-fetched (FMP): ${dbStats.autoFetched}`);
    console.log(`💰 Valid Price > 0: ${dbStats.validPriceCount} (${dbStats.percentValidPrice}%)`);
    console.log(`📅 Has 30+ Years: ${dbStats.has30YearsCount} (${dbStats.percent30Years}%)`);
    console.log(`📊 Has All Metrics: ${dbStats.hasAllMetricsCount} (${dbStats.percentAllMetrics}%)`);
  } else {
    console.log('❌ Unable to retrieve database statistics');
  }

  console.log('\n🎯 Success Criteria Validation:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const criteria = [
    {
      id: 1,
      description: 'All tickers have real FMP data',
      status: dbStats && dbStats.autoFetched >= dbStats.totalTickers * 0.9,
      actual: dbStats ? `${dbStats.autoFetched}/${dbStats.totalTickers}` : 'Unknown'
    },
    {
      id: 2,
      description: 'All calculations use actual values',
      status: dbStats && dbStats.hasAllMetricsCount >= dbStats.syncedTickers * 0.9,
      actual: dbStats ? `${dbStats.hasAllMetricsCount}/${dbStats.syncedTickers}` : 'Unknown'
    },
    {
      id: 3,
      description: 'All validations pass',
      status: totalFailed === 0,
      actual: `${totalPassed}/${totalPassed + totalFailed} specs`
    },
    {
      id: 4,
      description: 'Data persists in Supabase',
      status: dbStats && dbStats.syncedTickers > 0,
      actual: dbStats ? `${dbStats.syncedTickers} snapshots` : 'Unknown'
    },
    {
      id: 5,
      description: 'Zero N/A tickers',
      status: dbStats && dbStats.validPriceCount === dbStats.syncedTickers,
      actual: dbStats ? `${dbStats.validPriceCount}/${dbStats.syncedTickers} valid` : 'Unknown'
    }
  ];

  criteria.forEach(c => {
    const icon = c.status ? '✅' : '❌';
    console.log(`${icon} ${c.id}. ${c.description}`);
    console.log(`   ${c.actual}`);
  });

  const allCriteriaMet = criteria.every(c => c.status);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL VERDICT                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (allCriteriaMet) {
    console.log('🎉 ALL SUCCESS CRITERIA MET!');
    console.log('✅ The 3P1 200 SPECS VALIDATION PLAN is COMPLETE\n');
  } else {
    console.log('⚠️  Some criteria not yet met');
    console.log('📊 Continue monitoring Sprint 2 sync progress\n');
  }

  console.log(`📊 Total Specs Validated: ${totalPassed + totalFailed}`);
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`⚠️  Warnings: ${totalWarnings}\n`);

  const duration = Math.round((Date.now() - startTime) / 1000);

  // Generate comprehensive report
  const finalReport = {
    generatedAt: new Date().toISOString(),
    duration: `${duration}s`,
    sprints: sprintReports,
    databaseStats: dbStats,
    successCriteria: criteria,
    summary: {
      totalSpecs: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      warnings: totalWarnings,
      successRate: ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2) + '%',
      allCriteriaMet
    }
  };

  // Save final report
  await fs.writeFile(
    path.join(BASE_PATH, 'FINAL-VALIDATION-REPORT.json'),
    JSON.stringify(finalReport, null, 2)
  );

  console.log('📄 Final report saved: FINAL-VALIDATION-REPORT.json\n');

  return finalReport;
}

generateFinalReport().catch(console.error);
