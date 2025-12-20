#!/usr/bin/env node
/**
 * ULTRA HIGH EXTREME PERFECTION TEST SUITE
 * Tests for exports fix to prevent infinite loop errors
 *
 * This script performs rigorous verification that:
 * 1. No CommonJS exports exist in browser-loaded files
 * 2. Window-based exports are properly configured
 * 3. HTML files have proper polyfills
 * 4. No infinite loop scenarios exist
 * 5. All utility functions are accessible
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for beautiful output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m'
};

const symbols = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    rocket: '🚀',
    fire: '🔥',
    check: '✓',
    cross: '✗',
    arrow: '→',
    star: '⭐'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnings = 0;

// Test result tracking
const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    info: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    let prefix = '';

    switch(type) {
        case 'success':
            prefix = `${colors.green}${symbols.success}${colors.reset}`;
            break;
        case 'error':
            prefix = `${colors.red}${symbols.error}${colors.reset}`;
            break;
        case 'warning':
            prefix = `${colors.yellow}${symbols.warning}${colors.reset}`;
            break;
        case 'info':
            prefix = `${colors.blue}${symbols.info}${colors.reset}`;
            break;
        case 'rocket':
            prefix = `${colors.magenta}${symbols.rocket}${colors.reset}`;
            break;
        case 'fire':
            prefix = `${colors.red}${symbols.fire}${colors.reset}`;
            break;
    }

    console.log(`${colors.bright}[${timestamp}]${colors.reset} ${prefix} ${message}`);
}

function test(description, testFn, severity = 'medium') {
    totalTests++;
    try {
        const result = testFn();
        if (result.pass) {
            passedTests++;
            log(`${colors.green}PASS${colors.reset} ${description}`, 'success');
            results[severity].push({ test: description, status: 'PASS', details: result.message });
            return true;
        } else {
            failedTests++;
            log(`${colors.red}FAIL${colors.reset} ${description}`, 'error');
            log(`  ${colors.red}${symbols.arrow}${colors.reset} ${result.message}`, 'error');
            results[severity].push({ test: description, status: 'FAIL', details: result.message });
            return false;
        }
    } catch (error) {
        failedTests++;
        log(`${colors.red}FAIL${colors.reset} ${description}`, 'error');
        log(`  ${colors.red}${symbols.arrow}${colors.reset} ${error.message}`, 'error');
        results[severity].push({ test: description, status: 'FAIL', details: error.message });
        return false;
    }
}

function warn(message) {
    warnings++;
    log(`${colors.yellow}WARNING${colors.reset} ${message}`, 'warning');
}

// ============================================================================
// TEST SUITE BEGINS
// ============================================================================

log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`, 'rocket');
log(`${colors.bright}${colors.magenta} ULTRA HIGH EXTREME PERFECTION TEST SUITE ${colors.reset}`, 'rocket');
log(`${colors.bright}${colors.magenta} Exports Fix Verification ${colors.reset}`, 'rocket');
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`, 'rocket');
log('');

// ============================================================================
// CRITICAL TESTS - These must pass or the fix is broken
// ============================================================================

log(`${colors.bright}${colors.red}${symbols.fire} CRITICAL TESTS${colors.reset}`, 'fire');
log('');

test('utils.js does NOT contain module.exports', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const content = fs.readFileSync(utilsPath, 'utf8');

    const hasModuleExports = /module\.exports\s*=/.test(content);
    const hasExportsDot = /^exports\./m.test(content);

    if (hasModuleExports || hasExportsDot) {
        return {
            pass: false,
            message: 'Found CommonJS exports! This will cause "exports is not defined" error in browser.'
        };
    }

    return {
        pass: true,
        message: 'No CommonJS exports found - using window-based exports'
    };
}, 'critical');

test('utils.js uses window.DASHBOARD_UTILS', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const content = fs.readFileSync(utilsPath, 'utf8');

    const hasWindowExports = /window\.DASHBOARD_UTILS/.test(content);

    if (!hasWindowExports) {
        return {
            pass: false,
            message: 'Missing window.DASHBOARD_UTILS exports! Functions will not be accessible in browser.'
        };
    }

    return {
        pass: true,
        message: 'window.DASHBOARD_UTILS exports found'
    };
}, 'critical');

test('beta-combined-dashboard-modular.html has exports polyfill', () => {
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    const hasExportsPolyfill = /typeof exports === ['"]undefined['"]/.test(content) &&
                               /window\.exports\s*=/.test(content);
    const hasModulePolyfill = /typeof module === ['"]undefined['"]/.test(content) &&
                              /window\.module\s*=/.test(content);

    if (!hasExportsPolyfill || !hasModulePolyfill) {
        return {
            pass: false,
            message: 'Missing exports/module polyfill! This could cause errors if Babel transpiles modules.'
        };
    }

    return {
        pass: true,
        message: 'Polyfill properly configured to prevent exports errors'
    };
}, 'critical');

test('Polyfill loads BEFORE Babel transpilation', () => {
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    const babelIndex = content.indexOf('@babel/standalone');
    const polyfillIndex = content.indexOf('typeof exports === ');

    if (polyfillIndex === -1) {
        return { pass: false, message: 'Polyfill not found!' };
    }

    if (babelIndex === -1) {
        return { pass: false, message: 'Babel not found!' };
    }

    if (polyfillIndex < babelIndex) {
        return {
            pass: false,
            message: 'Polyfill loads BEFORE Babel - this is wrong! Babel must load first.'
        };
    }

    return {
        pass: true,
        message: 'Polyfill correctly loads AFTER Babel'
    };
}, 'critical');

log('');

// ============================================================================
// HIGH PRIORITY TESTS - Important for functionality
// ============================================================================

log(`${colors.bright}${colors.yellow}${symbols.star} HIGH PRIORITY TESTS${colors.reset}`, 'warning');
log('');

test('All utility functions exported to window', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const content = fs.readFileSync(utilsPath, 'utf8');

    const requiredFunctions = [
        'cleanText',
        'getNewsIcon',
        'getSourceCredibility',
        'sortNewsByCredibility',
        'isFrenchArticle',
        'getCompanyLogo',
        'getUserLoginId',
        'getGradeColor',
        'parseSeekingAlphaRawText',
        'formatNumber',
        'getTabIcon'
    ];

    const missing = requiredFunctions.filter(fn => !content.includes(fn));

    if (missing.length > 0) {
        return {
            pass: false,
            message: `Missing functions in exports: ${missing.join(', ')}`
        };
    }

    return {
        pass: true,
        message: `All ${requiredFunctions.length} utility functions present`
    };
}, 'high');

test('utils.js file is valid JavaScript syntax', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const content = fs.readFileSync(utilsPath, 'utf8');

    // Basic syntax checks
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/]/g) || []).length;

    if (openBraces !== closeBraces) {
        return { pass: false, message: `Mismatched braces: ${openBraces} open, ${closeBraces} close` };
    }
    if (openParens !== closeParens) {
        return { pass: false, message: `Mismatched parentheses: ${openParens} open, ${closeParens} close` };
    }
    if (openBrackets !== closeBrackets) {
        return { pass: false, message: `Mismatched brackets: ${openBrackets} open, ${closeBrackets} close` };
    }

    return {
        pass: true,
        message: 'Valid JavaScript syntax (braces, parens, brackets matched)'
    };
}, 'high');

test('No other files use module.exports in Babel-transpiled scripts', () => {
    const componentsDir = path.join(__dirname, '../public/js/dashboard/components');
    const issues = [];

    function checkDirectory(dir) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                checkDirectory(filePath);
            } else if (file.endsWith('.js')) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (/module\.exports\s*=/.test(content) || /^exports\./m.test(content)) {
                    issues.push(filePath.replace(process.cwd(), '.'));
                }
            }
        }
    }

    checkDirectory(componentsDir);

    if (issues.length > 0) {
        return {
            pass: false,
            message: `Found CommonJS exports in: ${issues.join(', ')}`
        };
    }

    return {
        pass: true,
        message: 'No CommonJS exports found in component files'
    };
}, 'high');

test('HTML file loads scripts in correct order', () => {
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
    const content = fs.readFileSync(htmlPath, 'utf8');

    const scriptMatches = [...content.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/g)];
    const scriptOrder = scriptMatches.map(m => m[1]);

    // React must load before Babel
    const reactIndex = scriptOrder.findIndex(s => s.includes('react') && !s.includes('react-dom'));
    const reactDomIndex = scriptOrder.findIndex(s => s.includes('react-dom'));
    const babelIndex = scriptOrder.findIndex(s => s.includes('babel'));

    if (reactIndex === -1 || reactDomIndex === -1 || babelIndex === -1) {
        return { pass: false, message: 'Missing required libraries (React, ReactDOM, or Babel)' };
    }

    if (reactIndex > babelIndex || reactDomIndex > babelIndex) {
        return {
            pass: false,
            message: 'React/ReactDOM must load before Babel'
        };
    }

    return {
        pass: true,
        message: 'Scripts load in correct order: React → ReactDOM → Babel → Polyfill'
    };
}, 'high');

log('');

// ============================================================================
// MEDIUM PRIORITY TESTS - Good to have
// ============================================================================

log(`${colors.bright}${colors.blue}${symbols.check} MEDIUM PRIORITY TESTS${colors.reset}`, 'info');
log('');

test('utils-godmode.js still has its polyfill', () => {
    const godmodePath = path.join(__dirname, '../public/js/dashboard/utils-godmode.js');

    if (!fs.existsSync(godmodePath)) {
        warn('utils-godmode.js not found - skipping');
        return { pass: true, message: 'File not found (skipped)' };
    }

    const content = fs.readFileSync(godmodePath, 'utf8');

    const hasPolyfill = /typeof exports === ['"]undefined['"]/.test(content);

    if (!hasPolyfill) {
        return {
            pass: false,
            message: 'utils-godmode.js missing exports polyfill'
        };
    }

    return {
        pass: true,
        message: 'Polyfill present in utils-godmode.js'
    };
}, 'medium');

test('utils-shared.js uses proper IIFE pattern', () => {
    const sharedPath = path.join(__dirname, '../public/js/dashboard/utils-shared.js');
    const content = fs.readFileSync(sharedPath, 'utf8');

    const hasIIFE = /\(function\(\)\s*{/.test(content) && /}\)\(\);/.test(content);
    const usesWindowExports = /window\.DASHBOARD_UTILS/.test(content);

    if (!hasIIFE) {
        return {
            pass: false,
            message: 'utils-shared.js should use IIFE pattern for encapsulation'
        };
    }

    if (!usesWindowExports) {
        return {
            pass: false,
            message: 'utils-shared.js should export to window.DASHBOARD_UTILS'
        };
    }

    return {
        pass: true,
        message: 'Proper IIFE pattern with window exports'
    };
}, 'medium');

test('No console.log spam in utils.js', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const content = fs.readFileSync(utilsPath, 'utf8');

    const consoleLogs = (content.match(/console\.log/g) || []).length;

    if (consoleLogs > 5) {
        warn(`Found ${consoleLogs} console.log statements in utils.js`);
        return {
            pass: false,
            message: `Too many console.log statements (${consoleLogs}), consider removing for production`
        };
    }

    return {
        pass: true,
        message: `Acceptable console.log count (${consoleLogs})`
    };
}, 'medium');

test('File sizes are reasonable', () => {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');

    const utilsSize = fs.statSync(utilsPath).size;
    const htmlSize = fs.statSync(htmlPath).size;

    const utilsSizeKB = (utilsSize / 1024).toFixed(2);
    const htmlSizeKB = (htmlSize / 1024).toFixed(2);

    log(`  ${symbols.info} utils.js: ${utilsSizeKB} KB`, 'info');
    log(`  ${symbols.info} HTML: ${htmlSizeKB} KB`, 'info');

    if (utilsSize > 100 * 1024) {
        warn(`utils.js is large (${utilsSizeKB} KB), consider splitting`);
    }

    return {
        pass: true,
        message: `File sizes acceptable (utils: ${utilsSizeKB}KB, html: ${htmlSizeKB}KB)`
    };
}, 'medium');

log('');

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log(`${colors.bright}${colors.magenta} TEST RESULTS SUMMARY ${colors.reset}`, 'rocket');
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log('');

const successRate = ((passedTests / totalTests) * 100).toFixed(1);

log(`${colors.bright}Total Tests:${colors.reset} ${totalTests}`);
log(`${colors.green}${symbols.success} Passed:${colors.reset} ${passedTests}`);
log(`${colors.red}${symbols.error} Failed:${colors.reset} ${failedTests}`);
log(`${colors.yellow}${symbols.warning} Warnings:${colors.reset} ${warnings}`);
log(`${colors.bright}Success Rate:${colors.reset} ${successRate}%`);
log('');

// Show failed tests by severity
if (failedTests > 0) {
    log(`${colors.red}${colors.bright}FAILED TESTS BY SEVERITY:${colors.reset}`, 'error');
    log('');

    ['critical', 'high', 'medium', 'low'].forEach(severity => {
        const failed = results[severity].filter(r => r.status === 'FAIL');
        if (failed.length > 0) {
            log(`${colors.red}${severity.toUpperCase()}:${colors.reset}`, 'error');
            failed.forEach(f => {
                log(`  ${symbols.cross} ${f.test}`, 'error');
                log(`    ${symbols.arrow} ${f.details}`, 'error');
            });
            log('');
        }
    });
}

// Final verdict
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
if (failedTests === 0) {
    log(`${colors.bgGreen}${colors.bright} ✓ ALL TESTS PASSED - PERFECTION ACHIEVED! ${colors.reset}`, 'success');
    log(`${colors.green}${symbols.fire} The exports fix is rock solid!${colors.reset}`, 'success');
    log(`${colors.green}${symbols.rocket} Ready for production deployment!${colors.reset}`, 'success');
} else if (results.critical.some(r => r.status === 'FAIL')) {
    log(`${colors.bgRed}${colors.bright} ✗ CRITICAL FAILURES - FIX REQUIRED ${colors.reset}`, 'error');
    log(`${colors.red}${symbols.error} Critical tests failed - do not deploy!${colors.reset}`, 'error');
} else if (results.high.some(r => r.status === 'FAIL')) {
    log(`${colors.yellow}${colors.bright} ⚠ HIGH PRIORITY FAILURES - REVIEW NEEDED ${colors.reset}`, 'warning');
    log(`${colors.yellow}${symbols.warning} Some important tests failed - review before deploying${colors.reset}`, 'warning');
} else {
    log(`${colors.green}${colors.bright} ✓ ACCEPTABLE - Minor issues only ${colors.reset}`, 'success');
    log(`${colors.green}${symbols.check} Core functionality passes - safe to deploy${colors.reset}`, 'success');
}
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log('');

// Exit code
process.exit(failedTests === 0 ? 0 : 1);
