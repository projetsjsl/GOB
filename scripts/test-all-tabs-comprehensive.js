/**
 * Script de test complet pour tous les onglets du dashboard
 * Teste chaque onglet 3 fois avec différentes méthodes
 */

const testResults = {
    timestamp: new Date().toISOString(),
    tests: []
};

// Liste de tous les onglets à tester
const allTabs = [
    { id: 'markets-economy', name: 'Marchés & Économie', expectedContent: ['TradingView', 'actualités', 'indices'] },
    { id: 'intellistocks', name: 'JLab™', expectedContent: ['portefeuille', 'Top Movers', 'actualités'] },
    { id: 'ask-emma', name: 'Emma IA™', expectedContent: ['Expert', 'Général', 'Titre', 'Actualités', 'Comparaison'] },
    { id: 'plus', name: 'Plus', expectedContent: ['Paramètres', 'déconnexion'] },
    { id: 'admin-jsla', name: 'Admin JSLAI', expectedContent: ['cache', 'paramètres', 'logs'] },
    { id: 'scrapping-sa', name: 'Seeking Alpha', expectedContent: ['Seeking Alpha', 'ticker'] },
    { id: 'seeking-alpha', name: 'Stocks News', expectedContent: ['analyses', 'filtres'] },
    { id: 'email-briefings', name: 'Emma En Direct', expectedContent: ['briefing', 'email'] },
    { id: 'investing-calendar', name: 'TESTS JS', expectedContent: ['Calendrier', 'TradingView', 'widgets'] }
];

/**
 * Test 1: Navigation par clic sur bouton
 */
function testMethod1_ButtonClick(tab) {
    return new Promise((resolve) => {
        const button = Array.from(document.querySelectorAll('nav button')).find(btn => {
            const text = btn.textContent || btn.innerText || '';
            return text.includes(tab.name.replace('™', '')) || text.includes(tab.name);
        });
        
        if (button) {
            button.click();
            setTimeout(() => {
                const content = document.querySelector('main')?.textContent || '';
                const hasContent = content.length > 50;
                const hasExpectedContent = tab.expectedContent.some(keyword => 
                    content.toLowerCase().includes(keyword.toLowerCase())
                );
                
                resolve({
                    method: 'Button Click',
                    success: true,
                    hasContent,
                    hasExpectedContent,
                    contentLength: content.length,
                    buttonFound: true
                });
            }, 500);
        } else {
            resolve({
                method: 'Button Click',
                success: false,
                error: 'Button not found',
                buttonFound: false
            });
        }
    });
}

/**
 * Test 2: Navigation via setActiveTab (si disponible)
 */
function testMethod2_SetActiveTab(tab) {
    return new Promise((resolve) => {
        const setActiveTab = window.BetaCombinedDashboardData?.setActiveTab || 
                           window.BetaCombinedDashboard?.setActiveTab;
        
        if (typeof setActiveTab === 'function') {
            try {
                setActiveTab(tab.id);
                setTimeout(() => {
                    const content = document.querySelector('main')?.textContent || '';
                    const hasContent = content.length > 50;
                    const hasExpectedContent = tab.expectedContent.some(keyword => 
                        content.toLowerCase().includes(keyword.toLowerCase())
                    );
                    
                    resolve({
                        method: 'setActiveTab Function',
                        success: true,
                        hasContent,
                        hasExpectedContent,
                        contentLength: content.length,
                        functionAvailable: true
                    });
                }, 500);
            } catch (e) {
                resolve({
                    method: 'setActiveTab Function',
                    success: false,
                    error: e.message,
                    functionAvailable: true
                });
            }
        } else {
            resolve({
                method: 'setActiveTab Function',
                success: false,
                error: 'setActiveTab function not available',
                functionAvailable: false
            });
        }
    });
}

/**
 * Test 3: Navigation via événement personnalisé
 */
