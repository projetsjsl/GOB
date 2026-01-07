import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function runBrowserTests() {
    console.log('🚀 Starting Comprehensive Browser Tests...');
    
    let browser;
    try {
        browser = await chromium.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to the local dev server
        const url = 'http://localhost:5173/beta-combined-dashboard.html';
        console.log(`📡 Navigating to ${url}...`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        } catch (e) {
            console.error('❌ Failed to load page. Is the dev server running at http://localhost:5173?');
            throw e;
        }

        console.log('✅ Page loaded. Injecting comprehensive test script...');

        // Load the test script content
        const testScriptPath = join(rootDir, 'scripts/test-all-tabs-comprehensive-v2.js');
        const testScriptContent = fs.readFileSync(testScriptPath, 'utf8');

        // Execute the script in the page
        await page.evaluate(testScriptContent);

        console.log('⏳ Running tests (this may take a few minutes)...');

        // Wait for tests to complete (they expose results in window.testResultsUltraComplete)
        let results = null;
        let attempts = 0;
        while (attempts < 60) { // 2 minutes max
            results = await page.evaluate(() => window.testResultsUltraComplete);
            if (results) break;
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }

        if (results) {
            console.log('\n🎉 === BROWSER TEST RESULTS ===');
            console.log(`Success Rate: ${results.summary.globalSuccessRate.toFixed(1)}%`);
            console.log(`Score: ${results.summary.totalScore}/${results.summary.maxScore} (${results.summary.globalScoreRate.toFixed(1)}%)`);
            
            // Save results to file
            const outputPath = join(rootDir, 'browser-test-report.json');
            fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
            console.log(`\n📄 Detailed report saved to: ${outputPath}`);

            if (results.summary.isPerfect) {
                console.log('✅ ALL TESTS PASSED PERFECTLY!');
            } else {
                console.log('⚠️ Some tests failed or had issues. Check the report.');
            }
        } else {
            console.error('❌ Tests timed out or failed to return results.');
        }

    } catch (error) {
        console.error('💥 Error during browser tests:', error);
    } finally {
        if (browser) await browser.close();
        console.log('🏁 Browser tests finished.');
    }
}

runBrowserTests();
