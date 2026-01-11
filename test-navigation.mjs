/**
 * Test de navigation exhaustif avec Playwright
 * Capture toutes les erreurs console et réseau
 */
import { chromium } from 'playwright';

const BASE_URL = 'https://gob-4knmhj42s-projetsjsls-projects.vercel.app';

const errors = [];
const warnings = [];
const networkErrors = [];

async function testPage(page, url, name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`URL: ${url}`);
    console.log('='.repeat(60));

    const pageErrors = [];
    const pageWarnings = [];

    // Capture console messages
    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) {
            pageErrors.push({ page: name, message: text });
            console.log(`❌ ERROR: ${text.substring(0, 200)}`);
        } else if (msg.type() === 'warning' && text.includes('Error')) {
            pageWarnings.push({ page: name, message: text });
        }
    });

    // Capture page errors
    page.on('pageerror', error => {
        pageErrors.push({ page: name, message: error.message });
        console.log(`❌ PAGE ERROR: ${error.message.substring(0, 200)}`);
    });

    // Capture failed requests (excluding images and fonts)
    page.on('requestfailed', request => {
        const url = request.url();
        if (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.woff') && !url.includes('favicon')) {
            networkErrors.push({ page: name, url, error: request.failure()?.errorText });
            console.log(`❌ NETWORK: ${url.substring(0, 100)} - ${request.failure()?.errorText}`);
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);
        console.log(`✅ Page loaded: ${name}`);
    } catch (e) {
        console.log(`⚠️ Timeout/Error loading ${name}: ${e.message.substring(0, 100)}`);
    }

    errors.push(...pageErrors);
    warnings.push(...pageWarnings);

    return pageErrors.length === 0;
}

async function testDashboardTabs(page) {
    console.log('\n📋 Testing Dashboard Tabs...');

    const tabs = [
        { name: 'JLab', selector: '[data-tab="jlab"], button:has-text("JLab")' },
        { name: 'Emma', selector: '[data-tab="emma"], button:has-text("Emma")' },
        { name: 'Titres', selector: '[data-tab="titres"], button:has-text("Titres")' },
        { name: 'Nouvelles', selector: '[data-tab="nouvelles"], button:has-text("Nouvelles")' },
        { name: 'Calendrier', selector: '[data-tab="calendrier"], button:has-text("Calendrier")' },
        { name: 'Admin', selector: '[data-tab="admin"], button:has-text("Admin")' },
    ];

    for (const tab of tabs) {
        try {
            const tabButton = page.locator(tab.selector).first();
            if (await tabButton.isVisible({ timeout: 2000 })) {
                await tabButton.click();
                await page.waitForTimeout(2000);
                console.log(`  ✅ Tab ${tab.name} clicked`);
            } else {
                console.log(`  ⚠️ Tab ${tab.name} not found`);
            }
        } catch (e) {
            console.log(`  ❌ Tab ${tab.name} error: ${e.message.substring(0, 50)}`);
        }
    }
}

async function main() {
    console.log('🚀 Starting comprehensive navigation test...\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    // Set localStorage for admin access
    await context.addInitScript(() => {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('userEmail', 'test@test.com');
    });

    const page = await context.newPage();

    // Test pages
    await testPage(page, `${BASE_URL}/login.html`, 'Login Page');
    await testPage(page, `${BASE_URL}/beta-combined-dashboard.html`, 'Beta Dashboard');
    await testDashboardTabs(page);

    await testPage(page, `${BASE_URL}/3p1/`, '3p1 App');
    await page.waitForTimeout(5000); // Wait for 3p1 to load data

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Errors: ${errors.length}`);
    console.log(`Total Network Failures: ${networkErrors.length}`);

    if (errors.length > 0) {
        console.log('\n❌ ERRORS FOUND:');
        errors.forEach((e, i) => {
            console.log(`${i + 1}. [${e.page}] ${e.message.substring(0, 150)}`);
        });
    }

    if (networkErrors.length > 0) {
        console.log('\n🌐 NETWORK ERRORS (excluding images):');
        networkErrors.forEach((e, i) => {
            console.log(`${i + 1}. [${e.page}] ${e.url.substring(0, 80)}`);
        });
    }

    await browser.close();

    // Exit with error code if errors found
    process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
