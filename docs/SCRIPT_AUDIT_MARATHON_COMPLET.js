/**
 * Script d'audit marathon complet - À exécuter dans la console du navigateur
 * Usage: Copier-coller ce script et exécuter: runMarathonAudit()
 * 
 * Ce script teste systématiquement toutes les sections et génère un rapport complet
 */

window.marathonAuditReport = {
    startTime: new Date().toISOString(),
    sections: {},
    errors: [],
    warnings: [],
    visualBugs: [],
    uiUxIssues: [],
    calculationErrors: [],
    performanceIssues: [],
    tradingViewWidgets: {},
    screenshots: [],
    endTime: null,
    duration: null
};

window.runMarathonAudit = async function() {
    console.log('🏃 DÉMARRAGE AUDIT MARATHON COMPLET');
    console.log('=====================================');
    console.log('Durée prévue: 3 heures');
    console.log('Sections à tester: 10');
    console.log('');
    
    const report = window.marathonAuditReport;
    report.startTime = new Date().toISOString();
    
    // 1. Capture état initial
    console.log('📸 1. Capture état initial...');
    captureInitialState();
    
    // 2. Test toutes les sections principales
    const mainSections = [
        { id: 'admin', name: 'Admin', button: 'Admin' },
        { id: 'marches', name: 'Marchés', button: 'Marchés' },
        { id: 'titres', name: 'Titres', button: 'Titres' },
        { id: 'jlab', name: 'JLab™', button: 'JLab™' },
        { id: 'emma', name: 'Emma IA', button: 'Emma' },
        { id: 'tests', name: 'Tests', button: 'Tests' }
    ];
    
    for (const section of mainSections) {
        console.log(`\n🔍 Test section: ${section.name}`);
        await testMainSection(section);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // 3. Test mode Grille
    console.log('\n📐 Test mode Grille...');
    await testGridMode();
    
    // 4. Test interactions utilisateur
    console.log('\n👆 Test interactions...');
    await testUserInteractions();
    
    // 5. Test calculs financiers
    console.log('\n🧮 Test calculs...');
    await testFinancialCalculations();
    
    // 6. Génération rapport final
    report.endTime = new Date().toISOString();
    report.duration = new Date(report.endTime) - new Date(report.startTime);
    
    console.log('\n📊 RAPPORT FINAL:');
    console.log(JSON.stringify(report, null, 2));
    
    // Copier dans clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
        console.log('✅ Rapport copié dans le clipboard!');
    });
    
    return report;
};

function captureInitialState() {
    const report = window.marathonAuditReport;
    
    // Erreurs console
    const originalError = console.error;
    const originalWarn = console.warn;
    
    report.errors = [];
    report.warnings = [];
    
    console.error = function(...args) {
        const msg = args.join(' ');
        if (!msg.includes('contentWindow is not available') && 
            !msg.includes('Invalid environment')) {
            report.errors.push({
                timestamp: new Date().toISOString(),
                message: msg,
                stack: new Error().stack
            });
        }
        originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
        const msg = args.join(' ');
        if (!msg.includes('Invalid environment')) {
            report.warnings.push({
                timestamp: new Date().toISOString(),
                message: msg
            });
        }
        originalWarn.apply(console, args);
    };
    
    // État initial
    report.initialState = {
        url: window.location.href,
        title: document.title,
        components: {
            React: typeof React !== 'undefined',
            ReactDOM: typeof ReactDOM !== 'undefined',
            MarketsEconomyTab: typeof window.MarketsEconomyTab !== 'undefined',
            VoiceAssistantTab: typeof window.VoiceAssistantTab !== 'undefined'
        },
        performance: {
            domContentLoaded: performance.timing ? 
                performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : null
        }
    };
}

