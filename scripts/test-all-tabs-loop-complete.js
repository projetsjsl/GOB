/**
 * Script de test complet en boucle pour valider tous les onglets
 * Teste chaque onglet plusieurs fois pour garantir un score de 100%
 */

const allTabs = [
    { 
        id: 'markets-economy', 
        name: 'Marchés & Économie', 
        expectedContent: ['TradingView', 'nouvelles', 'Indices'],
        minContentLength: 500
    },
    { 
        id: 'intellistocks', 
        name: 'JLab™', 
        expectedContent: ['Titres', 'portefeuille', 'watchlist'],
        minContentLength: 500
    },
    { 
        id: 'ask-emma', 
        name: 'Emma IA™', 
        expectedContent: ['Emma', 'chat', 'message'],
        minContentLength: 300
    },
    { 
        id: 'plus', 
        name: 'Plus', 
        expectedContent: ['Paramètres', 'déconnecter'],
        minContentLength: 200
    },
    { 
        id: 'admin-jsla', 
        name: 'Admin JSLAI', 
        expectedContent: ['cache', 'paramètres', 'logs'],
        minContentLength: 500
    },
    { 
        id: 'scrapping-sa', 
        name: 'Seeking Alpha', 
        expectedContent: ['Seeking Alpha', 'ticker', 'analyses'],
        minContentLength: 500
    },
    { 
        id: 'seeking-alpha', 
        name: 'Stocks News', 
        expectedContent: ['Titres', 'nouvelles', 'actualités'],
        minContentLength: 500
    },
    { 
        id: 'email-briefings', 
        name: 'Emma En Direct', 
        expectedContent: ['briefing', 'email', 'générer'],
        minContentLength: 500
    },
    { 
        id: 'investing-calendar', 
        name: 'TESTS JS', 
        expectedContent: ['calendrier', 'événements', 'économique'],
        minContentLength: 500
    }
];

// Fonction pour tester un onglet
async function testTab(tab, seriesNumber, testNumber) {
    const results = {
        tab: tab.name,
        id: tab.id,
        series: seriesNumber,
        test: testNumber,
        timestamp: new Date().toISOString()
    };
    
    try {
        // 1. Vérifier que le composant existe dans window
        const componentName = getComponentName(tab.id);
        const componentExists = typeof window[componentName] !== 'undefined';
        results.componentExists = componentExists;
        
        if (!componentExists) {
            results.status = 'FAILED';
            results.error = `Composant ${componentName} non trouvé dans window`;
            return results;
        }
        
        // 2. Changer d'onglet via événement
        const event = new CustomEvent('tab-change', { detail: { tabId: tab.id } });
        window.dispatchEvent(event);
        results.eventSent = true;
        
        // 3. Attendre le rendu
        await new Promise(r => setTimeout(r, 2000));
        
        // 4. Vérifier le contenu
        const main = document.querySelector('main');
        if (!main) {
            results.status = 'FAILED';
            results.error = 'Élément main non trouvé';
            return results;
        }
        
        const content = main.textContent || '';
        const contentLength = content.length;
        const mainHTML = main.innerHTML || '';
        
        // 5. Vérifier les mots-clés attendus
        const foundKeywords = tab.expectedContent.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
        );
        const keywordsScore = (foundKeywords.length / tab.expectedContent.length) * 100;
        
        // 6. Vérifier la longueur du contenu
        const contentLengthScore = contentLength >= tab.minContentLength ? 100 : 
            (contentLength / tab.minContentLength) * 100;
        
        // 7. Vérifier que le composant est rendu
        const componentRendered = mainHTML.length > 500;
        
        // 8. Calculer le score global
        const globalScore = (keywordsScore * 0.5) + (contentLengthScore * 0.3) + (componentRendered ? 20 : 0);
        
        results.contentLength = contentLength;
        results.foundKeywords = foundKeywords;
        results.keywordsScore = keywordsScore;
        results.contentLengthScore = contentLengthScore;
        results.componentRendered = componentRendered;
        results.globalScore = globalScore;
        results.status = globalScore >= 70 ? 'SUCCESS' : 'FAILED';
        
        return results;
        
    } catch (error) {
        results.status = 'FAILED';
        results.error = error.message;
        return results;
    }
}

