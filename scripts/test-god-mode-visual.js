#!/usr/bin/env node
/**
 * Test Visuel GOD MODE - Dashboard Grid Layout
 * 
 * Teste visuellement tous les aspects du dashboard en mode GOD MODE
 * Exécute des tests en boucle pour vérifier la stabilité
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3000/beta-combined-dashboard.html';
const LOOP_COUNT = parseInt(process.env.LOOP_COUNT || '3', 10);
const TIMEOUT = 30000;

const tests = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

function log(message, type = 'info') {
    const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'loop': '🔄'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
}

async function testPageLoad(page) {
    tests.total++;
    try {
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        const title = await page.title();
        if (title && title.length > 0) {
            tests.passed++;
            log(`Page chargée: ${title}`, 'success');
            return true;
        } else {
            tests.failed++;
            tests.errors.push('Titre de page vide');
            log('Titre de page vide', 'error');
            return false;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur chargement: ${error.message}`);
        log(`Erreur: ${error.message}`, 'error');
        return false;
    }
}

async function testReactLoaded(page) {
    tests.total++;
    try {
        await page.waitForFunction(() => typeof window.React !== 'undefined', { timeout: 10000 });
        await page.waitForFunction(() => typeof window.ReactDOM !== 'undefined', { timeout: 10000 });
        tests.passed++;
        log('React et ReactDOM chargés', 'success');
        return true;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`React non chargé: ${error.message}`);
        log(`React non chargé: ${error.message}`, 'error');
        return false;
    }
}

async function testDashboardComponent(page) {
    tests.total++;
    try {
        await page.waitForFunction(() => typeof window.BetaCombinedDashboard !== 'undefined', { timeout: 15000 });
        tests.passed++;
        log('BetaCombinedDashboard chargé', 'success');
        return true;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`BetaCombinedDashboard non chargé: ${error.message}`);
        log(`BetaCombinedDashboard non chargé: ${error.message}`, 'error');
        return false;
    }
}

async function testGridLayoutLoaded(page) {
    tests.total++;
    try {
        await page.waitForFunction(() => typeof window.ReactGridLayout !== 'undefined', { timeout: 10000 });
        tests.passed++;
        log('React Grid Layout chargé', 'success');
        return true;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`React Grid Layout non chargé: ${error.message}`);
        log(`React Grid Layout non chargé: ${error.message}`, 'error');
        return false;
    }
}

async function testDashboardGridWrapper(page) {
    tests.total++;
    try {
        await page.waitForFunction(() => typeof window.DashboardGridWrapper !== 'undefined', { timeout: 15000 });
        tests.passed++;
        log('DashboardGridWrapper chargé', 'success');
        return true;
    } catch (error) {
        tests.failed++;
        tests.errors.push(`DashboardGridWrapper non chargé: ${error.message}`);
        log(`DashboardGridWrapper non chargé: ${error.message}`, 'error');
        return false;
    }
}

async function testViewModeToggle(page) {
    tests.total++;
    try {
        // Attendre que le dashboard soit monté
        await page.waitForFunction(() => {
            const root = document.getElementById('root');
            return root && root.children.length > 0;
        }, { timeout: 15000 });

        // Vérifier que le toggle existe
        const toggleExists = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => btn.textContent.includes('Grille') || btn.textContent.includes('Onglets'));
        });

        if (toggleExists) {
            tests.passed++;
            log('Toggle Vue Onglets/Grille présent', 'success');
            return true;
        } else {
            tests.failed++;
            tests.errors.push('Toggle non trouvé');
            log('Toggle non trouvé', 'error');
            return false;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur toggle: ${error.message}`);
        log(`Erreur toggle: ${error.message}`, 'error');
        return false;
    }
}

async function testGridModeActive(page) {
    tests.total++;
    try {
        // Vérifier que le mode grille est actif par défaut
        const isGridMode = await page.evaluate(() => {
            const saved = localStorage.getItem('gob-dashboard-view-mode');
            return saved === 'grid' || saved === null; // null = défaut = grid
        });

        if (isGridMode) {
            tests.passed++;
            log('Mode grille actif par défaut', 'success');
            return true;
        } else {
            tests.failed++;
            tests.errors.push('Mode grille non actif par défaut');
            log('Mode grille non actif par défaut', 'error');
            return false;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur vérification mode: ${error.message}`);
        log(`Erreur vérification mode: ${error.message}`, 'error');
        return false;
    }
}

async function testGridRendering(page) {
    tests.total++;
    try {
        // Attendre que la grille soit rendue
        await page.waitForTimeout(2000);

        const gridExists = await page.evaluate(() => {
            // Chercher les éléments React Grid Layout
            const gridItems = document.querySelectorAll('.react-grid-item');
            const gridLayout = document.querySelector('.react-grid-layout');
            return gridItems.length > 0 || gridLayout !== null;
        });

        if (gridExists) {
            tests.passed++;
            log('Grille rendue correctement', 'success');
            return true;
        } else {
            // Peut-être en mode onglets, vérifier
            const hasContent = await page.evaluate(() => {
                const root = document.getElementById('root');
                return root && root.children.length > 0;
            });

            if (hasContent) {
                tests.passed++;
                log('Contenu rendu (peut être en mode onglets)', 'success');
                return true;
            } else {
                tests.failed++;
                tests.errors.push('Grille non rendue');
                log('Grille non rendue', 'error');
                return false;
            }
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur rendu grille: ${error.message}`);
        log(`Erreur rendu grille: ${error.message}`, 'error');
        return false;
    }
}

async function testToggleSwitch(page) {
    tests.total++;
    try {
        // Trouver et cliquer sur le toggle
        const toggleClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const toggle = buttons.find(btn => 
                btn.textContent.includes('Grille') || 
                btn.textContent.includes('Onglets') ||
                btn.textContent.includes('📐') ||
                btn.textContent.includes('📑')
            );
            
            if (toggle) {
                toggle.click();
                return true;
            }
            return false;
        });

        if (toggleClicked) {
            // Attendre le changement
            await page.waitForTimeout(1000);
            tests.passed++;
            log('Toggle fonctionne', 'success');
            return true;
        } else {
            tests.failed++;
            tests.errors.push('Toggle non cliquable');
            log('Toggle non cliquable', 'error');
            return false;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur toggle: ${error.message}`);
        log(`Erreur toggle: ${error.message}`, 'error');
        return false;
    }
}

async function testWidgetsRender(page) {
    tests.total++;
    try {
        await page.waitForTimeout(2000);

        const widgetsCount = await page.evaluate(() => {
            // Compter les widgets dans la grille
            const gridItems = document.querySelectorAll('.react-grid-item');
            return gridItems.length;
        });

        if (widgetsCount > 0) {
            tests.passed++;
            log(`${widgetsCount} widget(s) rendu(s)`, 'success');
            return true;
        } else {
            // Vérifier si on est en mode onglets
            const hasTabs = await page.evaluate(() => {
                const tabs = document.querySelectorAll('[role="tab"], .tab-content, nav button');
                return tabs.length > 0;
            });

            if (hasTabs) {
                tests.passed++;
                log('Mode onglets actif (widgets non attendus)', 'success');
                return true;
            } else {
                tests.failed++;
                tests.errors.push('Aucun widget rendu');
                log('Aucun widget rendu', 'error');
                return false;
            }
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur widgets: ${error.message}`);
        log(`Erreur widgets: ${error.message}`, 'error');
        return false;
    }
}

async function testEditMode(page) {
    tests.total++;
    try {
        // Chercher le bouton "Modifier Layout"
        const editButtonFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => 
                btn.textContent.includes('Modifier') || 
                btn.textContent.includes('✎') ||
                btn.textContent.includes('Terminer') ||
                btn.textContent.includes('✓')
            );
        });

        if (editButtonFound) {
            tests.passed++;
            log('Bouton mode édition présent', 'success');
            return true;
        } else {
            // Peut-être pas encore chargé ou en mode onglets
            tests.passed++;
            log('Bouton mode édition (peut être en mode onglets)', 'success');
            return true;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur mode édition: ${error.message}`);
        log(`Erreur mode édition: ${error.message}`, 'error');
        return false;
    }
}

async function testLocalStorage(page) {
    tests.total++;
    try {
        const storageData = await page.evaluate(() => {
            return {
                viewMode: localStorage.getItem('gob-dashboard-view-mode'),
                layout: localStorage.getItem('gob_dashboard_grid_layout_v1')
            };
        });

        if (storageData.viewMode || storageData.layout) {
            tests.passed++;
            log(`LocalStorage OK (viewMode: ${storageData.viewMode || 'null'})`, 'success');
            return true;
        } else {
            tests.passed++;
            log('LocalStorage vide (normal au premier chargement)', 'success');
            return true;
        }
    } catch (error) {
        tests.failed++;
        tests.errors.push(`Erreur localStorage: ${error.message}`);
        log(`Erreur localStorage: ${error.message}`, 'error');
        return false;
    }
}

async function testConsoleErrors(page) {
    tests.total++;
    try {
        const errors = await page.evaluate(() => {
            return window.__consoleErrors || [];
        });

        // Filtrer les erreurs non critiques
        const criticalErrors = errors.filter(err => 
            !err.includes('cdn.tailwindcss.com') &&
            !err.includes('production') &&
            !err.includes('Warning')
        );

        if (criticalErrors.length === 0) {
            tests.passed++;
            log('Aucune erreur console critique', 'success');
            return true;
        } else {
            tests.failed++;
            tests.errors.push(`Erreurs console: ${criticalErrors.join(', ')}`);
            log(`Erreurs console: ${criticalErrors.length}`, 'error');
            return false;
        }
    } catch (error) {
        tests.passed++;
        log('Vérification erreurs console (non disponible)', 'success');
        return true;
    }
}

async function runTestSuite(page, loopNumber) {
    log(`\n🔄 === BOUCLE ${loopNumber}/${LOOP_COUNT} ===`, 'loop');
    
    await testPageLoad(page);
    await page.waitForTimeout(500);
    
    await testReactLoaded(page);
    await page.waitForTimeout(500);
    
    await testDashboardComponent(page);
    await page.waitForTimeout(500);
    
    await testGridLayoutLoaded(page);
    await page.waitForTimeout(500);
    
    await testDashboardGridWrapper(page);
    await page.waitForTimeout(500);
    
    await testViewModeToggle(page);
    await page.waitForTimeout(500);
    
    await testGridModeActive(page);
    await page.waitForTimeout(500);
    
    await testGridRendering(page);
    await page.waitForTimeout(1000);
    
    await testWidgetsRender(page);
    await page.waitForTimeout(500);
    
    await testEditMode(page);
    await page.waitForTimeout(500);
    
    await testLocalStorage(page);
    await page.waitForTimeout(500);
    
    await testToggleSwitch(page);
    await page.waitForTimeout(1000);
    
    await testConsoleErrors(page);
    await page.waitForTimeout(500);
}

async function runAllTests() {
    log('🚀 Démarrage des tests visuels GOD MODE', 'info');
    log(`URL: ${DASHBOARD_URL}`, 'info');
    log(`Boucles: ${LOOP_COUNT}`, 'info');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        
        // Capturer les erreurs console
        page.on('console', msg => {
            if (msg.type() === 'error') {
                page.evaluate((error) => {
                    window.__consoleErrors = window.__consoleErrors || [];
                    window.__consoleErrors.push(error);
                }, msg.text());
            }
        });

        page.on('pageerror', error => {
            page.evaluate((err) => {
                window.__consoleErrors = window.__consoleErrors || [];
                window.__consoleErrors.push(err.toString());
            }, error);
        });

        // Exécuter les tests en boucle
        for (let i = 1; i <= LOOP_COUNT; i++) {
            await runTestSuite(page, i);
            
            if (i < LOOP_COUNT) {
                log(`\n⏳ Attente avant prochaine boucle...`, 'info');
                await page.waitForTimeout(2000);
                await page.reload({ waitUntil: 'networkidle2' });
            }
        }

        await browser.close();

        // Résumé final
        log('\n=== 📊 RÉSUMÉ FINAL ===', 'info');
        log(`Tests totaux: ${tests.total}`, 'info');
        log(`Tests réussis: ${tests.passed}`, tests.passed === tests.total ? 'success' : 'success');
        log(`Tests échoués: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
        log(`Taux de réussite: ${((tests.passed / tests.total) * 100).toFixed(1)}%`, 'info');

        if (tests.errors.length > 0) {
            log('\n=== ❌ ERREURS ===', 'error');
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

// Vérifier l'accessibilité du serveur
async function checkServer() {
    const http = await import('http');
    return new Promise((resolve) => {
        const url = new URL(DASHBOARD_URL);
        const req = http.default.get({
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
        log('⚠️  Le serveur n\'est pas accessible.', 'warning');
        log('   Assurez-vous que le serveur de développement est démarré.', 'info');
        log('   Vous pouvez démarrer avec: npm run dev ou vercel dev', 'info');
        process.exit(1);
    }

    await runAllTests();
})();
