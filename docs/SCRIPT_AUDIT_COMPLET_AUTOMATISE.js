/**
 * Script d'audit complet automatisé
 * À exécuter dans la console du navigateur pour audit approfondi
 */

(function() {
    'use strict';
    
    const auditResults = {
        startTime: new Date().toISOString(),
        sections: {},
        errors: [],
        warnings: [],
        freezes: [],
        screenshots: [],
        performance: {}
    };
    
    // Fonction de test de freeze
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
    
    // Audit widgets TradingView
    function auditTradingViewWidgets() {
        const widgetDivs = Array.from(document.querySelectorAll('.tradingview-widget-container__widget'));
        const iframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => 
            iframe.src && (iframe.src.includes('tradingview.com') || iframe.src.includes('tradingview-widget.com'))
        );
        
        const widgets = {
            marketOverview: iframes.filter(iframe => iframe.src.includes('market-overview')).length,
            heatmap: iframes.filter(iframe => iframe.src.includes('heatmap')).length,
            screener: iframes.filter(iframe => iframe.src.includes('screener')).length,
            ticker: iframes.filter(iframe => iframe.src.includes('ticker')).length,
            total: iframes.length
        };
        
        const widgetStatus = widgetDivs.map((div, index) => {
            const iframe = div.querySelector('iframe');
            const rect = div.getBoundingClientRect();
            return {
                index: index,
                hasIframe: !!iframe,
                visible: rect.height > 200,
                height: rect.height,
                iframeHeight: iframe ? iframe.getBoundingClientRect().height : 0
            };
        });
        
        return { widgets, widgetDivs: widgetDivs.length, widgetStatus };
    }
    
    // Audit section complète
    function auditSection(sectionName) {
        const sectionData = {
            timestamp: new Date().toISOString(),
            frozen: checkFreeze(),
            tradingView: auditTradingViewWidgets(),
            errors: [],
            warnings: [],
            loadingMessages: 0,
            stockData: { count: 0, tickersRequested: 0 }
        };
        
        // Vérifier widgets TradingView
        if (sectionData.tradingView.widgetDivs > 0) {
            const invisibleWidgets = sectionData.tradingView.widgetStatus.filter(w => !w.visible);
            if (invisibleWidgets.length > 0) {
                sectionData.errors.push(`CRITIQUE: ${invisibleWidgets.length} widgets TradingView invisibles`);
            }
        }
        
        // Vérifier messages de chargement persistants
        const loadingMessages = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && (el.textContent.includes('Chargement') || el.textContent.includes('Loading')) && 
            window.getComputedStyle(el).display !== 'none'
        );
        sectionData.loadingMessages = loadingMessages.length;
        if (loadingMessages.length > 5) {
            sectionData.warnings.push(`${loadingMessages.length} messages "Chargement" persistants`);
        }
        
        // Vérifier données stocks
        const stockData = window.stockData || {};
        const tickers = window.teamTickers || [];
        sectionData.stockData = {
            count: Object.keys(stockData).length,
            tickersRequested: tickers.length
        };
        
        if (tickers.length > 0 && Object.keys(stockData).length === 0) {
            sectionData.warnings.push(`Données stocks manquantes: ${tickers.length} tickers mais 0 données`);
        }
        
        auditResults.sections[sectionName] = sectionData;
        return sectionData;
    }
    
    // Navigation et audit automatique
    async function navigateAndAudit(sectionName, buttonText, waitTime = 5000) {
        console.log(`🔍 Audit section: ${sectionName}`);
        
        const btn = Array.from(document.querySelectorAll('button')).find(b => 
            b.textContent && b.textContent.trim() === buttonText
        );
        
        if (!btn) {
            auditResults.errors.push(`Bouton "${buttonText}" introuvable pour section ${sectionName}`);
            return null;
        }
        
        btn.click();
        
        // Attendre avec vérification de freeze
        await new Promise(resolve => {
            let elapsed = 0;
            const checkInterval = setInterval(() => {
                elapsed += 100;
                if (checkFreeze()) {
                    console.warn(`⚠️ FREEZE détecté dans ${sectionName}`);
                    window.forceUnfreeze && window.forceUnfreeze();
                }
                if (elapsed >= waitTime) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
        
        return auditSection(sectionName);
    }
    
    // API publique
    window.completeAudit = {
        start: async function() {
            console.log('🚀 Démarrage audit complet automatisé...');
            
            // Audit page initiale
            auditSection('Page Initiale');
            
            // Audit toutes les sections
            await navigateAndAudit('Admin', 'Admin');
            await navigateAndAudit('Marchés', 'Marchés', 8000);
            await navigateAndAudit('Titres', 'Titres');
            await navigateAndAudit('JLab', 'JLab');
            await navigateAndAudit('Emma', 'Emma');
            await navigateAndAudit('Tests', 'Tests');
            
            auditResults.endTime = new Date().toISOString();
            console.log('✅ Audit terminé!');
            console.log('📊 Résultats:', auditResults);
            
            return auditResults;
        },
        getResults: () => auditResults,
        auditSection: auditSection
    };
    
    console.log('✅ Script d\'audit complet chargé!');
    console.log('💡 Exécutez: completeAudit.start() pour démarrer');
})();