function testMethod3_CustomEvent(tab) {
    return new Promise((resolve) => {
        const button = Array.from(document.querySelectorAll('nav button')).find(btn => {
            const text = btn.textContent || btn.innerText || '';
            return text.includes(tab.name.replace('™', '')) || text.includes(tab.name);
        });
        
        if (button) {
            try {
                // Créer un événement de clic personnalisé
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                button.dispatchEvent(clickEvent);
                
                setTimeout(() => {
                    const content = document.querySelector('main')?.textContent || '';
                    const hasContent = content.length > 50;
                    const hasExpectedContent = tab.expectedContent.some(keyword => 
                        content.toLowerCase().includes(keyword.toLowerCase())
                    );
                    
                    resolve({
                        method: 'Custom Event',
                        success: true,
                        hasContent,
                        hasExpectedContent,
                        contentLength: content.length,
                        eventDispatched: true
                    });
                }, 500);
            } catch (e) {
                resolve({
                    method: 'Custom Event',
                    success: false,
                    error: e.message,
                    eventDispatched: false
                });
            }
        } else {
            resolve({
                method: 'Custom Event',
                success: false,
                error: 'Button not found',
                eventDispatched: false
            });
        }
    });
}

/**
 * Exécuter tous les tests pour un onglet
 */
async function testTab(tab) {
    const tabResults = {
        tab: tab.name,
        id: tab.id,
        tests: []
    };
    
    // Test 1: Button Click
    const result1 = await testMethod1_ButtonClick(tab);
    tabResults.tests.push(result1);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Test 2: setActiveTab
    const result2 = await testMethod2_SetActiveTab(tab);
    tabResults.tests.push(result2);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Test 3: Custom Event
    const result3 = await testMethod3_CustomEvent(tab);
    tabResults.tests.push(result3);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Calculer le score de réussite
    const successCount = tabResults.tests.filter(t => t.success).length;
    tabResults.successRate = (successCount / tabResults.tests.length) * 100;
    tabResults.allTestsPassed = successCount === tabResults.tests.length;
    
    return tabResults;
}

/**
 * Exécuter tous les tests
 */
async function runAllTests() {
    console.log('🧪 Démarrage des tests complets pour tous les onglets...');
    
    for (const tab of allTabs) {
        console.log(`\n📋 Test de l'onglet: ${tab.name} (${tab.id})`);
        const results = await testTab(tab);
        testResults.tests.push(results);
        
        // Afficher le résumé
        console.log(`   ✅ Tests réussis: ${results.tests.filter(t => t.success).length}/3`);
        console.log(`   📊 Taux de réussite: ${results.successRate.toFixed(1)}%`);
    }
    
    // Calculer les statistiques globales
    const totalTests = testResults.tests.reduce((sum, tab) => sum + tab.tests.length, 0);
    const totalSuccess = testResults.tests.reduce((sum, tab) => 
        sum + tab.tests.filter(t => t.success).length, 0
    );
    const tabsAllPassed = testResults.tests.filter(tab => tab.allTestsPassed).length;
    
    testResults.summary = {
        totalTabs: allTabs.length,
        tabsAllPassed,
        totalTests,
        totalSuccess,
        globalSuccessRate: (totalSuccess / totalTests) * 100
    };
    
    console.log('\n📊 RÉSUMÉ GLOBAL:');
    console.log(`   Onglets testés: ${testResults.summary.totalTabs}`);
    console.log(`   Onglets avec tous tests réussis: ${testResults.summary.tabsAllPassed}`);
    console.log(`   Tests totaux: ${testResults.summary.totalTests}`);
    console.log(`   Tests réussis: ${testResults.summary.totalSuccess}`);
    console.log(`   Taux de réussite global: ${testResults.summary.globalSuccessRate.toFixed(1)}%`);
    
    return testResults;
}

// Exécuter les tests
if (typeof window !== 'undefined') {
    // Dans le navigateur
    runAllTests().then(results => {
        window.testResults = results;
        console.log('\n✅ Tests terminés! Résultats disponibles dans window.testResults');
    });
} else {
    // Node.js
    module.exports = { runAllTests, allTabs };
}

