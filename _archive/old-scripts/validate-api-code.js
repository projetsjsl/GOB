#!/usr/bin/env node

/**
 * API Code Validation Script - Analyzes API files for common issues
 * Checks: Error handling, env vars, CORS, exports, etc.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_DIR = join(__dirname, 'api');

// Environment variables required by different APIs
const REQUIRED_ENV_VARS = {
    'fmp.js': ['FMP_API_KEY'],
    'marketdata.js': ['FMP_API_KEY', 'TWELVE_DATA_API_KEY', 'POLYGON_API_KEY'],
    'gemini/chat.js': ['GEMINI_API_KEY'],
    'emma-agent.js': ['GEMINI_API_KEY'],
    'supabase-watchlist.js': ['SUPABASE_URL', 'SUPABASE_KEY'],
    'calendar-economic.js': ['FMP_API_KEY'],
    'calendar-earnings.js': ['FMP_API_KEY'],
    'calendar-dividends.js': ['FMP_API_KEY']
};

// Color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

let totalIssues = 0;
let totalWarnings = 0;
let totalChecks = 0;

/**
 * Get all JS files in API directory recursively
 */
function getApiFiles(dir, fileList = []) {
    const files = readdirSync(dir);

    files.forEach(file => {
        const filePath = join(dir, file);
        const stat = statSync(filePath);

        if (stat.isDirectory()) {
            getApiFiles(filePath, fileList);
        } else if (file.endsWith('.js') && !file.startsWith('test-')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Analyze a single API file
 */
function analyzeApiFile(filePath) {
    const relativePath = relative(__dirname, filePath);
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    const warnings = [];
    const info = [];

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📄 ${relativePath}${colors.reset}`);

    totalChecks++;

    // Check 1: Has default export (required for Vercel)
    if (!content.includes('export default')) {
        issues.push('Missing default export (required for Vercel functions)');
    } else {
        info.push('✓ Has default export');
    }

    // Check 2: CORS headers
    const hasCors = content.includes('Access-Control-Allow-Origin');
    if (!hasCors) {
        warnings.push('Missing CORS headers (may cause browser issues)');
    } else {
        info.push('✓ CORS headers configured');
    }

    // Check 3: OPTIONS method handling
    if (!content.includes("req.method === 'OPTIONS'")) {
        warnings.push('No OPTIONS method handling (preflight requests may fail)');
    } else {
        info.push('✓ OPTIONS method handled');
    }

    // Check 4: Environment variables
    const envVarsUsed = [];
    const envVarPattern = /process\.env\.(\w+)/g;
    let match;
    while ((match = envVarPattern.exec(content)) !== null) {
        if (!envVarsUsed.includes(match[1])) {
            envVarsUsed.push(match[1]);
        }
    }

    if (envVarsUsed.length > 0) {
        info.push(`Uses env vars: ${envVarsUsed.join(', ')}`);

        // Check if env vars are checked before use
        envVarsUsed.forEach(envVar => {
            const checkPattern = new RegExp(`if\\s*\\(!?\\s*${envVar}\\s*\\)`, 'g');
            const isChecked = checkPattern.test(content);
            if (!isChecked) {
                warnings.push(`Env var ${envVar} not validated before use`);
            }
        });
    }

    // Check 5: Error handling
    const hasTryCatch = content.includes('try {') && content.includes('catch');
    if (!hasTryCatch) {
        issues.push('No try-catch error handling detected');
    } else {
        info.push('✓ Has error handling');
    }

    // Check 6: Response status codes
    const hasErrorStatus = content.includes('res.status(500)') ||
                          content.includes('res.status(503)') ||
                          content.includes('res.status(400)');
    if (!hasErrorStatus) {
        warnings.push('No error status codes (500/503/400) found');
    } else {
        info.push('✓ Uses error status codes');
    }

    // Check 7: Timeout handling (for long-running operations)
    const hasTimeout = content.includes('setTimeout') ||
                      content.includes('timeout') ||
                      content.includes('AbortController');
    if (content.length > 3000 && !hasTimeout) {
        warnings.push('Large file without timeout handling');
    }

    // Check 8: Rate limiting awareness
    const hasRateLimit = content.includes('rate limit') ||
                        content.includes('rateLimit') ||
                        content.includes('429');
    if (envVarsUsed.some(v => v.includes('API_KEY')) && !hasRateLimit) {
        warnings.push('Uses API keys but no rate limit handling detected');
    }

    // Check 9: Proper JSON responses
    const hasJsonResponse = content.includes('res.json(');
    if (!hasJsonResponse) {
        warnings.push('No JSON responses detected (expected for API)');
    } else {
        info.push('✓ Returns JSON responses');
    }

    // Check 10: Method validation
    const hasMethodCheck = content.includes("req.method === 'GET'") ||
                          content.includes("req.method === 'POST'");
    if (!hasMethodCheck) {
        warnings.push('No HTTP method validation');
    } else {
        info.push('✓ Validates HTTP methods');
    }

    // Display results
    if (info.length > 0) {
        console.log(`${colors.green}Good:${colors.reset}`);
        info.forEach(i => console.log(`  ${i}`));
    }

    if (warnings.length > 0) {
        console.log(`${colors.yellow}Warnings:${colors.reset}`);
        warnings.forEach(w => console.log(`  ⚠️  ${w}`));
        totalWarnings += warnings.length;
    }

    if (issues.length > 0) {
        console.log(`${colors.red}Issues:${colors.reset}`);
        issues.forEach(i => console.log(`  ❌ ${i}`));
        totalIssues += issues.length;
    }

    if (issues.length === 0 && warnings.length === 0) {
        console.log(`${colors.green}✅ No issues found${colors.reset}`);
    }

    return { issues, warnings, info };
}

/**
 * Check vercel.json configuration
 */
function checkVercelConfig() {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}⚙️  Vercel Configuration${colors.reset}`);

    try {
        const vercelConfig = JSON.parse(readFileSync(join(__dirname, 'vercel.json'), 'utf-8'));

        // Check function timeouts
        if (vercelConfig.functions) {
            console.log(`${colors.green}✓ Function timeouts configured:${colors.reset}`);
            Object.entries(vercelConfig.functions).forEach(([fn, config]) => {
                console.log(`  • ${fn}: ${config.maxDuration}s`);
            });
        }

        // Check cron jobs
        if (vercelConfig.crons && vercelConfig.crons.length > 0) {
            console.log(`${colors.green}✓ Cron jobs configured: ${vercelConfig.crons.length}${colors.reset}`);
        } else {
            console.log(`${colors.yellow}⚠️  No cron jobs configured${colors.reset}`);
        }

        // Check redirects
        if (vercelConfig.redirects) {
            console.log(`${colors.green}✓ Redirects configured: ${vercelConfig.redirects.length}${colors.reset}`);
        }

        // Check headers (CORS)
        if (vercelConfig.headers) {
            console.log(`${colors.green}✓ Global headers configured${colors.reset}`);
        }

    } catch (error) {
        console.log(`${colors.red}❌ Failed to read vercel.json: ${error.message}${colors.reset}`);
        totalIssues++;
    }
}

/**
 * Check required environment variables documentation
 */
function checkEnvDocumentation() {
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}📋 Required Environment Variables${colors.reset}`);

    const allEnvVars = new Set();

    Object.entries(REQUIRED_ENV_VARS).forEach(([file, vars]) => {
        vars.forEach(v => allEnvVars.add(v));
    });

    console.log(`\n${colors.bright}Critical:${colors.reset}`);
    console.log('  • GEMINI_API_KEY - Gemini AI (Emma)');
    console.log('  • FMP_API_KEY - Financial Modeling Prep (market data)');
    console.log('  • GITHUB_TOKEN - GitHub data persistence');

    console.log(`\n${colors.bright}Recommended:${colors.reset}`);
    console.log('  • POLYGON_API_KEY - Real-time quotes');
    console.log('  • TWELVE_DATA_API_KEY - Fallback market data');
    console.log('  • SUPABASE_URL & SUPABASE_KEY - Database');
    console.log('  • ANTHROPIC_API_KEY - Claude AI');

    console.log(`\n${colors.yellow}⚠️  Note: These must be configured in Vercel dashboard${colors.reset}`);
}

/**
 * Main validation function
 */
async function runValidation() {
    console.log(`${colors.bright}${colors.blue}`);
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║      GOB Financial Dashboard - API Code Validation        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(colors.reset);

    // Get all API files
    const apiFiles = getApiFiles(API_DIR);
    console.log(`\nFound ${apiFiles.length} API files to analyze\n`);

    // Analyze each file
    const results = [];
    for (const file of apiFiles) {
        const result = analyzeApiFile(file);
        results.push({ file, ...result });
    }

    // Check Vercel configuration
    checkVercelConfig();

    // Check environment variables
    checkEnvDocumentation();

    // Summary
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bright}\n📊 VALIDATION SUMMARY${colors.reset}\n`);

    console.log(`Files analyzed: ${totalChecks}`);
    console.log(`${colors.red}Issues found: ${totalIssues}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${totalWarnings}${colors.reset}`);

    if (totalIssues > 0) {
        console.log(`\n${colors.red}${colors.bright}🚨 CRITICAL ISSUES DETECTED${colors.reset}`);
        console.log('Review the issues above and fix before deployment');
    } else if (totalWarnings > 0) {
        console.log(`\n${colors.yellow}⚠️  Some warnings detected - review recommended${colors.reset}`);
    } else {
        console.log(`\n${colors.green}${colors.bright}✅ All APIs look good!${colors.reset}`);
    }

    console.log(`\n${colors.bright}📝 NEXT STEPS:${colors.reset}`);
    console.log('1. Fix any critical issues found above');
    console.log('2. Configure required environment variables in Vercel');
    console.log('3. Test APIs with: node validate-all-apis.js');
    console.log('4. For live testing, use your Vercel deployment URL');

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    process.exit(totalIssues > 0 ? 1 : 0);
}

// Run validation
runValidation().catch(error => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
});
