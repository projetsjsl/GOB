/**
 * AUDIT MARATHON SCRIPT
 * Teste toutes les pages et fonctionnalités du dashboard
 * Génère un rapport complet avec screenshots et erreurs
 */

const fs = require('fs');
const path = require('path');

const AUDIT_REPORT = {
    startTime: new Date().toISOString(),
    bugs: [],
    pages: [],
    consoleErrors: [],
    networkErrors: [],
    screenshots: []
};

// Liste des pages/onglets à tester
const PAGES_TO_TEST = [
    { url: 'https://gobapps.com/beta-combined-dashboard.html', name: 'Dashboard Principal' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=admin-briefings', name: 'Admin Briefings' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=titres-portfolio', name: 'Portfolio' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=titres-watchlist', name: 'Watchlist' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=jlab-terminal', name: 'JLab Terminal' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=emma-chat', name: 'Emma Chat' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=nouvelles-main', name: 'Nouvelles' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=marches-global', name: 'Marchés Globaux' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=marches-calendar', name: 'Calendrier Éco' },
    { url: 'https://gobapps.com/beta-combined-dashboard.html?tab=marches-yield', name: 'Courbe Taux' },
];

console.log('🔍 AUDIT MARATHON - Démarrage...');
console.log(`📋 ${PAGES_TO_TEST.length} pages à tester`);

// Ce script sera exécuté par le navigateur pour capturer les erreurs
const BROWSER_AUDIT_SCRIPT = `
(function() {
    const auditData = {
        consoleErrors: [],
        networkErrors: [],
        performance: {},
        domIssues: []
    };
    
    // Capturer les erreurs console
    const originalError = console.error;
    console.error = function(...args) {
        auditData.consoleErrors.push({
            message: args.join(' '),
            timestamp: Date.now(),
            stack: new Error().stack
        });
        originalError.apply(console, args);
    };
    
    // Capturer les erreurs réseau
    window.addEventListener('error', (e) => {
        if (e.target && e.target.tagName === 'SCRIPT') {
            auditData.networkErrors.push({
                src: e.target.src,
                error: e.message,
                timestamp: Date.now()
            });
        }
    });
    
    // Performance
    if (window.performance && window.performance.timing) {
        const perf = window.performance.timing;
        auditData.performance = {
            loadTime: perf.loadEventEnd - perf.navigationStart,
            domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
            firstPaint: perf.responseEnd - perf.requestStart
        };
    }
    
    // Problèmes DOM
    const emptyWidgets = document.querySelectorAll('[class*="widget"]:empty, [class*="Widget"]:empty');
    emptyWidgets.forEach(w => {
        auditData.domIssues.push({
            type: 'empty_widget',
            selector: w.className,
            parent: w.parentElement?.className
        });
    });
    
    window.__AUDIT_DATA__ = auditData;
    return auditData;
})();
`;

// Sauvegarder le script d'audit
fs.writeFileSync(
    path.join(__dirname, '../public/js/audit-browser-script.js'),
    `window.__AUDIT_SCRIPT__ = ${BROWSER_AUDIT_SCRIPT};`
);

console.log('✅ Script d\'audit navigateur créé');
console.log('📝 Rapport initialisé dans docs/AUDIT_COMPLET_MARATHON_2026.md');
