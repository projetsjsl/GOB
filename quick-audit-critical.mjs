/**
 * AUDIT RAPIDE - Problèmes Critiques
 * 
 * Test rapide des problèmes critiques identifiés dans la console
 * - CDN Tailwind (vient d'iframes externes - non contrôlable)
 * - Babel warnings (intentionnels)
 * - Erreurs réseau critiques
 * - Problèmes UI bloquants
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = 'https://gob-epxskpx71-projetsjsls-projects.vercel.app';
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'bug-screenshots', `quick-audit-${Date.now()}`);

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const criticalIssues = {
  errors: [],
  warnings: [],
  networkErrors: [],
  uiIssues: [],
  screenshots: [],
};

// Onglets critiques à tester rapidement
const CRITICAL_TABS = [
  'marches-global',
  'nouvelles-main',
  'titres-portfolio',
  'jlab-terminal',
  'emma-chat',
  'admin-jsla',
];

async function testCriticalTab(page, tabId) {
  const url = `${BASE_URL}/beta-combined-dashboard.html?tab=${tabId}`;
  console.log(`\n🔍 Test: ${tabId}`);
  console.log(`URL: ${url}`);

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) {
      // Ignorer CDN Tailwind depuis iframes (non contrôlable)
      if (!text.includes('cdn.tailwindcss.com')) {
        errors.push(text);
      }
    } else if (msg.type() === 'warning') {
      // Ignorer warnings Babel intentionnels
      if (!text.includes('Babel transformer') && !text.includes('cdn.tailwindcss.com')) {
        warnings.push(text);
      }
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `${tabId}-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    criticalIssues.screenshots.push({ tab: tabId, path: screenshotPath });

    // Vérifier UI
    const uiIssues = await page.evaluate(() => {
      const issues = [];
      const buttons = document.querySelectorAll('button, [role="button"]');
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          issues.push(`Bouton invisible: ${btn.textContent?.substring(0, 30)}`);
        }
      });
      return issues;
    });

    criticalIssues.errors.push(...errors.map(e => ({ tab: tabId, error: e })));
    criticalIssues.warnings.push(...warnings.map(w => ({ tab: tabId, warning: w })));
    criticalIssues.uiIssues.push(...uiIssues.map(u => ({ tab: tabId, issue: u })));

    console.log(`✅ ${tabId}: ${errors.length} erreurs, ${warnings.length} warnings, ${uiIssues.length} UI issues`);
    return true;
  } catch (error) {
    console.error(`❌ ${tabId}: ${error.message}`);
    criticalIssues.errors.push({ tab: tabId, error: error.message });
    return false;
  }
}

async function main() {
  console.log('🚀 AUDIT RAPIDE - Problèmes Critiques\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  try {
    for (const tabId of CRITICAL_TABS) {
      await testCriticalTab(page, tabId);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } finally {
    await browser.close();
  }

  // Générer rapport
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalErrors: criticalIssues.errors.length,
      totalWarnings: criticalIssues.warnings.length,
      totalUIIssues: criticalIssues.uiIssues.length,
      totalScreenshots: criticalIssues.screenshots.length,
    },
    ...criticalIssues,
  };

  const reportPath = path.join(PROJECT_ROOT, `RAPPORT-AUDIT-RAPIDE-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Audit rapide terminé`);
  console.log(`📊 Rapport: ${reportPath}`);
  console.log(`❌ Erreurs: ${report.summary.totalErrors}`);
  console.log(`⚠️  Warnings: ${report.summary.totalWarnings}`);
  console.log(`🖱️  UI Issues: ${report.summary.totalUIIssues}`);

  return report;
}

main().catch(console.error);
