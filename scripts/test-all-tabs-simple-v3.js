// Script de test simplifié v3 - Test séquentiel de tous les onglets
// Ce script teste chaque onglet de manière séquentielle avec des attentes appropriées

const allTabs = [
    { 
        id: 'markets-economy', 
        name: 'Marchés & Économie', 
        buttonText: 'Marchés & Économie',
        expectedContent: ['TradingView', 'nouvelles', 'Indices'],
        minContentLength: 500
    },
    { 
        id: 'jlab', 
        name: 'JLab™', 
        buttonText: 'JLab™',
        expectedContent: ['Titres', 'portefeuille', 'watchlist'],
        minContentLength: 500
    },
    { 
        id: 'emma', 
        name: 'Emma IA™', 
        buttonText: 'Emma IA™',
        expectedContent: ['Emma', 'chat', 'message'],
        minContentLength: 300  // Réduit de 500 à 300 car l'interface peut être minimale au début
    },
    { 
        id: 'plus', 
        name: 'Plus', 
        buttonText: 'Plus',
        expectedContent: ['Paramètres', 'déconnecter'],
        minContentLength: 200
    },
    { 
        id: 'admin-jsla', 
        name: 'Admin JSLAI', 
        buttonText: 'Admin JSLAI',
        expectedContent: ['cache', 'paramètres', 'logs'],
        minContentLength: 500
    },
    { 
        id: 'seeking-alpha', 
        name: 'Seeking Alpha', 
        buttonText: 'Seeking Alpha',
        expectedContent: ['Seeking Alpha', 'ticker', 'analyses'],
        minContentLength: 500
    },
    { 
        id: 'stocks-news', 
        name: 'Stocks News', 
        buttonText: 'Stocks News',
        expectedContent: ['Titres', 'nouvelles', 'actualités'],
        minContentLength: 500
    },
    { 
        id: 'email-briefings', 
        name: 'Emma En Direct', 
        buttonText: 'Emma En Direct',
        expectedContent: ['briefing', 'email', 'générer'],
        minContentLength: 500
    },
    { 
        id: 'investing-calendar', 
        name: 'TESTS JS', 
        buttonText: 'TESTS JS',
        expectedContent: ['calendrier', 'événements', 'économique'],
        minContentLength: 500
    }
];

async function testTabSequentially(tab, index) {
    console.log(`\n=== Test ${index + 1}/9: ${tab.name} ===`);
    
    try {
        // 1. Trouver et cliquer sur le bouton de l'onglet
        // Utiliser uniquement les boutons de navigation (comme dans da3fc96)
      // La navigation peut être dans <nav> ou dans <aside nav>
      let nav = document.querySelector('nav');
      if (!nav) {
        const aside = document.querySelector('aside');
        nav = aside ? aside.querySelector('nav') : null;
      }
      if (!nav) {
        console.log(`❌ Navigation non trouvée (ni <nav> ni <aside nav>)`);
        return { success: false, method: 'Button Click', error: 'Nav not found' };
      }
      const buttons = Array.from(nav.querySelectorAll('button'));
        const tabButton = buttons.find(btn => {
            // Utiliser l'attribut title (défini dans dashboard-main.js ligne 1922)
            const title = btn.getAttribute('title');
            const text = (btn.textContent || btn.innerText || '').trim();
            return title === tab.buttonText || 
                   text === tab.buttonText || 
                   text.includes(tab.name.replace('™', '')) ||
                   title === tab.name.replace('™', '');
        });
        
        if (!tabButton) {
            console.log(`❌ Bouton "${tab.buttonText}" non trouvé`);
            return { success: false, method: 'Button Click', error: 'Button not found' };
        }
        
        // 2. Cliquer sur le bouton
        tabButton.click();
        await new Promise(r => setTimeout(r, 3000)); // Attendre 3 secondes pour le chargement
        
        // 3. Vérifier le contenu
        const mainContent = document.querySelector('main') || document.body;
        const content = mainContent.textContent || '';
        const contentLower = content.toLowerCase();
        const contentLength = content.length;
        
        // 4. Vérifier les mots-clés attendus
        const foundKeywords = tab.expectedContent.filter(keyword => 
            contentLower.includes(keyword.toLowerCase())
        );
        
        // 5. Vérifier la longueur minimale
        const hasMinLength = contentLength >= tab.minContentLength;
        
        // 6. Vérifier les erreurs console
        const consoleErrors = window.consoleErrors || [];
        const hasErrors = consoleErrors.length > 0;
        
        // 7. Calculer le score
        const keywordScore = (foundKeywords.length / tab.expectedContent.length) * 100;
        const lengthScore = hasMinLength ? 100 : (contentLength / tab.minContentLength) * 100;
        const errorScore = hasErrors ? 0 : 100;
        const totalScore = (keywordScore * 0.5) + (lengthScore * 0.3) + (errorScore * 0.2);
        
        const success = totalScore >= 70 && foundKeywords.length >= 1;
        
        console.log(`  ✓ Bouton trouvé et cliqué`);
        console.log(`  ✓ Longueur du contenu: ${contentLength} (min: ${tab.minContentLength})`);
        console.log(`  ✓ Mots-clés trouvés: ${foundKeywords.length}/${tab.expectedContent.length} (${foundKeywords.join(', ')})`);
        console.log(`  ✓ Score: ${totalScore.toFixed(2)}%`);
        if (hasErrors) {
            console.log(`  ⚠️ Erreurs console: ${consoleErrors.length}`);
        }
        
        return {
            success,
            method: 'Button Click',
            contentLength,
            foundKeywords: foundKeywords.length,
            totalKeywords: tab.expectedContent.length,
            score: totalScore,
            hasErrors,
            errorCount: consoleErrors.length
        };
        
    } catch (error) {
        console.log(`  ❌ Erreur: ${error.message}`);
        return { success: false, method: 'Button Click', error: error.message };
    }
}

async function runAllTests() {
    console.log('🚀 Démarrage des tests séquentiels de tous les onglets...\n');
    
    // Capturer les erreurs console
    window.consoleErrors = [];
    const originalError = console.error;
    console.error = function(...args) {
        window.consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    const results = [];
    
    for (let i = 0; i < allTabs.length; i++) {
        const result = await testTabSequentially(allTabs[i], i);
        results.push({
            tab: allTabs[i].name,
            ...result
        });
    }
    
    // Restaurer console.error
    console.error = originalError;
    
    // Calculer les statistiques globales
    const successful = results.filter(r => r.success).length;
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    const totalErrors = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS GLOBAUX');
    console.log('='.repeat(60));
    console.log(`✅ Tests réussis: ${successful}/${allTabs.length} (${(successful/allTabs.length*100).toFixed(1)}%)`);
    console.log(`📈 Score moyen: ${totalScore.toFixed(2)}%`);
    console.log(`⚠️ Erreurs console totales: ${totalErrors}`);
    console.log('\n📋 Détails par onglet:');
    
    results.forEach((r, i) => {
        const status = r.success ? '✅' : '❌';
        console.log(`  ${status} ${r.tab}: ${(r.score || 0).toFixed(1)}% (${r.foundKeywords || 0}/${r.totalKeywords || 0} mots-clés)`);
    });
    
    return {
        totalTabs: allTabs.length,
        successful,
        successRate: (successful / allTabs.length) * 100,
        averageScore: totalScore,
        totalErrors,
        results
    };
}

// Exécuter les tests
runAllTests().then(results => {
    window.testResults = results;
    console.log('\n✅ Tests terminés. Résultats disponibles dans window.testResults');
}).catch(error => {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
});

