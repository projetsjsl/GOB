/**
 * Script d'audit automatisé pour le Dashboard GOB
 * À exécuter dans la console du navigateur
 */

window.auditDashboard = async function() {
    const results = {
        startTime: new Date().toISOString(),
        sections: {},
        errors: [],
        warnings: [],
        visualIssues: [],
        performance: {}
    };

    // Fonction pour capturer l'état d'une section
    const auditSection = (sectionName) => {
        const sectionResults = {
            name: sectionName,
            timestamp: new Date().toISOString(),
            errors: [],
            warnings: [],
            widgets: {},
            components: {},
            visualIssues: []
        };

        // Vérifier les erreurs de console
        const consoleErrors = window.lastConsoleErrors || [];
        sectionResults.errors = consoleErrors.filter(e => 
            e.timestamp > (Date.now() - 5000) // Erreurs des 5 dernières secondes
        );

        // Vérifier les widgets TradingView
        const tradingViewContainers = document.querySelectorAll('.tradingview-widget-container');
        const tradingViewIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => 
            iframe.src && iframe.src.includes('tradingview.com')
        );
        sectionResults.widgets = {
            containers: tradingViewContainers.length,
            iframes: tradingViewIframes.length,
            visible: Array.from(tradingViewContainers).filter(c => {
                const rect = c.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            }).length
        };

        // Vérifier les composants chargés
        sectionResults.components = {
            MarketsEconomyTab: typeof window.MarketsEconomyTab !== 'undefined',
            optimizedWidgetLoader: typeof window.optimizedWidgetLoader !== 'undefined',
            DashboardGridWrapper: typeof window.DashboardGridWrapper !== 'undefined',
            JLabTab: typeof window.JLabTab !== 'undefined',
            AskEmmaTab: typeof window.AskEmmaTab !== 'undefined',
            StocksNewsTab: typeof window.StocksNewsTab !== 'undefined'
        };

        // Vérifier les problèmes visuels
        const emptyContainers = Array.from(document.querySelectorAll('[class*="container"], [class*="widget"]')).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 100 && rect.height > 100 && el.children.length === 0;
        });
        sectionResults.visualIssues = emptyContainers.map(el => ({
            selector: el.className,
            dimensions: { width: el.offsetWidth, height: el.offsetHeight }
        }));

        return sectionResults;
    };

    // Tester chaque section
    const sections = ['Admin', 'Marchés', 'Titres', 'JLab™', 'Emma', 'Tests'];
    
    for (const section of sections) {
        console.log(`🔍 Audit de la section: ${section}`);
        
        // Cliquer sur le bouton de section
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent.trim() === section || b.textContent.trim().includes(section)
        );
        
        if (btn) {
            btn.click();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre le chargement
            
            results.sections[section] = auditSection(section);
        } else {
            results.warnings.push(`Bouton de section "${section}" non trouvé`);
        }
    }

    results.endTime = new Date().toISOString();
    results.duration = new Date(results.endTime) - new Date(results.startTime);

    console.log('📊 Résultats de l\'audit:', results);
    return results;
};

console.log('✅ Script d\'audit chargé. Exécutez: auditDashboard()');

