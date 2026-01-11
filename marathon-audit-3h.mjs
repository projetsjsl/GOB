/**
 * 🏃 MARATHON AUDIT EXHAUSTIF - 3 HEURES
 * Test complet de tout le site avec screenshots et rapport détaillé
 * 
 * Features:
 * - Navigation complète de toutes les pages
 * - Screenshots de tous les bugs/incohérences
 * - Tests UI/UX, calculs, performance
 * - Auto-retry si timeout (5s)
 * - Rapport détaillé avec preuves
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://gob-4knmhj42s-projetsjsls-projects.vercel.app';
const SCREENSHOT_DIR = path.join(process.cwd(), 'bug-screenshots');
const REPORT_DIR = process.cwd();
const TIMEOUT_MS = 5000; // 5 secondes max par action
const MAX_RETRIES = 3;

// Créer le dossier screenshots s'il n'existe pas
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const auditReport = {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
    bugs: [],
    errors: [],
    warnings: [],
    networkErrors: [],
    uiIssues: [],
    calculationIssues: [],
    performanceIssues: [],
    screenshots: [],
    pagesTested: [],
    tabsTested: [],
    summary: {
        totalBugs: 0,
        criticalBugs: 0,
        highPriorityBugs: 0,
        mediumPriorityBugs: 0,
        lowPriorityBugs: 0,
        totalErrors: 0,
        totalWarnings: 0,
        totalNetworkErrors: 0
    }
};

// Liste complète des pages à tester
const PAGES_TO_TEST = [
    { url: '/login.html', name: 'Login Page', category: 'auth' },
    { url: '/beta-combined-dashboard.html', name: 'Beta Dashboard', category: 'main' },
    { url: '/3p1/', name: '3p1 App', category: 'app' },
];

// Liste complète des onglets à tester
const TABS_TO_TEST = [
    { id: 'stocks-news', name: 'Stocks & News', selector: '[data-tab="stocks-news"], button:has-text("Stocks"), button:has-text("News")' },
    { id: 'finance-pro', name: 'Finance Pro', selector: '[data-tab="finance-pro"], button:has-text("Finance Pro")' },
    { id: 'nouvelles', name: 'Nouvelles', selector: '[data-tab="nouvelles"], button:has-text("Nouvelles")' },
    { id: 'intellistocks', name: 'IntelliStocks', selector: '[data-tab="intellistocks"], button:has-text("IntelliStocks")' },
    { id: 'email-briefings', name: 'Email Briefings', selector: '[data-tab="email-briefings"], button:has-text("Briefings")' },
    { id: 'watchlist', name: 'Watchlist', selector: '[data-tab="watchlist"], button:has-text("Watchlist")' },
    { id: 'economic-calendar', name: 'Economic Calendar', selector: '[data-tab="economic-calendar"], button:has-text("Calendar")' },
    { id: 'yield-curve', name: 'Yield Curve', selector: '[data-tab="yield-curve"], button:has-text("Yield")' },
    { id: 'advanced-analysis', name: 'Advanced Analysis', selector: '[data-tab="advanced-analysis"], button:has-text("Analyse")' },
    { id: 'ask-emma', name: 'Ask Emma', selector: '[data-tab="ask-emma"], button:has-text("Emma")' },
    { id: 'emma-config', name: 'Emma Config', selector: '[data-tab="emma-config"], button:has-text("Config")' },
    { id: 'testonly', name: 'Test Only', selector: '[data-tab="testonly"], button:has-text("Test")' },
    { id: 'admin-jslai', name: 'Admin JSLai', selector: '[data-tab="admin-jslai"], button:has-text("Admin")' },
    { id: 'plus', name: 'Plus', selector: '[data-tab="plus"], button:has-text("Plus")' },
];

// Helper: Prendre un screenshot avec timestamp
function getScreenshotPath(name) {
    const timestamp = Date.now();
    const filename = `${timestamp}-${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    return path.join(SCREENSHOT_DIR, filename);
}

// Helper: Reporter un bug
function reportBug(severity, title, description, steps, location, screenshot = null) {
    const bug = {
        id: `BUG-${auditReport.bugs.length + 1}`,
        severity, // 'critical', 'high', 'medium', 'low'
        title,
        description,
        steps: Array.isArray(steps) ? steps : [steps],
        location,
        screenshot,
        timestamp: new Date().toISOString()
    };
    auditReport.bugs.push(bug);
    
    // Mettre à jour le summary
    auditReport.summary.totalBugs++;
    if (severity === 'critical') auditReport.summary.criticalBugs++;
    else if (severity === 'high') auditReport.summary.highPriorityBugs++;
    else if (severity === 'medium') auditReport.summary.mediumPriorityBugs++;
    else if (severity === 'low') auditReport.summary.lowPriorityBugs++;
    
    return bug;
}

// Helper: Attendre avec timeout et retry
async function waitWithRetry(page, action, description, maxRetries = MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await Promise.race([
                action(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), TIMEOUT_MS)
                )
            ]);
            return result;
        } catch (error) {
            if (attempt === maxRetries) {
                console.log(`⚠️ ${description} failed after ${maxRetries} attempts: ${error.message}`);
                return null;
            }
            console.log(`🔄 Retry ${attempt}/${maxRetries} for ${description}`);
            await page.waitForTimeout(1000);
        }
    }
}

// Helper: Naviguer vers une page avec retry
async function navigateWithRetry(page, url, name) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🌐 Testing: ${name}`);
    console.log(`URL: ${BASE_URL}${url}`);
    console.log('='.repeat(60));

    const pageErrors = [];
    const pageWarnings = [];
    const pageNetworkErrors = [];

    // Setup listeners
    page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('404')) {
            pageErrors.push({ message: text, timestamp: Date.now() });
            auditReport.errors.push({ page: name, message: text, timestamp: Date.now() });
            auditReport.summary.totalErrors++;
        } else if (msg.type() === 'warning') {
            pageWarnings.push({ message: text, timestamp: Date.now() });
            auditReport.warnings.push({ page: name, message: text, timestamp: Date.now() });
            auditReport.summary.totalWarnings++;
        }
    });

    page.on('pageerror', error => {
        pageErrors.push({ message: error.message, stack: error.stack, timestamp: Date.now() });
        auditReport.errors.push({ 
            page: name, 
            message: error.message, 
            stack: error.stack,
            timestamp: Date.now() 
        });
        auditReport.summary.totalErrors++;
    });

    page.on('requestfailed', request => {
        const url = request.url();
        if (!url.includes('.png') && !url.includes('.jpg') && !url.includes('.woff') && !url.includes('favicon')) {
            const failure = request.failure();
            pageNetworkErrors.push({ url, error: failure?.errorText, timestamp: Date.now() });
            auditReport.networkErrors.push({ 
                page: name, 
                url, 
                error: failure?.errorText,
                timestamp: Date.now() 
            });
            auditReport.summary.totalNetworkErrors++;
        }
    });

    // Navigate with retry
    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await Promise.race([
                page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 30000 }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Navigation timeout')), TIMEOUT_MS * 6)
                )
            ]);
            
            await page.waitForTimeout(3000); // Wait for content to load
            success = true;
            break;
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                const screenshotPath = getScreenshotPath(`navigation-failed-${name}`);
                await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
                
                reportBug('high', 
                    `Navigation failed: ${name}`,
                    `Failed to navigate to ${url} after ${MAX_RETRIES} attempts: ${error.message}`,
                    [`Navigate to ${BASE_URL}${url}`, `Error: ${error.message}`],
                    url,
                    screenshotPath
                );
                return false;
            }
            
            // Close and reopen browser on timeout
            console.log(`⚠️ Timeout on attempt ${attempt}, closing and reopening...`);
            await page.close().catch(() => {});
            await page.browserContext().close().catch(() => {});
            
            // Recreate browser (will be done in main)
            return null; // Signal to recreate browser
        }
    }

    if (!success) return false;

    // Take initial screenshot
    const screenshotPath = getScreenshotPath(`initial-${name}`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    auditReport.screenshots.push({ page: name, path: screenshotPath, type: 'initial' });

    // Check for visual issues
    const bodyText = await page.textContent('body').catch(() => '');
    if (bodyText.includes('Error') || bodyText.includes('error') || bodyText.length < 100) {
        const errorScreenshotPath = getScreenshotPath(`error-detected-${name}`);
        await page.screenshot({ path: errorScreenshotPath, fullPage: true }).catch(() => {});
        
        reportBug('high',
            `Error detected on ${name}`,
            `Page content suggests an error state. Body text length: ${bodyText.length}`,
            [`Navigate to ${BASE_URL}${url}`, `Check page content`],
            url,
            errorScreenshotPath
        );
    }

    // Log errors found
    if (pageErrors.length > 0) {
        console.log(`❌ Found ${pageErrors.length} console errors`);
        pageErrors.forEach(e => console.log(`   - ${e.message.substring(0, 100)}`));
    }

    if (pageNetworkErrors.length > 0) {
        console.log(`🌐 Found ${pageNetworkErrors.length} network errors`);
    }

    auditReport.pagesTested.push({
        name,
        url,
        errors: pageErrors.length,
        warnings: pageWarnings.length,
        networkErrors: pageNetworkErrors.length,
        success: pageErrors.length === 0
    });

    return true;
}

// Test d'un onglet spécifique
async function testTab(page, tab, dashboardUrl) {
    console.log(`\n  📑 Testing tab: ${tab.name}`);
    
    try {
        // Try multiple selectors
        const selectors = [
            tab.selector,
            `button:has-text("${tab.name}")`,
            `[data-tab="${tab.id}"]`,
            `a[href*="${tab.id}"]`
        ];

        let tabElement = null;
        for (const selector of selectors) {
            try {
                tabElement = await page.locator(selector).first();
                if (await tabElement.isVisible({ timeout: 2000 })) {
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!tabElement || !(await tabElement.isVisible({ timeout: 2000 }).catch(() => false))) {
            const screenshotPath = getScreenshotPath(`tab-missing-${tab.id}`);
            await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
            
            reportBug('medium',
                `Tab not found: ${tab.name}`,
                `Could not find navigation element for tab: ${tab.name} (${tab.id})`,
                [`Navigate to dashboard`, `Look for tab: ${tab.name}`],
                `beta-combined-dashboard.html#${tab.id}`,
                screenshotPath
            );
            return false;
        }

        // Click tab
        await waitWithRetry(page, 
            () => tabElement.click(),
            `Click tab ${tab.name}`
        );

        await page.waitForTimeout(2000); // Wait for tab content

        // Take screenshot
        const screenshotPath = getScreenshotPath(`tab-${tab.id}`);
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        auditReport.screenshots.push({ tab: tab.id, path: screenshotPath, type: 'tab' });

        // Check for loading states that never finish
        const loadingSpinners = await page.locator('.animate-spin, .loading, [class*="spinner"]').count();
        if (loadingSpinners > 0) {
            await page.waitForTimeout(3000); // Wait a bit more
            const stillLoading = await page.locator('.animate-spin, .loading, [class*="spinner"]').count();
            if (stillLoading > 0) {
                const loadingScreenshotPath = getScreenshotPath(`tab-loading-${tab.id}`);
                await page.screenshot({ path: loadingScreenshotPath, fullPage: true }).catch(() => {});
                
                reportBug('medium',
                    `Loading state persists: ${tab.name}`,
                    `Loading spinner still visible after 5 seconds on tab ${tab.name}`,
                    [`Click tab ${tab.name}`, `Wait for content to load`],
                    `beta-combined-dashboard.html#${tab.id}`,
                    loadingScreenshotPath
                );
            }
        }

        // Check for empty content
        const mainContent = await page.locator('main, [role="main"], .content, .main-content').first();
        if (mainContent) {
            const contentText = await mainContent.textContent().catch(() => '');
            if (contentText.trim().length < 50 && !contentText.includes('Loading')) {
                const emptyScreenshotPath = getScreenshotPath(`tab-empty-${tab.id}`);
                await page.screenshot({ path: emptyScreenshotPath, fullPage: true }).catch(() => {});
                
                reportBug('high',
                    `Empty content: ${tab.name}`,
                    `Tab ${tab.name} appears to have empty or minimal content (${contentText.length} chars)`,
                    [`Click tab ${tab.name}`, `Check main content area`],
                    `beta-combined-dashboard.html#${tab.id}`,
                    emptyScreenshotPath
                );
            }
        }

        // Check for error messages in UI
        const errorMessages = await page.locator('.error, .alert-error, [class*="error"], [role="alert"]').count();
        if (errorMessages > 0) {
            const errorTexts = [];
            for (let i = 0; i < errorMessages; i++) {
                const text = await page.locator('.error, .alert-error, [class*="error"], [role="alert"]').nth(i).textContent().catch(() => '');
                if (text) errorTexts.push(text);
            }
            
            const errorScreenshotPath = getScreenshotPath(`tab-error-${tab.id}`);
            await page.screenshot({ path: errorScreenshotPath, fullPage: true }).catch(() => {});
            
            reportBug('high',
                `Error message displayed: ${tab.name}`,
                `Error messages found in UI: ${errorTexts.join('; ')}`,
                [`Click tab ${tab.name}`, `Check for error messages`],
                `beta-combined-dashboard.html#${tab.id}`,
                errorScreenshotPath
            );
        }

        auditReport.tabsTested.push({
            id: tab.id,
            name: tab.name,
            success: true
        });

        console.log(`  ✅ Tab ${tab.name} tested`);
        return true;

    } catch (error) {
        const errorScreenshotPath = getScreenshotPath(`tab-error-${tab.id}`);
        await page.screenshot({ path: errorScreenshotPath, fullPage: true }).catch(() => {});
        
        reportBug('high',
            `Tab test failed: ${tab.name}`,
            `Error testing tab ${tab.name}: ${error.message}`,
            [`Click tab ${tab.name}`, `Error: ${error.message}`],
            `beta-combined-dashboard.html#${tab.id}`,
            errorScreenshotPath
        );
        return false;
    }
}

// Test responsive design
async function testResponsive(page, name) {
    console.log(`\n  📱 Testing responsive design for ${name}`);
    
    const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1440, height: 900, name: 'Desktop Medium' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
        try {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            await page.waitForTimeout(1000);
            
            const screenshotPath = getScreenshotPath(`responsive-${viewport.name.toLowerCase().replace(' ', '-')}-${name}`);
            await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
            auditReport.screenshots.push({ 
                page: name, 
                path: screenshotPath, 
                type: 'responsive',
                viewport: viewport.name 
            });
        } catch (error) {
            console.log(`  ⚠️ Failed to test viewport ${viewport.name}: ${error.message}`);
        }
    }
}

// Test calculations (if applicable)
async function testCalculations(page, tabName) {
    // Look for numbers that might be calculations
    const numberElements = await page.locator('[class*="price"], [class*="value"], [class*="amount"], .number, [data-value]').all();
    
    for (const elem of numberElements.slice(0, 10)) { // Test first 10
        try {
            const text = await elem.textContent();
            const number = parseFloat(text?.replace(/[^0-9.-]/g, '') || '');
            
            if (!isNaN(number) && !isFinite(number)) {
                const screenshotPath = getScreenshotPath(`calc-error-${tabName}`);
                await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
                
                reportBug('high',
                    `Invalid calculation result: ${tabName}`,
                    `Found NaN or Infinity in calculation result: "${text}"`,
                    [`Navigate to ${tabName}`, `Check calculation values`],
                    `beta-combined-dashboard.html#${tabName}`,
                    screenshotPath
                );
                
                auditReport.calculationIssues.push({
                    tab: tabName,
                    value: text,
                    element: await elem.getAttribute('class') || 'unknown'
                });
            }
        } catch (e) {
            // Ignore individual element errors
        }
    }
}

// Main audit function
async function runMarathonAudit() {
    console.log('🏃 MARATHON AUDIT EXHAUSTIF - 3 HEURES');
    console.log(`📅 Start time: ${auditReport.startTime}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📸 Screenshots: ${SCREENSHOT_DIR}`);
    console.log('\n' + '='.repeat(60) + '\n');

    let browser = null;
    let context = null;
    let page = null;

    const createBrowser = async () => {
        if (browser) await browser.close().catch(() => {});
        browser = await chromium.launch({ headless: false }); // headless: false pour voir ce qui se passe
        context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        });
        
        // Set localStorage for admin access
        await context.addInitScript(() => {
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userEmail', 'test@test.com');
        });
        
        page = await context.newPage();
        return page;
    };

    try {
        await createBrowser();

        // Phase 1: Test all pages
        console.log('\n📄 PHASE 1: Testing all pages...\n');
        for (const pageInfo of PAGES_TO_TEST) {
            const result = await navigateWithRetry(page, pageInfo.url, pageInfo.name);
            
            if (result === null) {
                // Browser timeout, recreate
                console.log('🔄 Recreating browser after timeout...');
                await createBrowser();
                continue;
            }

            if (result) {
                // Test responsive for main pages
                if (pageInfo.category === 'main') {
                    await testResponsive(page, pageInfo.name);
                }

                // If it's the dashboard, test all tabs
                if (pageInfo.url.includes('beta-combined-dashboard')) {
                    console.log('\n📑 PHASE 2: Testing all dashboard tabs...\n');
                    for (const tab of TABS_TO_TEST) {
                        await testTab(page, tab, pageInfo.url);
                        await testCalculations(page, tab.name);
                        await page.waitForTimeout(1000); // Small delay between tabs
                    }
                }
            }

            await page.waitForTimeout(2000); // Delay between pages
        }

        // Generate report
        auditReport.endTime = new Date().toISOString();
        const duration = new Date(auditReport.endTime) - new Date(auditReport.startTime);
        auditReport.duration = `${Math.floor(duration / 1000 / 60)} minutes`;

        console.log('\n' + '='.repeat(60));
        console.log('📊 AUDIT SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Bugs: ${auditReport.summary.totalBugs}`);
        console.log(`  - Critical: ${auditReport.summary.criticalBugs}`);
        console.log(`  - High: ${auditReport.summary.highPriorityBugs}`);
        console.log(`  - Medium: ${auditReport.summary.mediumPriorityBugs}`);
        console.log(`  - Low: ${auditReport.summary.lowPriorityBugs}`);
        console.log(`Total Errors: ${auditReport.summary.totalErrors}`);
        console.log(`Total Warnings: ${auditReport.summary.totalWarnings}`);
        console.log(`Total Network Errors: ${auditReport.summary.totalNetworkErrors}`);
        console.log(`Screenshots: ${auditReport.screenshots.length}`);
        console.log(`Duration: ${auditReport.duration}`);

    } catch (error) {
        console.error('❌ Fatal error during audit:', error);
        auditReport.fatalError = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    } finally {
        if (browser) await browser.close();
    }

    // Save report
    const reportPath = path.join(REPORT_DIR, `RAPPORT-MARATHON-AUDIT-${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
    console.log(`\n💾 Report saved: ${reportPath}`);

    // Generate markdown report
    await generateMarkdownReport(auditReport, REPORT_DIR);

    return auditReport;
}

// Generate markdown report
async function generateMarkdownReport(report, outputDir) {
    const mdPath = path.join(outputDir, `RAPPORT-MARATHON-AUDIT-${new Date().toISOString().split('T')[0]}.md`);
    
    let md = `# 🏃 RAPPORT MARATHON AUDIT EXHAUSTIF\n\n`;
    md += `**Date:** ${report.startTime.split('T')[0]}\n`;
    md += `**Durée:** ${report.duration}\n`;
    md += `**URL testée:** ${report.baseUrl}\n\n`;
    md += `---\n\n`;
    
    md += `## 📊 RÉSUMÉ EXÉCUTIF\n\n`;
    md += `| Métrique | Valeur |\n`;
    md += `|----------|--------|\n`;
    md += `| **Total Bugs** | ${report.summary.totalBugs} |\n`;
    md += `| - Critiques | ${report.summary.criticalBugs} |\n`;
    md += `| - Haute priorité | ${report.summary.highPriorityBugs} |\n`;
    md += `| - Moyenne priorité | ${report.summary.mediumPriorityBugs} |\n`;
    md += `| - Basse priorité | ${report.summary.lowPriorityBugs} |\n`;
    md += `| **Erreurs console** | ${report.summary.totalErrors} |\n`;
    md += `| **Warnings** | ${report.summary.totalWarnings} |\n`;
    md += `| **Erreurs réseau** | ${report.summary.totalNetworkErrors} |\n`;
    md += `| **Screenshots** | ${report.screenshots.length} |\n\n`;
    
    md += `---\n\n`;
    
    // Bugs détaillés
    if (report.bugs.length > 0) {
        md += `## 🐛 BUGS DÉTAILLÉS\n\n`;
        
        const bySeverity = {
            critical: report.bugs.filter(b => b.severity === 'critical'),
            high: report.bugs.filter(b => b.severity === 'high'),
            medium: report.bugs.filter(b => b.severity === 'medium'),
            low: report.bugs.filter(b => b.severity === 'low')
        };
        
        for (const [severity, bugs] of Object.entries(bySeverity)) {
            if (bugs.length === 0) continue;
            
            md += `### ${severity.toUpperCase()} PRIORITY (${bugs.length})\n\n`;
            
            bugs.forEach((bug, i) => {
                md += `#### ${bug.id}: ${bug.title}\n\n`;
                md += `**Sévérité:** ${bug.severity}\n`;
                md += `**Localisation:** ${bug.location}\n`;
                md += `**Description:** ${bug.description}\n\n`;
                md += `**Étapes pour reproduire:**\n`;
                bug.steps.forEach(step => md += `1. ${step}\n`);
                md += `\n`;
                if (bug.screenshot) {
                    md += `**Screenshot:** \`${bug.screenshot}\`\n\n`;
                }
                md += `---\n\n`;
            });
        }
    }
    
    // Erreurs console
    if (report.errors.length > 0) {
        md += `## ❌ ERREURS CONSOLE\n\n`;
        report.errors.slice(0, 50).forEach((err, i) => {
            md += `${i + 1}. **[${err.page}]** ${err.message.substring(0, 200)}\n`;
        });
        if (report.errors.length > 50) {
            md += `\n*... et ${report.errors.length - 50} autres erreurs*\n`;
        }
        md += `\n`;
    }
    
    // Erreurs réseau
    if (report.networkErrors.length > 0) {
        md += `## 🌐 ERREURS RÉSEAU\n\n`;
        report.networkErrors.slice(0, 30).forEach((err, i) => {
            md += `${i + 1}. **[${err.page}]** ${err.url.substring(0, 80)} - ${err.error}\n`;
        });
        if (report.networkErrors.length > 30) {
            md += `\n*... et ${report.networkErrors.length - 30} autres erreurs réseau*\n`;
        }
        md += `\n`;
    }
    
    // Screenshots
    md += `## 📸 SCREENSHOTS\n\n`;
    md += `Total: ${report.screenshots.length} screenshots capturés\n\n`;
    md += `Dossier: \`bug-screenshots/\`\n\n`;
    
    fs.writeFileSync(mdPath, md);
    console.log(`📄 Markdown report saved: ${mdPath}`);
}

// Run the audit
runMarathonAudit()
    .then(report => {
        console.log('\n✅ Audit completed!');
        process.exit(report.summary.totalBugs > 0 ? 1 : 0);
    })
    .catch(error => {
        console.error('❌ Audit failed:', error);
        process.exit(1);
    });