// Fonction pour obtenir le nom du composant depuis l'ID de l'onglet
function getComponentName(tabId) {
    const mapping = {
        'markets-economy': 'MarketsEconomyTab',
        'intellistocks': 'JLabUnifiedTab',
        'ask-emma': 'AskEmmaTab',
        'plus': 'PlusTab',
        'admin-jsla': 'AdminJSLaiTab',
        'scrapping-sa': 'ScrappingSATab',
        'seeking-alpha': 'SeekingAlphaTab',
        'email-briefings': 'EmailBriefingsTab',
        'investing-calendar': 'InvestingCalendarTab'
    };
    return mapping[tabId] || 'Unknown';
}

// Fonction pour exécuter une série de tests
async function runTestSeries(seriesNumber, numberOfTests = 3) {
    console.log(`\n🔄 === Série ${seriesNumber} de tests ===`);
    const seriesResults = [];
    
    for (let testNumber = 1; testNumber <= numberOfTests; testNumber++) {
        console.log(`\n📋 Test ${testNumber}/${numberOfTests} de la série ${seriesNumber}`);
        
        for (const tab of allTabs) {
            console.log(`  Testing ${tab.name}...`);
            const result = await testTab(tab, seriesNumber, testNumber);
            seriesResults.push(result);
            
            if (result.status === 'SUCCESS') {
                console.log(`  ✅ ${tab.name}: Score ${result.globalScore.toFixed(2)}%`);
            } else {
                console.log(`  ❌ ${tab.name}: ${result.error || 'Échec'}`);
            }
        }
    }
    
    return seriesResults;
}

// Fonction principale pour exécuter toutes les séries
async function runAllTestSeries(numberOfSeries = 3, testsPerSeries = 3) {
    console.log(`\n🚀 Démarrage des tests complets`);
    console.log(`📊 Configuration: ${numberOfSeries} séries × ${testsPerSeries} tests = ${numberOfSeries * testsPerSeries * allTabs.length} tests au total`);
    
    const allResults = [];
    
    for (let series = 1; series <= numberOfSeries; series++) {
        const seriesResults = await runTestSeries(series, testsPerSeries);
        allResults.push(...seriesResults);
        
        // Attendre un peu entre les séries
        if (series < numberOfSeries) {
            console.log(`\n⏳ Attente de 3 secondes avant la série ${series + 1}...`);
            await new Promise(r => setTimeout(r, 3000));
        }
    }
    
    // Calculer les statistiques
    const successful = allResults.filter(r => r.status === 'SUCCESS').length;
    const failed = allResults.filter(r => r.status === 'FAILED').length;
    const total = allResults.length;
    const successRate = (successful / total) * 100;
    
    // Calculer le score moyen par onglet
    const scoresByTab = {};
    allTabs.forEach(tab => {
        const tabResults = allResults.filter(r => r.id === tab.id);
        const scores = tabResults.map(r => r.globalScore || 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        scoresByTab[tab.name] = {
            averageScore: avgScore,
            successCount: tabResults.filter(r => r.status === 'SUCCESS').length,
            totalTests: tabResults.length
        };
    });
    
    // Résultats finaux
    const finalResults = {
        timestamp: new Date().toISOString(),
        configuration: {
            numberOfSeries,
            testsPerSeries,
            totalTests: total,
            tabsTested: allTabs.length
        },
        summary: {
            successful,
            failed,
            total,
            successRate: successRate.toFixed(2)
        },
        scoresByTab,
        allResults,
        perfectScore: successRate === 100 && allResults.every(r => (r.globalScore || 0) >= 90)
    };
    
    console.log(`\n📊 === RÉSULTATS FINAUX ===`);
    console.log(`✅ Réussis: ${successful}/${total} (${successRate.toFixed(2)}%)`);
    console.log(`❌ Échoués: ${failed}/${total}`);
    console.log(`\n📈 Scores moyens par onglet:`);
    Object.entries(scoresByTab).forEach(([name, stats]) => {
        console.log(`  ${name}: ${stats.averageScore.toFixed(2)}% (${stats.successCount}/${stats.totalTests} réussis)`);
    });
    
    if (finalResults.perfectScore) {
        console.log(`\n🎉 SCORE PARFAIT ATTEINT ! (100% de réussite avec scores >= 90%)`);
    } else {
        console.log(`\n⚠️ Score non parfait. Améliorations nécessaires.`);
    }
    
    // Stocker les résultats dans window pour récupération
    window.testLoopResults = finalResults;
    
    return finalResults;
}

// Exécuter les tests si le script est exécuté directement
if (typeof window !== 'undefined') {
    // Attendre que la page soit chargée
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => runAllTestSeries(3, 3), 5000);
        });
    } else {
        setTimeout(() => runAllTestSeries(3, 3), 5000);
    }
}

