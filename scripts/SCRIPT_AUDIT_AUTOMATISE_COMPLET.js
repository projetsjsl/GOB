// Script d'audit automatisé complet pour le dashboard GOB
// À exécuter dans la console du navigateur

(function() {
    const auditReport = {
        startTime: new Date().toISOString(),
        sections: [],
        errors: { critical: [], important: [], medium: [], minor: [] },
        screenshots: [],
        tradingViewWidgets: [],
        freezes: [],
        performance: []
    };

    const sections = ['Admin', 'Marchés', 'Titres', 'JLab', 'Emma', 'Tests'];
    let currentSectionIndex = 0;

    function captureSectionData(sectionName) {
        const data = {
            section: sectionName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            tradingViewWidgets: [],
            errors: [],
            warnings: [],
            freezeCheck: {},
            performance: {}
        };

        // Vérifier les widgets TradingView
        const widgets = Array.from(document.querySelectorAll('.tradingview-widget-container, [class*="tradingview"], iframe[src*="tradingview"]'));
        data.tradingViewWidgets = widgets.map(w => {
            const rect = w.getBoundingClientRect();
            return {
                visible: rect.width > 0 && rect.height > 0,
                height: rect.height,
                width: rect.width,
                src: w.src || w.querySelector('iframe')?.src || 'N/A'
            };
        });

        // Vérifier les freezes
        const bodyPE = window.getComputedStyle(document.body).pointerEvents;
        const htmlPE = window.getComputedStyle(document.documentElement).pointerEvents;
        data.freezeCheck = {
            bodyPointerEvents: bodyPE,
            htmlPointerEvents: htmlPE,
            isFrozen: bodyPE === 'none' || htmlPE === 'none'
        };

        // Performance
        if (performance.timing) {
            data.performance = {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            };
        }

        return data;
    }

    function navigateToSection(sectionName) {
        return new Promise((resolve) => {
            const button = Array.from(document.querySelectorAll('button')).find(b => 
                b.textContent.trim() === sectionName || 
                b.textContent.trim().includes(sectionName)
            );
            
            if (button) {
                button.click();
                setTimeout(() => {
                    const data = captureSectionData(sectionName);
                    auditReport.sections.push(data);
                    resolve(data);
                }, 3000); // Attendre 3 secondes pour le chargement
            } else {
                console.warn(`Bouton pour ${sectionName} non trouvé`);
                resolve(null);
            }
        });
    }

    async function runAudit() {
        console.log('🚀 Démarrage audit automatisé...');
        
        // Capturer l'état initial
        auditReport.sections.push(captureSectionData('Initial'));

        // Naviguer chaque section
        for (const section of sections) {
            console.log(`📊 Audit section: ${section}`);
            await navigateToSection(section);
            
            // Vérifier freeze (attendre max 5s)
            const startTime = Date.now();
            while (Date.now() - startTime < 5000) {
                const bodyPE = window.getComputedStyle(document.body).pointerEvents;
                if (bodyPE !== 'none') break;
                await new Promise(r => setTimeout(r, 100));
            }
        }

        // Générer rapport
        console.log('📋 Rapport d\'audit:', auditReport);
        return auditReport;
    }

    // Exposer la fonction globalement
    window.runAudit = runAudit;
    console.log('✅ Script d\'audit chargé. Exécutez: runAudit()');
})();