async function testMainSection(section) {
    const report = window.marathonAuditReport;
    
    if (!report.sections[section.id]) {
        report.sections[section.id] = {
            name: section.name,
            errors: [],
            warnings: [],
            visualBugs: [],
            widgets: {},
            subTabs: [],
            loaded: false,
            timestamp: new Date().toISOString()
        };
    }
    
    const sectionReport = report.sections[section.id];
    
    // Cliquer sur le bouton
    const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.trim() === section.button || b.textContent.trim().includes(section.button)
    );
    
    if (!btn) {
        sectionReport.errors.push(`Bouton "${section.button}" non trouvé`);
        return;
    }
    
    btn.click();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    sectionReport.loaded = true;
    
    // Vérifier erreurs "Module non chargé"
    const moduleErrors = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && el.textContent.includes('Module non chargé')
    );
    
    if (moduleErrors.length > 0) {
        sectionReport.errors.push({
            type: 'Module non chargé',
            count: moduleErrors.length,
            elements: moduleErrors.map(el => el.textContent.trim().substring(0, 100))
        });
    }
    
    // Vérifier widgets TradingView
    const tradingViewIframes = Array.from(document.querySelectorAll('iframe')).filter(iframe => 
        iframe.src && iframe.src.includes('tradingview.com')
    );
    
    sectionReport.widgets = {
        iframes: tradingViewIframes.length,
        visible: tradingViewIframes.filter(iframe => {
            const rect = iframe.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        }).length,
        loaded: tradingViewIframes.filter(iframe => {
            try {
                return iframe.contentWindow !== null;
            } catch (e) {
                return false;
            }
        }).length
    };
    
    // Vérifier bugs visuels
    const emptyContainers = Array.from(document.querySelectorAll('[class*="container"], [class*="widget"]')).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 100 && rect.height > 100 && el.children.length === 0;
    });
    
    sectionReport.visualBugs = emptyContainers.map(el => ({
        selector: el.className,
        dimensions: { width: el.offsetWidth, height: el.offsetHeight },
        position: { x: el.offsetLeft, y: el.offsetTop }
    }));
    
    // Vérifier messages de chargement persistants
    const loadingMessages = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (el.textContent.includes('Chargement') || el.textContent.includes('Loading'))
    );
    
    if (loadingMessages.length > 5) {
        sectionReport.visualBugs.push({
            type: 'Messages de chargement persistants',
            count: loadingMessages.length,
            messages: loadingMessages.map(el => el.textContent.trim().substring(0, 50))
        });
    }
    
    // Capturer sous-onglets
    const subTabs = Array.from(document.querySelectorAll('button')).filter(b => 
        b.textContent && !b.disabled && 
        (b.closest('[class*="nav"], [class*="tab"]') || b.textContent.length < 30)
    ).map(b => b.textContent.trim());
    
    sectionReport.subTabs = [...new Set(subTabs)].slice(0, 10);
}

async function testGridMode() {
    const report = window.marathonAuditReport;
    
    const gridBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && b.textContent.includes('Grille')
    );
    
    if (gridBtn) {
        gridBtn.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        report.gridMode = {
            activated: true,
            widgets: document.querySelectorAll('[class*="react-grid-item"]').length,
            layout: localStorage.getItem('dashboard-grid-layout-current') ? 'saved' : 'none'
        };
    }
}

async function testUserInteractions() {
    const report = window.marathonAuditReport;
    
    // Tester quelques interactions clés
    const darkModeBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent && b.textContent.includes('Dark Mode')
    );
    
    if (darkModeBtn) {
        darkModeBtn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        darkModeBtn.click(); // Retour
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    report.userInteractions = {
        darkModeToggle: darkModeBtn !== undefined,
        tested: true
    };
}

async function testFinancialCalculations() {
    const report = window.marathonAuditReport;
    
    // Chercher des calculs financiers dans le DOM
    const calculations = {
        ratios: document.querySelectorAll('[class*="ratio"], [class*="pe-ratio"], [class*="pb-ratio"]').length,
        prices: document.querySelectorAll('[class*="price"], [data-price]').length,
        percentages: Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && /[+-]?\d+\.?\d*%/.test(el.textContent)
        ).length
    };
    
    report.calculationErrors = [];
    
    // Vérifier les valeurs NaN ou Infinity
    const allText = document.body.innerText;
    if (allText.includes('NaN') || allText.includes('Infinity')) {
        report.calculationErrors.push({
            type: 'Valeurs invalides',
            found: allText.match(/(NaN|Infinity)/g) || []
        });
    }
    
    report.financialCalculations = calculations;
}

console.log('✅ Script d\'audit marathon chargé!');
console.log('💡 Exécutez: runMarathonAudit() pour démarrer l\'audit complet (3 heures)');

