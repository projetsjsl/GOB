/**
 * 🧪 TEST ALL SUB-TABS
 * Teste tous les sous-onglets pour éviter les freezes
 * Prend des screenshots pour vérifier qu'ils fonctionnent tous
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://gob-4knmhj42s-projetsjsls-projects.vercel.app';
const SCREENSHOT_DIR = path.join(process.cwd(), 'bug-screenshots');
const TIMEOUT_MS = 8000; // 8 secondes max par action

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const testResults = {
    startTime: new Date().toISOString(),
    tests: [],
    errors: [],
    screenshots: []
};

// Liste de tous les onglets principaux et leurs sous-onglets
const MAIN_TABS_WITH_SUBTABS = [
    {
        main: 'nouvelles',
        mainLabel: '📰 Nouvelles',
        subTabs: [
            { id: 'nouvelles-all', label: 'Toutes', selector: 'button:has-text("Toutes"), [data-subtab="nouvelles-all"]' },
            { id: 'nouvelles-french', label: 'Français', selector: 'button:has-text("Français"), [data-subtab="nouvelles-french"]' },
            { id: 'nouvelles-by-source', label: 'Par Source', selector: 'button:has-text("Par Source"), [data-subtab="nouvelles-by-source"]' },
            { id: 'nouvelles-by-market', label: 'Par Marché', selector: 'button:has-text("Par Marché"), [data-subtab="nouvelles-by-market"]' },
            { id: 'nouvelles-ground', label: 'Ground News', selector: 'button:has-text("Ground News"), [data-subtab="nouvelles-ground"]' }
        ]
    },
    {
        main: 'stocks-news',
        mainLabel: '📊 Stocks & News',
        subTabs: [
            { id: 'portfolio', label: 'Portfolio', selector: 'button:has-text("Portfolio"), [data-view="portfolio"]' },
            { id: 'watchlist', label: 'Watchlist', selector: 'button:has-text("Watchlist"), [data-view="watchlist"]' },
            { id: 'table', label: 'Table', selector: 'button:has-text("Table"), [data-view="table"]' }
        ]
    },
    {
        main: 'finance-pro',
        mainLabel: '💹 Finance Pro',
        subTabs: [
            { id: 'portfolio', label: 'Portfolio', selector: 'button:has-text("Portfolio"), [data-view="portfolio"]' },
            { id: 'analysis', label: 'Analysis', selector: 'button:has-text("Analysis"), [data-view="analysis"]' },
            { id: 'screener', label: 'Screener', selector: 'button:has-text("Screener"), [data-view="screener"]' },
            { id: 'compare', label: 'Compare', selector: 'button:has-text("Compare"), [data-view="compare"]' }
        ]
    }
];

function getScreenshotPath(name) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    return path.join(SCREENSHOT_DIR, filename);
}

async function testSubTab(page, mainTab, subTab) {
    console.log(`\n  📑 Testing sub-tab: ${subTab.label} (${subTab.id})`);
    
    const testResult = {
        mainTab: mainTab.main,
        subTab: subTab.id,
        label: subTab.label,
        success: false,
        error: null,
        screenshot: null,
        freezeDetected: false
    };

    try {
        // Try to find and click the sub-tab
        let subTabElement = null;
        const selectors = subTab.selector.split(',').map(s => s.trim());
        
        for (const selector of selectors) {
            try {
                subTabElement = await page.locator(selector).first();
                if (await subTabElement.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!subTabElement || !(await subTabElement.isVisible({ timeout: 2000 }).catch(() => false))) {
            testResult.error = `Sub-tab not found: ${subTab.label}`;
            testResults.errors.push(testResult);
            return testResult;
        }

        // Click sub-tab
        await subTabElement.click({ timeout: TIMEOUT_MS });
        await page.waitForTimeout(2000); // Wait for content to load

        // Check for freeze (loading spinner that never finishes)
        const loadingSpinners = await page.locator('.animate-spin, .loading, [class*="spinner"]').count();
        if (loadingSpinners > 0) {
            await page.waitForTimeout(3000); // Wait a bit more
            const stillLoading = await page.locator('.animate-spin, .loading, [class*="spinner"]').count();
            if (stillLoading > 0) {
                testResult.freezeDetected = true;
                testResult.error = 'Loading state persists (possible freeze)';
            }
        }

        // Take screenshot
        const screenshotPath = getScreenshotPath(`subtab-${mainTab.main}-${subTab.id}`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testResult.screenshot = screenshotPath;
        testResults.screenshots.push(screenshotPath);

        // Check for error messages
        const errorMessages = await page.locator('.error, .alert-error, [class*="error"], [role="alert"]').count();
        if (errorMessages > 0) {
            const errorTexts = [];
            for (let i = 0; i < errorMessages; i++) {
                const text = await page.locator('.error, .alert-error, [class*="error"], [role="alert"]').nth(i).textContent().catch(() => '');
                if (text) errorTexts.push(text);
            }
            testResult.error = `Error messages found: ${errorTexts.join('; ')}`;
        }

        // Check for empty content
        const mainContent = await page.locator('main, [role="main"], .content, .main-content').first();
        if (mainContent) {
            const contentText = await mainContent.textContent().catch(() => '');
            if (contentText.trim().length < 50 && !contentText.includes('Loading') && !contentText.includes('Chargement')) {
                testResult.error = `Empty content detected (${contentText.length} chars)`;
            }
        }

        testResult.success = !testResult.error && !testResult.freezeDetected;
        
        if (testResult.success) {
            console.log(`  ✅ Sub-tab ${subTab.label} OK`);
        } else {
            console.log(`  ❌ Sub-tab ${subTab.label} FAILED: ${testResult.error}`);
        }

    } catch (error) {
        testResult.error = error.message;
        const screenshotPath = getScreenshotPath(`subtab-error-${mainTab.main}-${subTab.id}`);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        testResult.screenshot = screenshotPath;
        console.log(`  ❌ Sub-tab ${subTab.label} ERROR: ${error.message}`);
    }

    testResults.tests.push(testResult);
    return testResult;
}

async function testMainTab(page, mainTab) {
    console.log(`\n📋 Testing main tab: ${mainTab.mainLabel} (${mainTab.main})`);
    
    // Navigate to main tab
    const mainTabSelectors = [
        `button:has-text("${mainTab.mainLabel}")`,
        `[data-tab="${mainTab.main}"]`,
        `button:has-text("${mainTab.main}")`
    ];

    let mainTabElement = null;
    for (const selector of mainTabSelectors) {
        try {
            mainTabElement = await page.locator(selector).first();
            if (await mainTabElement.isVisible({ timeout: 2000 })) {
                break;
            }
        } catch (e) {
            continue;
        }
    }

    if (!mainTabElement || !(await mainTabElement.isVisible({ timeout: 2000 }).catch(() => false))) {
        console.log(`  ⚠️ Main tab ${mainTab.main} not found, skipping...`);
        return false;
    }

    // Click main tab
    await mainTabElement.click({ timeout: TIMEOUT_MS });
    await page.waitForTimeout(3000); // Wait for main tab to load

    // Take screenshot of main tab
    const mainScreenshotPath = getScreenshotPath(`main-${mainTab.main}`);
    await page.screenshot({ path: mainScreenshotPath, fullPage: true });
    testResults.screenshots.push(mainScreenshotPath);

    // Test all sub-tabs
    for (const subTab of mainTab.subTabs) {
        await testSubTab(page, mainTab, subTab);
        await page.waitForTimeout(1000); // Small delay between sub-tabs
    }

    return true;
}

async function main() {
    console.log('🧪 TEST ALL SUB-TABS');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Screenshot dir: ${SCREENSHOT_DIR}`);
    console.log('='.repeat(60));

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    await context.addInitScript(() => {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('userEmail', 'test@test.com');
    });

    const page = await context.newPage();

    try {
        // Navigate to dashboard
        console.log('\n🌐 Navigating to dashboard...');
        await page.goto(`${BASE_URL}/beta-combined-dashboard.html`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(5000); // Wait for initial load

        // Test each main tab and its sub-tabs
        for (const mainTab of MAIN_TABS_WITH_SUBTABS) {
            await testMainTab(page, mainTab);
            await page.waitForTimeout(2000); // Delay between main tabs
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
        testResults.errors.push({ type: 'fatal', message: error.message });
    } finally {
        await browser.close();
    }

    // Generate report
    testResults.endTime = new Date().toISOString();
    const successCount = testResults.tests.filter(t => t.success).length;
    const failCount = testResults.tests.filter(t => !t.success).length;
    const freezeCount = testResults.tests.filter(t => t.freezeDetected).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests: ${testResults.tests.length}`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`🧊 Freezes detected: ${freezeCount}`);
    console.log(`📸 Screenshots: ${testResults.screenshots.length}`);

    if (testResults.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        testResults.errors.forEach((e, i) => {
            console.log(`${i + 1}. ${e.error || e.message}`);
        });
    }

    // Save report
    const reportPath = path.join(process.cwd(), `SUB-TABS-TEST-REPORT-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Report saved: ${reportPath}`);

    process.exit(failCount > 0 || freezeCount > 0 ? 1 : 0);
}

main().catch(console.error);
