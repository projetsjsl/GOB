#!/usr/bin/env node
/**
 * Test Script pour Modular Dashboard Beta
 * 
 * Vérifie que tous les composants sont chargés et que les objets globaux
 * sont correctement exposés pour la compatibilité avec BetaCombinedDashboard
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_URL = 'http://localhost:3000/modular-dashboard-beta.html';
const TIMEOUT = 30000;

const tests = {
    passed: 0,
    failed: 0,
    errors: []
};

function log(message, type = 'info') {
    const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
}

async function testPageLoad(browser) {
    log('Test 1: Chargement de la page', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        const title = await page.title();
        if (title.includes('GOB Canvas') || title.includes('Beta Modular')) {
            tests.passed++;
            log(`Page chargée: ${title}`, 'success');
        } else {
            tests.failed++;
            tests.errors.push(`Titre incorrect: ${title}`);
            log(`Titre incorrect: ${title}`, 'error');
        }
        await page.close();
        return true;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur chargement page: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testGlobalObjects(browser) {
    log('Test 2: Vérification des objets globaux', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Attendre que React soit chargé
        await page.waitForFunction(() => typeof window.React !== 'undefined', { timeout: 10000 });
        await page.waitForFunction(() => typeof window.ReactDOM !== 'undefined', { timeout: 10000 });
        
        // Attendre que les composants soient chargés
        await page.waitForFunction(() => typeof window.FullModularDashboard !== 'undefined', { timeout: 15000 });
        
        const globalChecks = await page.evaluate(() => {
            const results = {};
            
            // Vérifier React et ReactDOM
            results.react = typeof window.React !== 'undefined';
            results.reactDOM = typeof window.ReactDOM !== 'undefined';
            
            // Vérifier FullModularDashboard
            results.fullModularDashboard = typeof window.FullModularDashboard !== 'undefined';
            
            // Vérifier BetaCombinedDashboard (doit être exposé)
            results.betaCombinedDashboard = typeof window.BetaCombinedDashboard !== 'undefined';
            results.betaCombinedDashboardData = typeof window.BetaCombinedDashboardData !== 'undefined';
            
            // Vérifier les propriétés de BetaCombinedDashboard
            if (results.betaCombinedDashboard) {
                const dashboard = window.BetaCombinedDashboard;
                results.hasIsDarkMode = typeof dashboard.isDarkMode !== 'undefined';
                results.hasTickers = Array.isArray(dashboard.tickers);
                results.hasStockData = typeof dashboard.stockData === 'object';
                results.hasNewsData = Array.isArray(dashboard.newsData);
                results.hasGetCompanyLogo = typeof dashboard.getCompanyLogo === 'function';
                results.hasLoadTickersFromSupabase = typeof dashboard.loadTickersFromSupabase === 'function';
                results.hasFetchNews = typeof dashboard.fetchNews === 'function';
                results.hasRefreshAllStocks = typeof dashboard.refreshAllStocks === 'function';
                results.hasSetActiveTab = typeof dashboard.setActiveTab === 'function';
            }
            
            // Vérifier BetaCombinedDashboardData
            if (results.betaCombinedDashboardData) {
                const data = window.BetaCombinedDashboardData;
                results.dataHasGetCompanyLogo = typeof data.getCompanyLogo === 'function';
                results.dataHasSetActiveTab = typeof data.setActiveTab === 'function';
            }
            
            return results;
        });
        
        let allPassed = true;
        for (const [key, value] of Object.entries(globalChecks)) {
            if (value) {
                log(`  ✓ ${key}`, 'success');
            } else {
                log(`  ✗ ${key}`, 'error');
                allPassed = false;
            }
        }
        
        if (allPassed) {
            tests.passed++;
            log('Tous les objets globaux sont correctement exposés', 'success');
        } else {
            tests.failed++;
            tests.errors.push('Certains objets globaux manquent');
            log('Certains objets globaux manquent', 'error');
        }
        
        await page.close();
        return allPassed;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification objets globaux: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testComponents(browser) {
    log('Test 3: Vérification des composants', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Attendre que les composants soient chargés
        await page.waitForFunction(() => typeof window.FullModularDashboard !== 'undefined', { timeout: 15000 });
        
        const componentChecks = await page.evaluate(() => {
            const results = {};
            
            // Vérifier les composants principaux
            results.jLabTab = typeof window.JLabTab !== 'undefined';
            results.askEmmaTab = typeof window.AskEmmaTab !== 'undefined';
            results.marketsEconomyTabRGL = typeof window.MarketsEconomyTabRGL !== 'undefined';
            results.titresTabRGL = typeof window.TitresTabRGL !== 'undefined';
            
            // Vérifier les utilitaires
            results.lucideIcon = typeof window.LucideIcon !== 'undefined';
            results.dashboardUtils = typeof window.DASHBOARD_UTILS !== 'undefined';
            results.dashboardConstants = typeof window.DASHBOARD_CONSTANTS !== 'undefined';
            
            return results;
        });
        
        let allPassed = true;
        for (const [key, value] of Object.entries(componentChecks)) {
            if (value) {
                log(`  ✓ ${key}`, 'success');
            } else {
                log(`  ✗ ${key}`, 'error');
                allPassed = false;
            }
        }
        
        if (allPassed) {
            tests.passed++;
            log('Tous les composants sont chargés', 'success');
        } else {
            tests.failed++;
            tests.errors.push('Certains composants manquent');
            log('Certains composants manquent', 'error');
        }
        
        await page.close();
        return allPassed;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification composants: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testDependencies(browser) {
    log('Test 4: Vérification des dépendances', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        const dependencyChecks = await page.evaluate(() => {
            const results = {};
            
            // Vérifier React Grid Layout
            results.reactGridLayout = typeof window.ReactGridLayout !== 'undefined';
            
            // Vérifier Recharts (pour JLabTab)
            results.recharts = typeof window.Recharts !== 'undefined' || typeof Recharts !== 'undefined';
            
            // Vérifier Chart.js
            results.chartJs = typeof Chart !== 'undefined';
            
            // Vérifier Lightweight Charts
            results.lightweightCharts = typeof window.LightweightCharts !== 'undefined';
            
            // Vérifier Lucide
            results.lucide = typeof window.lucide !== 'undefined' || typeof lucide !== 'undefined';
            
            // Vérifier Supabase (optionnel)
            results.supabase = typeof window.supabase !== 'undefined' || typeof supabase !== 'undefined';
            
            return results;
        });
        
        let allPassed = true;
        for (const [key, value] of Object.entries(dependencyChecks)) {
            if (value) {
                log(`  ✓ ${key}`, 'success');
            } else {
                log(`  ✗ ${key} (optionnel)`, 'warning');
                // Ne pas échouer pour les dépendances optionnelles
            }
        }
        
        if (dependencyChecks.reactGridLayout && dependencyChecks.lucide) {
            tests.passed++;
            log('Dépendances principales disponibles', 'success');
        } else {
            tests.failed++;
            tests.errors.push('Dépendances principales manquantes');
            log('Dépendances principales manquantes', 'error');
        }
        
        await page.close();
        return dependencyChecks.reactGridLayout && dependencyChecks.lucide;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification dépendances: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testRendering(browser) {
    log('Test 5: Vérification du rendu', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Attendre que React soit monté
        await page.waitForFunction(() => {
            const root = document.getElementById('root');
            return root && root.children.length > 0;
        }, { timeout: 15000 });
        
        const renderChecks = await page.evaluate(() => {
            const results = {};
            
            const root = document.getElementById('root');
            results.hasRoot = root !== null;
            results.hasContent = root && root.children.length > 0;
            
            // Vérifier la présence d'éléments React
            results.hasReactContent = root && root.querySelector('[data-reactroot]') !== null;
            
            // Vérifier la présence de classes Tailwind
            results.hasTailwindClasses = root && root.querySelector('.bg-') !== null;
            
            return results;
        });
        
        let allPassed = true;
        for (const [key, value] of Object.entries(renderChecks)) {
            if (value) {
                log(`  ✓ ${key}`, 'success');
            } else {
                log(`  ✗ ${key}`, 'error');
                allPassed = false;
            }
        }
        
        if (allPassed) {
            tests.passed++;
            log('Rendu correct', 'success');
        } else {
            tests.failed++;
            tests.errors.push('Problèmes de rendu');
            log('Problèmes de rendu', 'error');
        }
        
        await page.close();
        return allPassed;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification rendu: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testComponentFunctions(browser) {
    log('Test 6: Vérification des fonctions des composants', 'info');
    try {
        const page = await browser.newPage();
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        await page.waitForFunction(() => typeof window.BetaCombinedDashboard !== 'undefined', { timeout: 15000 });
        
        const functionChecks = await page.evaluate(() => {
            const results = {};
            const dashboard = window.BetaCombinedDashboard || {};
            
            // Tester getCompanyLogo
            try {
                const logo = dashboard.getCompanyLogo ? dashboard.getCompanyLogo('AAPL') : null;
                results.getCompanyLogoWorks = logo !== null && logo !== undefined;
            } catch (e) {
                results.getCompanyLogoWorks = false;
            }
            
            // Tester setActiveTab
            try {
                if (dashboard.setActiveTab) {
                    dashboard.setActiveTab('test-tab');
                    results.setActiveTabWorks = true;
                } else {
                    results.setActiveTabWorks = false;
                }
            } catch (e) {
                results.setActiveTabWorks = false;
            }
            
            // Vérifier que les fonctions sont callables
            results.loadTickersCallable = typeof dashboard.loadTickersFromSupabase === 'function';
            results.fetchNewsCallable = typeof dashboard.fetchNews === 'function';
            results.refreshAllStocksCallable = typeof dashboard.refreshAllStocks === 'function';
            
            return results;
        });
        
        let allPassed = true;
        for (const [key, value] of Object.entries(functionChecks)) {
            if (value) {
                log(`  ✓ ${key}`, 'success');
            } else {
                log(`  ✗ ${key}`, 'error');
                allPassed = false;
            }
        }
        
        if (allPassed) {
            tests.passed++;
            log('Fonctions des composants fonctionnent', 'success');
        } else {
            tests.failed++;
            tests.errors.push('Certaines fonctions ne fonctionnent pas');
            log('Certaines fonctions ne fonctionnent pas', 'error');
        }
        
        await page.close();
        return allPassed;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification fonctions: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function runAllTests() {
    log('🚀 Démarrage des tests pour Modular Dashboard Beta', 'info');
    log(`URL: ${DASHBOARD_URL}`, 'info');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        log('\n=== Tests ===\n', 'info');
        
        await testPageLoad(browser);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testGlobalObjects(browser);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testComponents(browser);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testDependencies(browser);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testRendering(browser);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testComponentFunctions(browser);
        
        await browser.close();
        
        // Résumé
        log('\n=== Résumé ===', 'info');
        log(`Tests réussis: ${tests.passed}`, 'success');
        log(`Tests échoués: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
        
        if (tests.errors.length > 0) {
            log('\n=== Erreurs ===', 'error');
            tests.errors.forEach((error, index) => {
                log(`${index + 1}. ${error}`, 'error');
            });
        }
        
        const success = tests.failed === 0;
        if (success) {
            log('\n✅ Tous les tests sont passés !', 'success');
        } else {
            log('\n❌ Certains tests ont échoué', 'error');
        }
        
        process.exit(success ? 0 : 1);
        
    } catch (error) {
        log(`Erreur fatale: ${error.message}`, 'error');
        if (browser) await browser.close();
        process.exit(1);
    }
}

// Vérifier si le serveur est accessible
async function checkServer() {
    return new Promise((resolve) => {
        const url = new URL(DASHBOARD_URL);
        const req = http.get({
            hostname: url.hostname,
            port: url.port || 3000,
            path: url.pathname,
            timeout: 5000
        }, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Main
(async () => {
    log('Vérification de l\'accessibilité du serveur...', 'info');
    const serverAvailable = await checkServer();
    
    if (!serverAvailable) {
        log('⚠️  Le serveur n\'est pas accessible. Assurez-vous que le serveur de développement est démarré.', 'warning');
        log('   Vous pouvez démarrer le serveur avec: npm run dev ou vercel dev', 'info');
        process.exit(1);
    }
    
    await runAllTests();
})();
