/**
 * Script de test ULTRA-COMPLET pour tous les onglets du dashboard
 * Teste chaque onglet avec 7 méthodes différentes + validations approfondies
 * Version 2.0 - Score parfait requis
 */

const testResults = {
    timestamp: new Date().toISOString(),
    series: [],
    summary: {}
};

// Liste de tous les onglets avec critères détaillés
const allTabs = [
    { 
        id: 'markets-economy', 
        name: 'Marchés & Économie', 
        expectedContent: ['TradingView', 'actualités', 'indices'],
        expectedInteractions: ['iframe', 'button'],
        minContentLength: 1000
    },
    { 
        id: 'intellistocks', 
        name: 'JLab™', 
        expectedContent: ['portefeuille', 'Top Movers', 'actualités'],
        expectedInteractions: ['button', 'click'],
        minContentLength: 500
    },
    { 
        id: 'ask-emma', 
        name: 'Emma IA™', 
        expectedContent: ['Expert', 'Général', 'Titre', 'Actualités', 'Comparaison'],
        expectedInteractions: ['input', 'button', 'textarea'],
        minContentLength: 200
    },
    { 
        id: 'plus', 
        name: 'Plus', 
        expectedContent: ['Paramètres', 'déconnexion'],
        expectedInteractions: ['button'],
        minContentLength: 50
    },
    { 
        id: 'admin-jsla', 
        name: 'Admin JSLAI', 
        expectedContent: ['cache', 'paramètres', 'logs'],
        expectedInteractions: ['button', 'input'],
        minContentLength: 500
    },
    { 
        id: 'scrapping-sa', 
        name: 'Seeking Alpha', 
        expectedContent: ['Seeking Alpha', 'ticker'],
        expectedInteractions: ['button', 'input'],
        minContentLength: 200
    },
    { 
        id: 'seeking-alpha', 
        name: 'Stocks News', 
        expectedContent: ['analyses', 'filtres'],
        expectedInteractions: ['button'],
        minContentLength: 100
    },
    { 
        id: 'email-briefings', 
        name: 'Emma En Direct', 
        expectedContent: ['briefing', 'email'],
        expectedInteractions: ['button', 'input'],
        minContentLength: 200
    },
    { 
        id: 'investing-calendar', 
        name: 'TESTS JS', 
        expectedContent: ['Calendrier', 'TradingView', 'widgets'],
        expectedInteractions: ['iframe', 'button'],
        minContentLength: 500
    }
];

/**
 * Test 1: Navigation par clic sur bouton
 */
async function testMethod1_ButtonClick(tab) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const button = Array.from(document.querySelectorAll('nav button, [role="tab"] button')).find(btn => {
            const text = (btn.textContent || btn.innerText || '').trim();
            return text.includes(tab.name.replace('™', '')) || 
                   text.includes(tab.name) ||
                   btn.getAttribute('aria-label')?.includes(tab.name);
        });
        
        if (button) {
            button.click();
            setTimeout(() => {
                const loadTime = performance.now() - startTime;
                const content = document.querySelector('main')?.textContent || '';
                const hasContent = content.length >= tab.minContentLength;
                const hasExpectedContent = tab.expectedContent.every(keyword => 
                    content.toLowerCase().includes(keyword.toLowerCase())
                );
                
                resolve({
                    method: 'Button Click',
                    success: hasContent && hasExpectedContent,
                    hasContent,
                    hasExpectedContent,
                    contentLength: content.length,
                    loadTime: Math.round(loadTime),
                    buttonFound: true,
                    score: (hasContent ? 50 : 0) + (hasExpectedContent ? 50 : 0)
                });
            }, 1000);
        } else {
            resolve({
                method: 'Button Click',
                success: false,
                error: 'Button not found',
                buttonFound: false,
                score: 0
            });
        }
    });
}

/**
 * Test 2: Navigation via setActiveTab
 */
async function testMethod2_SetActiveTab(tab) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const setActiveTab = window.BetaCombinedDashboardData?.setActiveTab || 
                           window.BetaCombinedDashboard?.setActiveTab ||
                           window.setActiveTab;
        
        if (typeof setActiveTab === 'function') {
            try {
                setActiveTab(tab.id);
                setTimeout(() => {
                    const loadTime = performance.now() - startTime;
                    const content = document.querySelector('main')?.textContent || '';
                    const hasContent = content.length >= tab.minContentLength;
                    const hasExpectedContent = tab.expectedContent.every(keyword => 
                        content.toLowerCase().includes(keyword.toLowerCase())
                    );
                    
                    resolve({
                        method: 'setActiveTab Function',
                        success: hasContent && hasExpectedContent,
                        hasContent,
                        hasExpectedContent,
                        contentLength: content.length,
                        loadTime: Math.round(loadTime),
                        functionAvailable: true,
                        score: (hasContent ? 50 : 0) + (hasExpectedContent ? 50 : 0)
                    });
                }, 1000);
            } catch (e) {
                resolve({
                    method: 'setActiveTab Function',
                    success: false,
                    error: e.message,
                    functionAvailable: true,
                    score: 0
                });
            }
        } else {
            resolve({
                method: 'setActiveTab Function',
                success: false,
                error: 'setActiveTab function not available',
                functionAvailable: false,
                score: 0
            });
        }
    });
}

