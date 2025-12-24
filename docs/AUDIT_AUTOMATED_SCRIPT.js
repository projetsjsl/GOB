/**
 * Script d'audit automatisé complet pour le Dashboard GOB
 * À exécuter dans la console du navigateur sur https://gobapps.com/beta-combined-dashboard.html
 * 
 * Usage: Copier-coller ce script dans la console et exécuter: runFullAudit()
 */

window.fullAuditReport = {
    startTime: new Date().toISOString(),
    sections: {},
    errors: [],
    warnings: [],
    visualIssues: [],
    performance: {},
    tradingViewWidgets: {},
    screenshots: []
};

window.runFullAudit = async function() {
    console.log('🔍 DÉMARRAGE AUDIT COMPLET DU DASHBOARD GOB');
    console.log('==================================================');
    
    const report = window.fullAuditReport;
    report.startTime = new Date().toISOString();
    
    // 1. Capture de l'état initial
    console.log('📸 1. Capture de l\'état initial...');
    captureInitialState();
    
    // 2. Test de toutes les sections
    const sections = [
        { id: 'admin', name: 'Admin', button: 'Admin' },
        { id: 'marches', name: 'Marchés', button: 'Marchés' },
        { id: 'titres', name: 'Titres', button: 'Titres' },
        { id: 'jlab', name: 'JLab™', button: 'JLab™' },
        { id: 'emma', name: 'Emma IA', button: 'Emma' },
        { id: 'tests', name: 'Tests', button: 'Tests' }
    ];
    
    for (const section of sections) {
        console.log(`\n🔍 Test de la section: ${section.name}`);
        await testSection(section);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s entre sections
    }
    
    // 3. Test des widgets TradingView
    console.log('\n📈 3. Test des widgets TradingView...');
    testTradingViewWidgets();
    
    // 4. Test de performance
    console.log('\n⚡ 4. Test de performance...');
    testPerformance();
    
    // 5. Génération du rapport
    report.endTime = new Date().toISOString();
    report.duration = new Date(report.endTime) - new Date(report.startTime);
    
    console.log('\n📊 RAPPORT FINAL:');
    console.log(JSON.stringify(report, null, 2));
    
    // Copier le rapport dans le clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
        console.log('✅ Rapport copié dans le clipboard!');
    });
    
    return report;
};

function captureInitialState() {
    const report = window.fullAuditReport;
    
    // Erreurs console
    const originalError = console.error;
    const originalWarn = console.warn;
    
    report.errors = [];
    report.warnings = [];
    
    console.error = function(...args) {
        report.errors.push({
            timestamp: new Date().toISOString(),
            message: args.join(' '),
            stack: new Error().stack
        });
        originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
        report.warnings.push({
            timestamp: new Date().toISOString(),
            message: args.join(' ')
        });
        originalWarn.apply(console, args);
    };
    
    // État des composants
    report.components = {
        React: typeof React !== 'undefined',
        ReactDOM: typeof ReactDOM !== 'undefined',
        ReactGridLayout: typeof ReactGridLayout !== 'undefined',
        MarketsEconomyTab: typeof window.MarketsEconomyTab !== 'undefined',
        VoiceAssistantTab: typeof window.VoiceAssistantTab !== 'undefined',
        optimizedWidgetLoader: typeof window.optimizedWidgetLoader !== 'undefined',
        DashboardGridWrapper: typeof window.DashboardGridWrapper !== 'undefined'
    };
    
    // État du DOM
    report.domState = {
        rootExists: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.length || 0,
        scriptsLoaded: document.querySelectorAll('script').length
    };
}

