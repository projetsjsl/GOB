/**
 * Test Visuel GOD MODE - Console Browser
 * 
 * A copier-coller dans la console du navigateur pour tester le GOD MODE
 * Execute des tests en boucle pour verifier la stabilite
 * 
 * Usage: Copier tout ce code dans la console du navigateur sur beta-combined-dashboard.html
 */

(function() {
    'use strict';

    const LOOP_COUNT = 3;
    const DELAY_BETWEEN_TESTS = 500;
    const DELAY_BETWEEN_LOOPS = 2000;

    const tests = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    function log(message, type = 'info') {
        const styles = {
            'info': 'color: #3b82f6',
            'success': 'color: #10b981; font-weight: bold',
            'error': 'color: #ef4444; font-weight: bold',
            'warning': 'color: #f59e0b',
            'loop': 'color: #8b5cf6; font-weight: bold'
        };
        const prefix = {
            'info': 'i',
            'success': '',
            'error': '',
            'warning': '',
            'loop': ''
        }[type] || 'i';
        console.log(`%c${prefix} ${message}`, styles[type] || '');
    }

    function test(name, testFn) {
        tests.total++;
        try {
            const result = testFn();
            if (result === true || (typeof result === 'object' && result !== null)) {
                tests.passed++;
                log(`${name}`, 'success');
                return true;
            } else {
                tests.failed++;
                tests.errors.push(name);
                log(`${name} - ECHEC`, 'error');
                return false;
            }
        } catch (error) {
            tests.failed++;
            tests.errors.push(`${name}: ${error.message}`);
            log(`${name} - ERREUR: ${error.message}`, 'error');
            return false;
        }
    }

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Tests individuels
    const testSuite = {
        'React charge': () => typeof window.React !== 'undefined',
        'ReactDOM charge': () => typeof window.ReactDOM !== 'undefined',
        'React Grid Layout charge': () => typeof window.ReactGridLayout !== 'undefined',
        'BetaCombinedDashboard expose': () => typeof window.BetaCombinedDashboard !== 'undefined',
        'DashboardGridWrapper expose': () => typeof window.DashboardGridWrapper !== 'undefined',
        'Toggle present dans DOM': () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => 
                btn.textContent.includes('Grille') || 
                btn.textContent.includes('Onglets') ||
                btn.textContent.includes('') ||
                btn.textContent.includes('')
            );
        },
        'Mode grille par defaut': () => {
            const saved = localStorage.getItem('gob-dashboard-view-mode');
            return saved === 'grid' || saved === null;
        },
        'Root element present': () => {
            const root = document.getElementById('root');
            return root !== null && root.children.length > 0;
        },
        'Grille ou contenu rendu': () => {
            const gridItems = document.querySelectorAll('.react-grid-item');
            const gridLayout = document.querySelector('.react-grid-layout');
            const hasTabs = document.querySelectorAll('[role="tab"], .tab-content, nav button').length > 0;
            return gridItems.length > 0 || gridLayout !== null || hasTabs;
        },
        'LocalStorage accessible': () => {
            try {
                localStorage.setItem('__test__', 'test');
                localStorage.removeItem('__test__');
                return true;
            } catch {
                return false;
            }
        },
        'Composants RGL charges': () => {
            return typeof window.MarketsEconomyTabRGL !== 'undefined' ||
                   typeof window.RglDashboard !== 'undefined';
        },
        'Composants tabs charges': () => {
            return typeof window.JLabTab !== 'undefined' ||
                   typeof window.AskEmmaTab !== 'undefined' ||
                   typeof window.StocksNewsTab !== 'undefined';
        }
    };

    async function runTestSuite(loopNumber) {
        log(`\n === BOUCLE ${loopNumber}/${LOOP_COUNT} ===`, 'loop');
        log(`Timestamp: ${new Date().toLocaleTimeString()}`, 'info');

        // Executer tous les tests
        for (const [testName, testFn] of Object.entries(testSuite)) {
            test(testName, testFn);
            await sleep(DELAY_BETWEEN_TESTS);
        }

        // Test visuel de la grille
        test('Widgets visibles', () => {
            const gridItems = document.querySelectorAll('.react-grid-item');
            const hasContent = document.getElementById('root')?.children.length > 0;
            return gridItems.length > 0 || hasContent;
        });

        await sleep(DELAY_BETWEEN_TESTS);

        // Test du toggle
        test('Toggle cliquable', async () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const toggle = buttons.find(btn => 
                btn.textContent.includes('Grille') || 
                btn.textContent.includes('Onglets')
            );
            if (toggle) {
                toggle.click();
                await sleep(1000);
                return true;
            }
            return false;
        });

        await sleep(DELAY_BETWEEN_TESTS);

        // Test mode edition
        test('Bouton mode edition present', () => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => 
                btn.textContent.includes('Modifier') || 
                btn.textContent.includes('') ||
                btn.textContent.includes('Terminer')
            );
        });
    }

    async function runAllTests() {
        console.clear();
        log(' Demarrage des tests visuels GOD MODE', 'info');
        log(`URL: ${window.location.href}`, 'info');
        log(`Boucles: ${LOOP_COUNT}`, 'info');
        log(`Delai entre tests: ${DELAY_BETWEEN_TESTS}ms`, 'info');
        log(`Delai entre boucles: ${DELAY_BETWEEN_LOOPS}ms`, 'info');

        // Reinitialiser les stats
        tests.total = 0;
        tests.passed = 0;
        tests.failed = 0;
        tests.errors = [];

        // Executer les boucles
        for (let i = 1; i <= LOOP_COUNT; i++) {
            await runTestSuite(i);
            
            if (i < LOOP_COUNT) {
                log(`\n Attente ${DELAY_BETWEEN_LOOPS}ms avant prochaine boucle...`, 'info');
                await sleep(DELAY_BETWEEN_LOOPS);
                
                // Recharger la page pour la prochaine boucle
                log(' Rechargement de la page...', 'loop');
                window.location.reload();
                return; // Le script s'arretera ici, relancer manuellement pour les autres boucles
            }
        }

        // Resume final
        log('\n===  RESUME FINAL ===', 'info');
        log(`Tests totaux: ${tests.total}`, 'info');
        log(`Tests reussis: ${tests.passed}`, tests.passed === tests.total ? 'success' : 'success');
        log(`Tests echoues: ${tests.failed}`, tests.failed > 0 ? 'error' : 'success');
        log(`Taux de reussite: ${((tests.passed / tests.total) * 100).toFixed(1)}%`, 'info');

        if (tests.errors.length > 0) {
            log('\n===  ERREURS ===', 'error');
            tests.errors.forEach((error, index) => {
                log(`${index + 1}. ${error}`, 'error');
            });
        }

        const success = tests.failed === 0;
        if (success) {
            log('\n Tous les tests sont passes !', 'success');
        } else {
            log('\n Certains tests ont echoue', 'error');
        }

        // Exposer les resultats globalement
        window.__GOD_MODE_TEST_RESULTS = {
            total: tests.total,
            passed: tests.passed,
            failed: tests.failed,
            errors: tests.errors,
            successRate: ((tests.passed / tests.total) * 100).toFixed(1) + '%'
        };

        return tests;
    }

    // Demarrer automatiquement
    log(' Script de test GOD MODE charge', 'info');
    log(' Tapez: runGodModeTests() pour demarrer', 'info');
    log(' Ou: runGodModeTests(5) pour 5 boucles', 'info');

    // Exposer la fonction globalement
    window.runGodModeTests = async function(loopCount = LOOP_COUNT) {
        const originalLoopCount = LOOP_COUNT;
        Object.defineProperty(testSuite, 'LOOP_COUNT', { value: loopCount, writable: false });
        return await runAllTests();
    };

    // Auto-demarrer si demande
    if (window.location.search.includes('autotest=true')) {
        setTimeout(() => runAllTests(), 2000);
    }

    console.log('%c Script de test GOD MODE pret!', 'color: #10b981; font-weight: bold; font-size: 14px');
    console.log('%c Executez: runGodModeTests()', 'color: #3b82f6; font-size: 12px');
})();