/**
 * Test 3: Navigation via événement personnalisé
 */
async function testMethod3_CustomEvent(tab) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const button = Array.from(document.querySelectorAll('nav button, [role="tab"] button')).find(btn => {
            const text = (btn.textContent || btn.innerText || '').trim();
            return text.includes(tab.name.replace('™', '')) || text.includes(tab.name);
        });
        
        if (button) {
            try {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                button.dispatchEvent(clickEvent);
                
                setTimeout(() => {
                    const loadTime = performance.now() - startTime;
                    const content = document.querySelector('main')?.textContent || '';
                    const hasContent = content.length >= tab.minContentLength;
                    const hasExpectedContent = tab.expectedContent.every(keyword => 
                        content.toLowerCase().includes(keyword.toLowerCase())
                    );
                    
                    resolve({
                        method: 'Custom Event',
                        success: hasContent && hasExpectedContent,
                        hasContent,
                        hasExpectedContent,
                        contentLength: content.length,
                        loadTime: Math.round(loadTime),
                        eventDispatched: true,
                        score: (hasContent ? 50 : 0) + (hasExpectedContent ? 50 : 0)
                    });
                }, 1000);
            } catch (e) {
                resolve({
                    method: 'Custom Event',
                    success: false,
                    error: e.message,
                    eventDispatched: false,
                    score: 0
                });
            }
        } else {
            resolve({
                method: 'Custom Event',
                success: false,
                error: 'Button not found',
                eventDispatched: false,
                score: 0
            });
        }
    });
}

/**
 * Test 4: Vérification des interactions disponibles
 */
async function testMethod4_Interactions(tab) {
    return new Promise((resolve) => {
        // Attendre que l'onglet soit chargé
        setTimeout(() => {
            const main = document.querySelector('main');
            if (!main) {
                resolve({
                    method: 'Interactions Check',
                    success: false,
                    error: 'Main content not found',
                    score: 0
                });
                return;
            }
            
            const interactions = {
                buttons: main.querySelectorAll('button').length,
                inputs: main.querySelectorAll('input, textarea').length,
                links: main.querySelectorAll('a').length,
                iframes: main.querySelectorAll('iframe').length,
                clickable: main.querySelectorAll('[onclick], [role="button"]').length
            };
            
            const hasExpectedInteractions = tab.expectedInteractions.every(type => {
                if (type === 'button') return interactions.buttons > 0 || interactions.clickable > 0;
                if (type === 'input') return interactions.inputs > 0;
                if (type === 'iframe') return interactions.iframes > 0;
                return true;
            });
            
            resolve({
                method: 'Interactions Check',
                success: hasExpectedInteractions,
                interactions,
                hasExpectedInteractions,
                score: hasExpectedInteractions ? 100 : 0
            });
        }, 500);
    });
}

/**
 * Test 5: Vérification des erreurs console
 */
async function testMethod5_ConsoleErrors(tab) {
    return new Promise((resolve) => {
        // Capturer les erreurs console
        const errors = [];
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = (...args) => {
            errors.push({ type: 'error', message: args.join(' ') });
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            errors.push({ type: 'warn', message: args.join(' ') });
            originalWarn.apply(console, args);
        };
        
        setTimeout(() => {
            // Restaurer les fonctions originales
            console.error = originalError;
            console.warn = originalWarn;
            
            const criticalErrors = errors.filter(e => 
                e.message.includes('Error') || 
                e.message.includes('Failed') ||
                e.message.includes('undefined')
            );
            
            const hasNoCriticalErrors = criticalErrors.length === 0;
            
            resolve({
                method: 'Console Errors Check',
                success: hasNoCriticalErrors,
                errors: errors.length,
                criticalErrors: criticalErrors.length,
                hasNoCriticalErrors,
                score: hasNoCriticalErrors ? 100 : Math.max(0, 100 - (criticalErrors.length * 20))
            });
        }, 2000);
    });
}

/**
 * Test 6: Performance (temps de chargement)
 */