async function testSection(section) {
    const report = window.fullAuditReport;
    
    if (!report.sections[section.id]) {
        report.sections[section.id] = {
            name: section.name,
            errors: [],
            warnings: [],
            widgets: [],
            visualIssues: [],
            loaded: false
        };
    }
    
    const sectionReport = report.sections[section.id];
    
    // Cliquer sur le bouton de section
    const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.trim() === section.button || b.textContent.trim().includes(section.button)
    );
    
    if (!btn) {
        sectionReport.errors.push(`Bouton "${section.button}" non trouvé`);
        return;
    }
    
    btn.click();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre le chargement
    
    // Vérifier le chargement
    sectionReport.loaded = true;
    
    // Vérifier les widgets TradingView
    const tradingViewContainers = document.querySelectorAll('.tradingview-widget-container');
    const tradingViewIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => 
        iframe.src && iframe.src.includes('tradingview.com')
    );
    
    sectionReport.widgets = {
        containers: tradingViewContainers.length,
        iframes: tradingViewIframes.length,
        visible: Array.from(tradingViewContainers).filter(c => {
            const rect = c.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }).length,
        loaded: tradingViewIframes.filter(iframe => iframe.contentWindow).length
    };
    
    // Vérifier les problèmes visuels
    const emptyContainers = Array.from(document.querySelectorAll('[class*="container"], [class*="widget"]')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 100 && rect.height > 100 && el.children.length === 0;
    });
    
    sectionReport.visualIssues = emptyContainers.map(el => ({
        selector: el.className,
        dimensions: { width: el.offsetWidth, height: el.offsetHeight },
        position: { x: el.offsetLeft, y: el.offsetTop }
    }));
    
    // Vérifier les erreurs "Module non chargé"
    const errorMessages = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('Module non chargé')
    );
    
    if (errorMessages.length > 0) {
        sectionReport.errors.push({
            type: 'Module non chargé',
            count: errorMessages.length,
            elements: errorMessages.map(el => ({
                text: el.textContent.trim(),
                className: el.className
            }))
        });
    }
}

function testTradingViewWidgets() {
    const report = window.fullAuditReport;
    
    const widgets = [
        { type: 'market-overview', selector: '[data-widget-type="market-overview"]' },
        { type: 'heatmap', selector: '[data-widget-type="heatmap"]' },
        { type: 'ticker', selector: '[data-widget-type="ticker"]' },
        { type: 'symbol-overview', selector: '[data-widget-type="symbol-overview"]' },
        { type: 'advanced-chart', selector: '[data-widget-type="advanced-chart"]' },
        { type: 'economic-calendar', selector: '[data-widget-type="economic-calendar"]' }
    ];
    
    widgets.forEach(widget => {
        const elements = document.querySelectorAll(widget.selector);
        const iframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => 
            iframe.src && iframe.src.includes('tradingview.com') && 
            (iframe.closest(widget.selector) || iframe.src.includes(widget.type))
        );
        
        report.tradingViewWidgets[widget.type] = {
            found: elements.length,
            iframes: iframes.length,
            loaded: iframes.filter(iframe => iframe.contentWindow).length,
            errors: iframes.filter(iframe => {
                try {
                    return !iframe.contentWindow;
                } catch (e) {
                    return true;
                }
            }).length
        };
    });
}

function testPerformance() {
    const report = window.fullAuditReport;
    
    // Performance metrics
    const perfData = performance.getEntriesByType('navigation')[0];
    
    report.performance = {
        domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
        loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart,
        totalTime: perfData?.loadEventEnd - perfData?.fetchStart,
        memory: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        } : null
    };
    
    // Vérifier les freezes potentiels
    const longTasks = performance.getEntriesByType('longtask');
    report.performance.longTasks = longTasks.length;
    
    // Vérifier pointer-events
    const bodyPE = getComputedStyle(document.body).pointerEvents;
    const htmlPE = getComputedStyle(document.documentElement).pointerEvents;
    
    if (bodyPE === 'none' || htmlPE === 'none') {
        report.errors.push({
            type: 'pointer-events blocked',
            body: bodyPE,
            html: htmlPE
        });
    }
}

console.log('✅ Script d\'audit complet chargé!');
console.log('💡 Exécutez: runFullAudit() pour démarrer l\'audit complet');

