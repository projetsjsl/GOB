/**
 * Script d'audit marathon automatique
 * À exécuter dans la console du navigateur
 */

(function() {
    'use strict';
    
    const auditResults = {
        startTime: new Date().toISOString(),
        sections: {},
        errors: [],
        warnings: [],
        screenshots: [],
        freezes: []
    };
    
    function checkFreeze() {
        const bodyPE = window.getComputedStyle(document.body).pointerEvents;
        const htmlPE = window.getComputedStyle(document.documentElement).pointerEvents;
        if (bodyPE === 'none' || htmlPE === 'none') {
            auditResults.freezes.push({
                timestamp: new Date().toISOString(),
                type: 'pointer-events',
                bodyPE: bodyPE,
                htmlPE: htmlPE
            });
            return true;
        }
        return false;
    }
    
    function auditTradingViewWidgets() {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        const tradingViewIframes = iframes.filter(iframe => 
            iframe.src && iframe.src.includes('tradingview.com')
        );
        
        const widgets = {
            marketOverview: tradingViewIframes.filter(iframe => iframe.src.includes('market-overview')).length,
            heatmap: tradingViewIframes.filter(iframe => iframe.src.includes('heatmap')).length,
            screener: tradingViewIframes.filter(iframe => iframe.src.includes('screener')).length,
            ticker: tradingViewIframes.filter(iframe => iframe.src.includes('ticker')).length,
            total: tradingViewIframes.length
        };
        
        const widgetDivs = Array.from(document.querySelectorAll('.tradingview-widget-container__widget'));
        const widgetStatus = widgetDivs.map((div, index) => {
            const iframe = div.querySelector('iframe');
            const rect = div.getBoundingClientRect();
            return {
                index: index,
                hasIframe: !!iframe,
                iframeSrc: iframe ? iframe.src.substring(0, 80) : null,
                visible: rect.width > 0 && rect.height > 0,
                dimensions: { width: rect.width, height: rect.height }
            };
        });
        
        return { widgets, widgetDivs: widgetDivs.length, widgetStatus };
    }
    
    function auditSection(sectionName) {
        const sectionData = {
            timestamp: new Date().toISOString(),
            frozen: checkFreeze(),
            tradingView: auditTradingViewWidgets(),
            errors: [],
            warnings: []
        };
        
        // Vérifier les widgets TradingView manquants
        if (sectionData.tradingView.widgetDivs > 0 && sectionData.tradingView.widgets.total === 0) {
            sectionData.errors.push(`CRITIQUE: ${sectionData.tradingView.widgetDivs} containers mais 0 widgets TradingView chargés`);
        }
        
        // Vérifier les widgets invisibles
        sectionData.tradingView.widgetStatus.forEach(status => {
            if (status.hasIframe && !status.visible) {
                sectionData.warnings.push(`Widget ${status.index} invisible`);
            }
        });
        
        auditResults.sections[sectionName] = sectionData;
        return sectionData;
    }
    
    async function navigateAndAudit(sectionName, buttonText) {
        console.log(`🔍 Audit section: ${sectionName}`);
        
        // Cliquer sur le bouton
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent && b.textContent.trim() === buttonText
        );
        
        if (!btn) {
            auditResults.errors.push(`Bouton "${buttonText}" introuvable pour section ${sectionName}`);
            return null;
        }
        
        btn.click();
        
        // Attendre le chargement
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Vérifier freeze
        if (checkFreeze()) {
            console.warn(`⚠️ FREEZE détecté dans ${sectionName}`);
            window.forceUnfreeze && window.forceUnfreeze();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return auditSection(sectionName);
    }
    
    // API publique
    window.marathonAudit = {
        start: async function() {
            console.log('🚀 Démarrage audit marathon...');
            
            // Audit page initiale
            auditSection('Page Initiale');
            
            // Audit Admin
            await navigateAndAudit('Admin', 'Admin');
            
            // Audit Marchés
            await navigateAndAudit('Marchés', 'Marchés');
            
            // Audit Titres
            await navigateAndAudit('Titres', 'Titres');
            
            // Audit JLab
            await navigateAndAudit('JLab', 'JLab');
            
            // Audit Emma
            await navigateAndAudit('Emma', 'Emma');
            
            // Audit Tests
            await navigateAndAudit('Tests', 'Tests');
            
            auditResults.endTime = new Date().toISOString();
            console.log('✅ Audit terminé!');
            console.log('📊 Résultats:', auditResults);
            
            // Générer rapport
            const report = generateReport();
            console.log('📄 Rapport:', report);
            
            return auditResults;
        },
        getResults: () => auditResults,
        generateReport: generateReport
    };
    
    function generateReport() {
        const totalErrors = auditResults.errors.length + 
            Object.values(auditResults.sections).reduce((sum, s) => sum + s.errors.length, 0);
        const totalWarnings = auditResults.warnings.length + 
            Object.values(auditResults.sections).reduce((sum, s) => sum + s.warnings.length, 0);
        
        return {
            summary: {
                startTime: auditResults.startTime,
                endTime: auditResults.endTime,
                totalErrors: totalErrors,
                totalWarnings: totalWarnings,
                freezes: auditResults.freezes.length,
                sectionsAudited: Object.keys(auditResults.sections).length
            },
            details: auditResults
        };
    }
    
    console.log('✅ Script d\'audit marathon chargé!');
    console.log('💡 Exécutez: marathonAudit.start() pour démarrer');
})();