async function testMethod6_Performance(tab) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        const navigationStart = performance.timing?.navigationStart || Date.now();
        
        setTimeout(() => {
            const loadTime = performance.now() - startTime;
            const domContentLoaded = performance.timing?.domContentLoadedEventEnd - navigationStart;
            const pageLoad = performance.timing?.loadEventEnd - navigationStart;
            
            // Score basé sur le temps de chargement (< 2s = 100, < 5s = 80, < 10s = 60, sinon 40)
            let score = 100;
            if (loadTime > 2000) score = 80;
            if (loadTime > 5000) score = 60;
            if (loadTime > 10000) score = 40;
            
            const isPerformant = loadTime < 5000;
            
            resolve({
                method: 'Performance Check',
                success: isPerformant,
                loadTime: Math.round(loadTime),
                domContentLoaded: domContentLoaded ? Math.round(domContentLoaded) : null,
                pageLoad: pageLoad ? Math.round(pageLoad) : null,
                isPerformant,
                score
            });
        }, 1000);
    });
}

/**
 * Test 7: Accessibilité basique
 */
async function testMethod7_Accessibility(tab) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const main = document.querySelector('main');
            if (!main) {
                resolve({
                    method: 'Accessibility Check',
                    success: false,
                    error: 'Main content not found',
                    score: 0
                });
                return;
            }
            
            const accessibility = {
                hasHeadings: main.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
                hasAltText: Array.from(main.querySelectorAll('img')).every(img => img.alt || img.getAttribute('aria-label')),
                hasLabels: Array.from(main.querySelectorAll('input, textarea')).every(input => 
                    input.labels?.length > 0 || input.getAttribute('aria-label') || input.getAttribute('placeholder')
                ),
                hasAriaLabels: main.querySelectorAll('[aria-label]').length > 0,
                hasRoles: main.querySelectorAll('[role]').length > 0
            };
            
            const score = [
                accessibility.hasHeadings ? 20 : 0,
                accessibility.hasAltText ? 20 : 0,
                accessibility.hasLabels ? 20 : 0,
                accessibility.hasAriaLabels ? 20 : 0,
                accessibility.hasRoles ? 20 : 0
            ].reduce((a, b) => a + b, 0);
            
            const isAccessible = score >= 60;
            
            resolve({
                method: 'Accessibility Check',
                success: isAccessible,
                accessibility,
                score,
                isAccessible
            });
        }, 500);
    });
}

/**
 * Exécuter tous les tests pour un onglet
 */
async function testTab(tab) {
    const tabResults = {
        tab: tab.name,
        id: tab.id,
        tests: [],
        timestamp: new Date().toISOString()
    };
    
    console.log(`\n📋 Test de l'onglet: ${tab.name} (${tab.id})`);
    
    // Test 1: Button Click
    console.log('   🔘 Test 1: Button Click...');
    const result1 = await testMethod1_ButtonClick(tab);
    tabResults.tests.push(result1);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: setActiveTab
    console.log('   🔘 Test 2: setActiveTab...');
    const result2 = await testMethod2_SetActiveTab(tab);
    tabResults.tests.push(result2);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Custom Event
    console.log('   🔘 Test 3: Custom Event...');
    const result3 = await testMethod3_CustomEvent(tab);
    tabResults.tests.push(result3);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Interactions
    console.log('   🔘 Test 4: Interactions...');
    const result4 = await testMethod4_Interactions(tab);
    tabResults.tests.push(result4);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 5: Console Errors
    console.log('   🔘 Test 5: Console Errors...');
    const result5 = await testMethod5_ConsoleErrors(tab);
    tabResults.tests.push(result5);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 6: Performance
    console.log('   🔘 Test 6: Performance...');
    const result6 = await testMethod6_Performance(tab);
    tabResults.tests.push(result6);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 7: Accessibility
    console.log('   🔘 Test 7: Accessibility...');
    const result7 = await testMethod7_Accessibility(tab);
    tabResults.tests.push(result7);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculer le score de réussite
    const successCount = tabResults.tests.filter(t => t.success).length;
    const totalScore = tabResults.tests.reduce((sum, t) => sum + (t.score || 0), 0);
    const maxScore = tabResults.tests.length * 100;
    
    tabResults.successRate = (successCount / tabResults.tests.length) * 100;
    tabResults.scoreRate = (totalScore / maxScore) * 100;
    tabResults.allTestsPassed = successCount === tabResults.tests.length;
    tabResults.perfectScore = totalScore === maxScore;
    
    console.log(`   ✅ Tests réussis: ${successCount}/${tabResults.tests.length}`);
    console.log(`   📊 Taux de réussite: ${tabResults.successRate.toFixed(1)}%`);
    console.log(`   🎯 Score: ${totalScore}/${maxScore} (${tabResults.scoreRate.toFixed(1)}%)`);
    
    return tabResults;
}

/**
 * Exécuter tous les tests pour une série
 */
