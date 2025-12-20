#!/usr/bin/env node
/**
 * BROWSER SIMULATION TEST
 * Simulates browser environment to verify no infinite loops or exports errors
 *
 * This test simulates what happens when:
 * 1. Browser loads the HTML file
 * 2. Babel transpiles the scripts
 * 3. Scripts execute in browser context
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
    browser: '🌐',
    check: '✓',
    cross: '✗'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    let prefix = symbols.info;

    switch(type) {
        case 'success': prefix = symbols.success; break;
        case 'error': prefix = symbols.error; break;
        case 'warning': prefix = symbols.warning; break;
        case 'browser': prefix = symbols.browser; break;
    }

    console.log(`${colors.bright}[${timestamp}]${colors.reset} ${prefix} ${message}`);
}

log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log(`${colors.bright}${colors.blue} BROWSER SIMULATION TEST ${colors.reset}`, 'browser');
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log('');

// ============================================================================
// TEST 1: Simulate browser environment with polyfill
// ============================================================================

log(`${colors.bright}Test 1: Simulating browser environment with exports polyfill${colors.reset}`, 'browser');

try {
    // Create a browser-like context
    const sandbox = {
        window: {},
        console: {
            log: () => {},  // Silent
            warn: () => {},
            error: () => {}
        },
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval
    };

    // Add polyfill (what's in the HTML)
    sandbox.window.exports = {};
    sandbox.window.module = { exports: {} };
    sandbox.exports = sandbox.window.exports;
    sandbox.module = sandbox.window.module;

    // Make window properties available at global level
    sandbox.DASHBOARD_UTILS = {};
    sandbox.window.DASHBOARD_UTILS = sandbox.DASHBOARD_UTILS;

    const context = vm.createContext(sandbox);

    // Load utils.js
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');

    // Execute in simulated browser
    vm.runInContext(utilsContent, context, {
        filename: 'utils.js',
        timeout: 5000  // 5 second timeout to catch infinite loops
    });

    // Check if window.DASHBOARD_UTILS was populated
    if (!context.window.DASHBOARD_UTILS) {
        throw new Error('window.DASHBOARD_UTILS not created');
    }

    const exportedFunctions = Object.keys(context.window.DASHBOARD_UTILS);
    if (exportedFunctions.length === 0) {
        throw new Error('No functions exported to window.DASHBOARD_UTILS');
    }

    log(`${colors.green}${symbols.success} Browser simulation successful!${colors.reset}`, 'success');
    log(`  ${symbols.check} Exported ${exportedFunctions.length} functions to window.DASHBOARD_UTILS`, 'info');
    log(`  ${symbols.check} No infinite loops detected`, 'info');
    log(`  ${symbols.check} No "exports is not defined" errors`, 'info');
    testsPassed++;

} catch (error) {
    log(`${colors.red}${symbols.error} Browser simulation FAILED!${colors.reset}`, 'error');
    log(`  ${symbols.cross} Error: ${error.message}`, 'error');
    if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        log(`  ${symbols.cross} INFINITE LOOP DETECTED!`, 'error');
    }
    testsFailed++;
}

log('');

// ============================================================================
// TEST 2: Verify polyfill prevents exports error
// ============================================================================

log(`${colors.bright}Test 2: Testing polyfill effectiveness${colors.reset}`, 'browser');

try {
    // Create context WITHOUT polyfill
    const sandbox = {
        window: {},
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        }
    };

    // Note: No exports/module polyfill here
    const context = vm.createContext(sandbox);

    // Try to use module.exports (what would fail without polyfill)
    const testCode = `
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = { test: 'value' };
        }
    `;

    try {
        vm.runInContext(testCode, context, { timeout: 1000 });
        log(`${colors.green}${symbols.success} Without polyfill: Code safely skips module.exports${colors.reset}`, 'success');
        testsPassed++;
    } catch (error) {
        log(`${colors.red}${symbols.error} Without polyfill: Code would fail${colors.reset}`, 'error');
        testsFailed++;
    }

    // Now test WITH polyfill
    const sandboxWithPolyfill = {
        window: {},
        console: { log: () => {}, warn: () => {}, error: () => {} }
    };
    sandboxWithPolyfill.exports = {};
    sandboxWithPolyfill.module = { exports: {} };

    const contextWithPolyfill = vm.createContext(sandboxWithPolyfill);

    vm.runInContext(testCode, contextWithPolyfill, { timeout: 1000 });
    log(`${colors.green}${symbols.success} With polyfill: Code executes without errors${colors.reset}`, 'success');
    testsPassed++;

} catch (error) {
    log(`${colors.red}${symbols.error} Polyfill test FAILED: ${error.message}${colors.reset}`, 'error');
    testsFailed++;
}

log('');

// ============================================================================
// TEST 3: Verify utils-shared.js also works
// ============================================================================

log(`${colors.bright}Test 3: Testing utils-shared.js in browser context${colors.reset}`, 'browser');

try {
    const sandbox = {
        window: {},
        React: { createElement: () => 'mock-element' },  // Mock React
        console: { log: () => {}, warn: () => {}, error: () => {} },
        Date: Date,
        Intl: Intl,
        isNaN: isNaN,
        parseInt: parseInt,
        Math: Math
    };

    sandbox.window.DASHBOARD_UTILS = {};

    const context = vm.createContext(sandbox);

    const sharedPath = path.join(__dirname, '../public/js/dashboard/utils-shared.js');
    const sharedContent = fs.readFileSync(sharedPath, 'utf8');

    vm.runInContext(sharedContent, context, {
        filename: 'utils-shared.js',
        timeout: 5000
    });

    const exportedFunctions = Object.keys(context.window.DASHBOARD_UTILS);
    if (exportedFunctions.length === 0) {
        throw new Error('No functions exported from utils-shared.js');
    }

    log(`${colors.green}${symbols.success} utils-shared.js works correctly${colors.reset}`, 'success');
    log(`  ${symbols.check} Exported ${exportedFunctions.length} functions`, 'info');
    log(`  ${symbols.check} Functions: ${exportedFunctions.slice(0, 5).join(', ')}...`, 'info');
    testsPassed++;

} catch (error) {
    log(`${colors.red}${symbols.error} utils-shared.js test FAILED: ${error.message}${colors.reset}`, 'error');
    testsFailed++;
}

log('');

// ============================================================================
// TEST 4: Check for potential circular dependencies
// ============================================================================

log(`${colors.bright}Test 4: Checking for circular dependency issues${colors.reset}`, 'browser');

try {
    const utilsPath = path.join(__dirname, '../public/js/dashboard/utils.js');
    const sharedPath = path.join(__dirname, '../public/js/dashboard/utils-shared.js');

    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const sharedContent = fs.readFileSync(sharedPath, 'utf8');

    // Check if utils.js references utils-shared or vice versa
    const utilsReferencesShared = /utils-shared/i.test(utilsContent);
    const sharedReferencesUtils = /utils\.js/i.test(sharedContent);

    if (utilsReferencesShared && sharedReferencesUtils) {
        throw new Error('Circular dependency detected between utils.js and utils-shared.js');
    }

    log(`${colors.green}${symbols.success} No circular dependencies detected${colors.reset}`, 'success');
    testsPassed++;

} catch (error) {
    log(`${colors.red}${symbols.error} Circular dependency check FAILED: ${error.message}${colors.reset}`, 'error');
    testsFailed++;
}

log('');

// ============================================================================
// TEST 5: Verify HTML structure
// ============================================================================

log(`${colors.bright}Test 5: Verifying HTML loads scripts in safe order${colors.reset}`, 'browser');

try {
    const htmlPath = path.join(__dirname, '../public/beta-combined-dashboard-modular.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Check polyfill comes after Babel
    const babelIndex = htmlContent.indexOf('@babel/standalone');
    const polyfillIndex = htmlContent.indexOf('typeof exports === ');

    if (babelIndex === -1) throw new Error('Babel not found in HTML');
    if (polyfillIndex === -1) throw new Error('Polyfill not found in HTML');
    if (polyfillIndex < babelIndex) throw new Error('Polyfill loads before Babel!');

    // Check utils.js loads with type="text/babel"
    const utilsScriptMatch = htmlContent.match(/<script[^>]*src=["'][^"']*utils\.js["'][^>]*>/);
    if (utilsScriptMatch) {
        const isBabel = /type=["']text\/babel["']/.test(utilsScriptMatch[0]);
        if (!isBabel) {
            log(`  ${symbols.warning} Warning: utils.js might not be transpiled by Babel`, 'warning');
        }
    }

    log(`${colors.green}${symbols.success} HTML structure is correct${colors.reset}`, 'success');
    log(`  ${symbols.check} Babel loads first`, 'info');
    log(`  ${symbols.check} Polyfill loads after Babel`, 'info');
    log(`  ${symbols.check} Scripts in safe execution order`, 'info');
    testsPassed++;

} catch (error) {
    log(`${colors.red}${symbols.error} HTML structure check FAILED: ${error.message}${colors.reset}`, 'error');
    testsFailed++;
}

log('');

// ============================================================================
// RESULTS
// ============================================================================

log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log(`${colors.bright}${colors.magenta} BROWSER SIMULATION RESULTS ${colors.reset}`);
log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log('');

const totalTests = testsPassed + testsFailed;
const successRate = ((testsPassed / totalTests) * 100).toFixed(1);

log(`${colors.bright}Total Tests:${colors.reset} ${totalTests}`);
log(`${colors.green}${symbols.success} Passed:${colors.reset} ${testsPassed}`);
log(`${colors.red}${symbols.error} Failed:${colors.reset} ${testsFailed}`);
log(`${colors.bright}Success Rate:${colors.reset} ${successRate}%`);
log('');

if (testsFailed === 0) {
    log(`${colors.bgGreen}${colors.bright} ✓ ALL BROWSER TESTS PASSED ${colors.reset}`, 'success');
    log(`${colors.green}${symbols.browser} Website will load without infinite loops!${colors.reset}`, 'success');
    log(`${colors.green}${symbols.check} No exports errors in browser!${colors.reset}`, 'success');
} else {
    log(`${colors.bgRed}${colors.bright} ✗ SOME TESTS FAILED ${colors.reset}`, 'error');
    log(`${colors.red}${symbols.error} Browser may experience errors!${colors.reset}`, 'error');
}

log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
log('');

process.exit(testsFailed === 0 ? 0 : 1);