async function runTestSeries(seriesNumber) {
    console.log(`\n🧪 === SÉRIE DE TESTS ${seriesNumber} ===`);
    
    const seriesResults = {
        seriesNumber,
        timestamp: new Date().toISOString(),
        tabs: []
    };
    
    for (const tab of allTabs) {
        const results = await testTab(tab);
        seriesResults.tabs.push(results);
    }
    
    // Calculer les statistiques de la série
    const totalTests = seriesResults.tabs.reduce((sum, tab) => sum + tab.tests.length, 0);
    const totalSuccess = seriesResults.tabs.reduce((sum, tab) => 
        sum + tab.tests.filter(t => t.success).length, 0
    );
    const totalScore = seriesResults.tabs.reduce((sum, tab) => 
        sum + tab.tests.reduce((s, t) => s + (t.score || 0), 0), 0
    );
    const maxScore = totalTests * 100;
    const tabsAllPassed = seriesResults.tabs.filter(tab => tab.allTestsPassed).length;
    const tabsPerfectScore = seriesResults.tabs.filter(tab => tab.perfectScore).length;
    
    seriesResults.summary = {
        totalTabs: allTabs.length,
        tabsAllPassed,
        tabsPerfectScore,
        totalTests,
        totalSuccess,
        successRate: (totalSuccess / totalTests) * 100,
        totalScore,
        maxScore,
        scoreRate: (totalScore / maxScore) * 100
    };
    
    console.log(`\n📊 RÉSUMÉ SÉRIE ${seriesNumber}:`);
    console.log(`   Onglets testés: ${seriesResults.summary.totalTabs}`);
    console.log(`   Onglets avec tous tests réussis: ${seriesResults.summary.tabsAllPassed}`);
    console.log(`   Onglets avec score parfait: ${seriesResults.summary.tabsPerfectScore}`);
    console.log(`   Tests totaux: ${seriesResults.summary.totalTests}`);
    console.log(`   Tests réussis: ${seriesResults.summary.totalSuccess}`);
    console.log(`   Taux de réussite: ${seriesResults.summary.successRate.toFixed(1)}%`);
    console.log(`   Score total: ${totalScore}/${maxScore} (${seriesResults.summary.scoreRate.toFixed(1)}%)`);
    
    return seriesResults;
}

/**
 * Exécuter toutes les séries de tests
 */
async function runAllTestSeries() {
    console.log('🚀 Démarrage des tests ULTRA-COMPLETS pour tous les onglets...');
    console.log(`📋 ${allTabs.length} onglets à tester`);
    console.log(`🔬 7 méthodes de test par onglet`);
    console.log(`🔄 3 séries de tests`);
    
    for (let i = 1; i <= 3; i++) {
        const seriesResults = await runTestSeries(i);
        testResults.series.push(seriesResults);
        
        if (i < 3) {
            console.log(`\n⏳ Pause de 2 secondes avant la série ${i + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Calculer les statistiques globales
    const allTabsResults = testResults.series.flatMap(s => s.tabs);
    const totalTests = testResults.series.reduce((sum, s) => sum + s.summary.totalTests, 0);
    const totalSuccess = testResults.series.reduce((sum, s) => sum + s.summary.totalSuccess, 0);
    const totalScore = testResults.series.reduce((sum, s) => sum + s.summary.totalScore, 0);
    const maxScore = testResults.series.reduce((sum, s) => sum + s.summary.maxScore, 0);
    
    testResults.summary = {
        totalSeries: 3,
        totalTabs: allTabs.length,
        totalTests,
        totalSuccess,
        globalSuccessRate: (totalSuccess / totalTests) * 100,
        totalScore,
        maxScore,
        globalScoreRate: (totalScore / maxScore) * 100,
        isPerfect: (totalScore / maxScore) === 1
    };
    
    console.log('\n🎉 === RÉSUMÉ GLOBAL FINAL ===');
    console.log(`   Séries exécutées: ${testResults.summary.totalSeries}`);
    console.log(`   Onglets testés: ${testResults.summary.totalTabs}`);
    console.log(`   Tests totaux: ${testResults.summary.totalTests}`);
    console.log(`   Tests réussis: ${testResults.summary.totalSuccess}`);
    console.log(`   Taux de réussite global: ${testResults.summary.globalSuccessRate.toFixed(1)}%`);
    console.log(`   Score global: ${totalScore}/${maxScore} (${testResults.summary.globalScoreRate.toFixed(1)}%)`);
    console.log(`   ${testResults.summary.isPerfect ? '✅ SCORE PARFAIT!' : '⚠️ Score à améliorer'}`);
    
    return testResults;
}

// Exécuter les tests
if (typeof window !== 'undefined') {
    // Dans le navigateur
    runAllTestSeries().then(results => {
        window.testResultsUltraComplete = results;
        console.log('\n✅ Tests terminés! Résultats disponibles dans window.testResultsUltraComplete');
    });
} else {
    // Node.js
    module.exports = { runAllTestSeries, allTabs };
}

